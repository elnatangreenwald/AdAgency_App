import os
from sqlalchemy import create_engine, text

# בנינו את הכתובת המלאה מהפרטים שמצאת:
DB_URL = "postgresql://postgres:DFrkbNgoxpwQBGzKnBHQQQixkiFrkIDc@yamabiko.proxy.rlwy.net:30707/railway"

def fix_database():
    print("--- מתחבר לשרת ב-Railway ומבצע עדכון מבנה ---")
    try:
        # יצירת חיבור למסד הנתונים
        engine = create_engine(DB_URL)
        
        with engine.connect() as conn:
            print("מעדכן עמודות בטבלת clients...")
            
            # הוספת העמודות שחסרות כרגע ב-database.py שלך
            conn.execute(text("ALTER TABLE clients ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;"))
            conn.execute(text("ALTER TABLE clients ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;"))
            conn.execute(text("ALTER TABLE clients ADD COLUMN IF NOT EXISTS archived_at VARCHAR;"))
            
            # שמירת השינויים בשרת
            conn.commit()
            print("\n✅ הצלחה! הטבלה ב-Railway עודכנה.")
            print("עכשיו ה'מנעולים' בשרת מתאימים ל'מפתחות' בקוד.")
            
    except Exception as e:
        print(f"\n❌ שגיאה בהתחברות: {str(e)}")

if __name__ == "__main__":
    fix_database()