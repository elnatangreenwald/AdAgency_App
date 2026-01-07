"""
קובץ זה מסייע בהגדרת שליחת מייל
הרץ את הקובץ הזה כדי להגדיר משתני סביבה למייל
"""

import os
import sys

print("=" * 60)
print("הגדרת שליחת מייל למערכת ותקין")
print("=" * 60)
print()

# קבלת פרטים מהמשתמש
email = input("הזן את כתובת ה-Gmail שלך: ").strip()
password = input("הזן את App Password (nhvi efyc emwf gatv): ").strip() or "nhvi efyc emwf gatv"

# הגדרת משתני סביבה (Windows)
if sys.platform == "win32":
    os.system(f'setx SMTP_USERNAME "{email}"')
    os.system(f'setx SMTP_PASSWORD "{password}"')
    os.system(f'setx SMTP_SERVER "smtp.gmail.com"')
    os.system(f'setx SMTP_PORT "587"')
    print()
    print("✅ משתני הסביבה הוגדרו!")
    print("⚠️  חשוב: נדרש להפעיל מחדש את הטרמינל/שרת Flask כדי שההגדרות ייכנסו לתוקף")
else:
    # Linux/Mac
    with open(os.path.expanduser("~/.bashrc"), "a") as f:
        f.write(f'\nexport SMTP_USERNAME="{email}"\n')
        f.write(f'export SMTP_PASSWORD="{password}"\n')
        f.write(f'export SMTP_SERVER="smtp.gmail.com"\n')
        f.write(f'export SMTP_PORT="587"\n')
    print()
    print("✅ משתני הסביבה נוספו לקובץ ~/.bashrc")
    print("⚠️  הרץ: source ~/.bashrc או פתח טרמינל חדש")

print()
print("=" * 60)

