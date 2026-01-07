"""
Migration script להצפנת סיסמאות קיימות
הרץ את הסקריפט הזה פעם אחת כדי להצפין את כל הסיסמאות הקיימות

שימוש:
    python migrate_passwords.py
"""

import json
import os
from werkzeug.security import generate_password_hash

USERS_FILE = 'users_db.json'
BACKUP_FILE = 'users_db.json.backup'

def migrate_passwords():
    """מצפין את כל הסיסמאות בקובץ users_db.json"""
    
    # בדיקה אם הקובץ קיים
    if not os.path.exists(USERS_FILE):
        print(f"❌ קובץ {USERS_FILE} לא נמצא!")
        return False
    
    # יצירת backup
    print(f"📦 יוצר backup ל-{BACKUP_FILE}...")
    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        users_data = json.load(f)
    
    with open(BACKUP_FILE, 'w', encoding='utf-8') as f:
        json.dump(users_data, f, ensure_ascii=False, indent=4)
    print(f"✅ Backup נוצר בהצלחה!")
    
    # הצפנת סיסמאות
    print("\n🔐 מתחיל להצפין סיסמאות...")
    migrated = 0
    
    for user_id, user_info in users_data.items():
        password = user_info.get('password', '')
        
        # בדיקה אם הסיסמה כבר מוצפנת (מתחיל ב-pbkdf2:sha256)
        if password.startswith('pbkdf2:sha256:'):
            print(f"  ⏭️  {user_id}: הסיסמה כבר מוצפנת, מדלג...")
            continue
        
        # הצפנת הסיסמה
        if password:
            hashed_password = generate_password_hash(password)
            user_info['password'] = hashed_password
            migrated += 1
            print(f"  ✅ {user_id}: הסיסמה הוצפנה בהצלחה")
        else:
            print(f"  ⚠️  {user_id}: אין סיסמה, מדלג...")
    
    # שמירת הקובץ המעודכן
    if migrated > 0:
        print(f"\n💾 שומר את הקובץ המעודכן...")
        with open(USERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(users_data, f, ensure_ascii=False, indent=4)
        print(f"✅ {migrated} סיסמאות הוצפנו בהצלחה!")
        print(f"\n⚠️  חשוב: שמור את קובץ ה-backup ({BACKUP_FILE}) במקום בטוח!")
        return True
    else:
        print("\nℹ️  לא נמצאו סיסמאות שצריך להצפין.")
        return False

if __name__ == '__main__':
    import sys
    import io
    # Set UTF-8 encoding for Windows
    if sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    
    print("=" * 50)
    print("Migration Script - הצפנת סיסמאות")
    print("=" * 50)
    print()
    
    # אם הועבר argument --yes, דלג על אישור
    if '--yes' not in sys.argv:
        try:
            response = input("האם אתה בטוח שברצונך להצפין את כל הסיסמאות? (yes/no): ")
            if response.lower() != 'yes':
                print("❌ הפעלה בוטלה.")
                exit(0)
        except (EOFError, KeyboardInterrupt):
            print("❌ הפעלה בוטלה.")
            exit(0)
    else:
        print("⚠️  מריץ אוטומטית (--yes flag detected)")
        print()
    
    success = migrate_passwords()
    
    if success:
        print("\n" + "=" * 50)
        print("✅ Migration הושלם בהצלחה!")
        print("=" * 50)
        print("\n📝 הנחיות:")
        print("1. בדוק שאפשר להתחבר עם המשתמשים הקיימים")
        print("2. אם הכל תקין, תוכל למחוק את קובץ ה-backup")
        print("3. עדכן את כל המשתמשים לשנות את הסיסמאות שלהם")
    else:
        print("\n❌ Migration נכשל.")

