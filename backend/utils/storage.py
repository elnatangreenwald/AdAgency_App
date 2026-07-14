"""
Object Storage Utilities (Cloudflare R2 / S3-compatible)

מרכז את כל הגישה לאחסון האובייקטים של קבצי הסטודיו. הקבצים לא עוברים דרך
שרת ה-Flask אלא עולים/יורדים ישירות מהדפדפן מול R2 באמצעות presigned URLs.
זה חוסך זיכרון ו-workers בשרת, עוקף את מגבלת ה-120 שניות של gunicorn, והכי חשוב -
הקבצים לא נמחקים בכל דיפלוי (בניגוד לתיקיית static/ הזמנית ב-Railway).

Environment variables required:
    R2_ACCOUNT_ID         - Cloudflare account id (for the default endpoint)
    R2_ACCESS_KEY_ID      - R2 API token access key
    R2_SECRET_ACCESS_KEY  - R2 API token secret
    R2_BUCKET             - bucket name
    R2_ENDPOINT           - (optional) override full endpoint url
"""
import os
import uuid

try:
    import boto3
    from botocore.config import Config as BotoConfig
    from botocore.exceptions import BotoCoreError, ClientError
    _BOTO_AVAILABLE = True
except Exception:  # boto3 not installed
    boto3 = None
    BotoConfig = None
    BotoCoreError = Exception
    ClientError = Exception
    _BOTO_AVAILABLE = False


# Presigned URL lifetime (seconds). Large uploads can take a while, so keep this
# generous but bounded.
UPLOAD_URL_TTL = int(os.environ.get('R2_UPLOAD_URL_TTL', str(60 * 60)))       # 1h
DOWNLOAD_URL_TTL = int(os.environ.get('R2_DOWNLOAD_URL_TTL', str(60 * 30)))    # 30m


def _get_config():
    return {
        'account_id': os.environ.get('R2_ACCOUNT_ID'),
        'access_key': os.environ.get('R2_ACCESS_KEY_ID'),
        'secret_key': os.environ.get('R2_SECRET_ACCESS_KEY'),
        'bucket': os.environ.get('R2_BUCKET'),
        'endpoint': os.environ.get('R2_ENDPOINT'),
    }


def is_configured():
    """True only if boto3 is installed and the R2 credentials are present."""
    if not _BOTO_AVAILABLE:
        return False
    cfg = _get_config()
    if not (cfg['access_key'] and cfg['secret_key'] and cfg['bucket']):
        return False
    # Need either an explicit endpoint or an account id to build one
    return bool(cfg['endpoint'] or cfg['account_id'])


def _endpoint_url(cfg):
    if cfg['endpoint']:
        return cfg['endpoint'].rstrip('/')
    return f"https://{cfg['account_id']}.r2.cloudflarestorage.com"


def _get_client():
    """Build an S3 client pointed at R2. Raises RuntimeError if not configured."""
    if not is_configured():
        raise RuntimeError('R2 storage is not configured (missing env vars or boto3)')
    cfg = _get_config()
    return boto3.client(
        's3',
        endpoint_url=_endpoint_url(cfg),
        aws_access_key_id=cfg['access_key'],
        aws_secret_access_key=cfg['secret_key'],
        region_name='auto',
        config=BotoConfig(signature_version='s3v4'),
    )


def build_object_key(request_id, original_filename, kind='deliverable'):
    """Create a unique, collision-safe object key while keeping a readable suffix.

    kind: 'source' (raw material from requester) or 'deliverable' (finished work).
    """
    ext = ''
    if original_filename and '.' in original_filename:
        ext = '.' + original_filename.rsplit('.', 1)[1].lower()
    safe_kind = kind if kind in ('source', 'deliverable') else 'file'
    return f"studio/{request_id}/{safe_kind}/{uuid.uuid4().hex}{ext}"


def generate_upload_url(object_key, content_type=None):
    """Return a presigned PUT url the browser can upload the file to directly."""
    client = _get_client()
    cfg = _get_config()
    params = {'Bucket': cfg['bucket'], 'Key': object_key}
    if content_type:
        params['ContentType'] = content_type
    return client.generate_presigned_url(
        'put_object', Params=params, ExpiresIn=UPLOAD_URL_TTL
    )


def generate_download_url(object_key, download_name=None):
    """Return a presigned GET url so the browser downloads the file directly."""
    client = _get_client()
    cfg = _get_config()
    params = {'Bucket': cfg['bucket'], 'Key': object_key}
    if download_name:
        # Force a download with the original file name
        params['ResponseContentDisposition'] = (
            f'attachment; filename="{download_name}"'
        )
    return client.generate_presigned_url(
        'get_object', Params=params, ExpiresIn=DOWNLOAD_URL_TTL
    )


def delete_object(object_key):
    """Best-effort delete of a single object. Returns True on success."""
    try:
        client = _get_client()
        cfg = _get_config()
        client.delete_object(Bucket=cfg['bucket'], Key=object_key)
        return True
    except (BotoCoreError, ClientError, RuntimeError) as e:
        print(f"[STORAGE] Failed to delete {object_key}: {e}")
        return False
