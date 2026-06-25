"""
Cleanup script: Remove auto-generated "applause" charges from PostgreSQL database.
Run with DATABASE_URL set to your Railway connection string.

Usage (PowerShell):
    $env:DATABASE_URL="postgresql://user:password@host:port/database"; python scripts/cleanup_applause_charges_db.py

Usage (bash/Linux/Mac):
    DATABASE_URL="postgresql://..." python scripts/cleanup_applause_charges_db.py
"""
import os
import sys

DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set!")
    print("\nHow to get it:")
    print("  1. Go to Railway Dashboard")
    print("  2. Click on PostgreSQL database")
    print("  3. Click Connect -> Connection URL")
    print("\nThen run:")
    print('  $env:DATABASE_URL="postgresql://..."; python scripts/cleanup_applause_charges_db.py')
    sys.exit(1)

# Fix Railway's postgres:// prefix
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
Session = sessionmaker(bind=engine)


def is_applause_charge(title: str) -> bool:
    """Check if charge title matches auto-generated applause pattern."""
    t = (title or "").strip()
    return t.startswith("מחיאות כפיים") or t.startswith("\U0001f44f ")  # 👏


def main():
    db = Session()
    try:
        # Fetch all clients with their extra_charges
        result = db.execute(text("SELECT id, name, extra_charges FROM clients"))
        rows = result.fetchall()

        total_removed = 0
        clients_affected = 0

        for row in rows:
            client_id, client_name, extra_charges = row
            if not extra_charges:
                continue

            original_count = len(extra_charges)
            filtered = [ch for ch in extra_charges if not is_applause_charge(ch.get('title', ''))]
            removed_count = original_count - len(filtered)

            if removed_count > 0:
                # Update the client's extra_charges
                db.execute(
                    text("UPDATE clients SET extra_charges = :charges WHERE id = :cid"),
                    {"charges": filtered if filtered else [], "cid": client_id}
                )
                total_removed += removed_count
                clients_affected += 1
                print(f"  [{client_name}] removed {removed_count} applause charge(s)")

        db.commit()
        print(f"\n✓ Done! Removed {total_removed} charge(s) from {clients_affected} client(s).")

    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
