# Railway Deployment Guide - PostgreSQL Migration

## Current Situation

Your Flask app currently uses **JSON files** for data storage:
- `agency_db.json` (clients/projects)
- `users_db.json`
- `suppliers_db.json`
- `quotes_db.json`
- `messages_db.json`
- `events_db.json`
- `equipment_bank.json`
- `checklist_templates.json`
- `forms_db.json`
- `permissions_db.json`
- `user_activity.json`

**⚠️ Problem**: Railway's filesystem is ephemeral. Data in JSON files will be **lost on every deployment**!

## Solution: PostgreSQL Database

I've created a PostgreSQL migration system that:
1. Uses PostgreSQL (persistent, shared across deployments)
2. Maintains backward compatibility (can still use JSON files locally)
3. Uses JSONB columns for complex nested data structures
4. Provides drop-in replacement functions

## Step-by-Step Deployment

### 1. Add PostgreSQL to Your Railway Project

1. Go to your Railway project dashboard
2. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically create a PostgreSQL database
4. The `DATABASE_URL` environment variable will be automatically set

### 2. Set Environment Variables

In Railway dashboard, add these environment variables:

- `USE_DATABASE=true` - **This enables database mode**
- `SECRET_KEY` - Your Flask secret key (generate a strong one)
- `FLASK_ENV=production`
- `GOOGLE_CLIENT_ID` - Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth client secret
- `GOOGLE_REDIRECT_URI` - Your Railway app URL + `/auth/google/callback`
- Any other environment variables your app needs

### 3. Run Migration Script (One Time)

**Option A: Run locally before deploying**
```bash
# Set DATABASE_URL to your Railway PostgreSQL connection string
export DATABASE_URL="postgresql://user:password@host:port/database"
# Or get it from Railway dashboard → PostgreSQL → Connect → Connection URL

# Run migration
python migrate_json_to_db.py
```

**Option B: Run on Railway after first deployment**
1. Deploy your app to Railway
2. In Railway dashboard, go to your service
3. Click **"Deployments"** → **"View Logs"**
4. Use Railway's CLI or connect via SSH to run:
   ```bash
   python migrate_json_to_db.py
   ```

**Option C: Add migration to startup (recommended)**
The migration script checks for existing data, so it's safe to run multiple times. You can add it to your deployment process.

### 4. Update app.py to Use Database Helpers

You need to replace the JSON load/save functions in `app.py` with the database helpers. The easiest way is to add this at the top of `app.py` (after imports):

```python
# Use database helpers if USE_DATABASE is enabled
if os.environ.get('USE_DATABASE', 'false').lower() == 'true':
    from database_helpers import (
        load_users, save_users, load_data, save_data,
        load_suppliers, save_suppliers, load_quotes, save_quotes,
        load_messages, save_messages, load_events, save_events,
        load_equipment_bank, save_equipment_bank,
        load_checklist_templates, save_checklist_templates,
        load_forms, save_forms
    )
```

This way, when `USE_DATABASE=true`, it will use PostgreSQL. Otherwise, it uses JSON files (for local development).

### 5. Deploy to Railway

1. Push your code to GitHub/GitLab
2. Connect Railway to your repository
3. Railway will automatically:
   - Install dependencies from `requirements.txt`
   - Run your app using gunicorn (from `Procfile`)
   - Use the `PORT` environment variable

### 6. Verify Deployment

1. Check Railway logs to ensure no errors
2. Visit your app URL
3. Test login and data operations
4. Verify data persists after a redeployment

## Files Created

1. **`database.py`** - SQLAlchemy models and database connection
2. **`database_helpers.py`** - Drop-in replacement functions for JSON load/save
3. **`migrate_json_to_db.py`** - Migration script to import JSON data to PostgreSQL
4. **`requirements.txt`** - Updated with SQLAlchemy and psycopg2-binary

## Important Notes

### Backward Compatibility

- **Local Development**: Keep `USE_DATABASE=false` (or unset) to use JSON files locally
- **Production (Railway)**: Set `USE_DATABASE=true` to use PostgreSQL

### Data Migration

- The migration script is **idempotent** (safe to run multiple times)
- It checks for existing records before inserting
- **Backup your JSON files** before running migration!

### Database Schema

The database uses:
- **Regular columns** for simple fields (names, IDs, numbers)
- **JSONB columns** for complex nested structures (projects, tasks, etc.)
- This allows PostgreSQL to query JSON data efficiently while maintaining flexibility

### Connection String

Railway automatically provides `DATABASE_URL`. The code handles the `postgres://` → `postgresql://` conversion automatically.

## Troubleshooting

### "No module named 'psycopg2'"
- Make sure `psycopg2-binary==2.9.9` is in `requirements.txt`
- Railway will install it automatically on deploy

### "Connection refused" or "Database does not exist"
- Check that PostgreSQL service is running in Railway
- Verify `DATABASE_URL` is set correctly
- The connection string should start with `postgresql://`

### "Table does not exist"
- Run `python migrate_json_to_db.py` to create tables
- Or the migration script will create them automatically

### Data not persisting
- Make sure `USE_DATABASE=true` is set in Railway
- Check that migration script ran successfully
- Verify database connection in Railway logs

## Next Steps

1. **Test locally first**: Set up a local PostgreSQL database and test the migration
2. **Backup JSON files**: Keep copies of all your JSON files
3. **Deploy to Railway**: Follow the steps above
4. **Monitor**: Check Railway logs after deployment
5. **Verify**: Test that data persists after redeployment

## Rollback Plan

If you need to rollback:
1. Set `USE_DATABASE=false` in Railway
2. Your app will fall back to JSON files (but they'll be empty on Railway)
3. Restore JSON files from backup if needed
4. Redeploy

---

**Need Help?** Check Railway's documentation or logs for specific error messages.

