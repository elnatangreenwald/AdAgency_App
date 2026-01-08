# How to Run Migration Script Locally

This guide shows you how to run the migration script from your local machine to migrate JSON data to your Railway PostgreSQL database.

## Prerequisites

1. Python 3.11+ installed locally
2. All dependencies installed: `pip install -r requirements.txt`
3. Your Railway PostgreSQL `DATABASE_URL` connection string

## Step 1: Get Your Railway DATABASE_URL

1. Go to [Railway Dashboard](https://railway.app)
2. Select your project
3. Click on your **PostgreSQL** service
4. Go to the **"Variables"** or **"Connect"** tab
5. Copy the `DATABASE_URL` value
   - It should look like: `postgresql://postgres:password@host.railway.app:5432/railway`
   - Or: `postgres://postgres:password@host.railway.app:5432/railway` (will be auto-converted)

## Step 2: Set DATABASE_URL Environment Variable

Choose the method for your operating system:

### Windows PowerShell
```powershell
$env:DATABASE_URL="postgresql://postgres:password@host.railway.app:5432/railway"
python migrate_json_to_db.py
```

### Windows CMD
```cmd
set DATABASE_URL=postgresql://postgres:password@host.railway.app:5432/railway
python migrate_json_to_db.py
```

### Linux/Mac (Bash)
```bash
export DATABASE_URL="postgresql://postgres:password@host.railway.app:5432/railway"
python migrate_json_to_db.py
```

### Or Run Inline (All Platforms)
```bash
# Windows PowerShell
$env:DATABASE_URL="postgresql://..."; python migrate_json_to_db.py

# Windows CMD
set DATABASE_URL=postgresql://... && python migrate_json_to_db.py

# Linux/Mac
DATABASE_URL="postgresql://..." python migrate_json_to_db.py
```

## Step 3: Run the Migration

```bash
python migrate_json_to_db.py
```

The script will:
1. ✅ Verify database connection
2. ✅ Create database tables (if they don't exist)
3. ✅ Migrate all JSON files to PostgreSQL
4. ✅ Show progress for each data type

## Step 4: Verify Migration

After migration completes, you should see:
```
✓ Migrated X users
✓ Migrated X clients
✓ Migrated X suppliers
...
Migration completed successfully!
```

## Troubleshooting

### "DATABASE_URL environment variable is not set"
- Make sure you set the environment variable before running the script
- Use one of the methods above based on your OS

### "Failed to connect to database"
- Check that your `DATABASE_URL` is correct
- Verify the connection string format
- Make sure Railway PostgreSQL is running
- Check if your IP needs to be whitelisted (Railway usually allows all IPs)

### "Table already exists" warnings
- This is normal if you run the script multiple times
- The script checks for existing data before inserting

### "Module not found" errors
- Install dependencies: `pip install -r requirements.txt`
- Make sure you're in the project root directory

### Connection timeout
- Check your internet connection
- Verify Railway PostgreSQL service is running
- Try again - sometimes Railway has temporary connection issues

## What Gets Migrated?

The script migrates all these JSON files:
- ✅ `users_db.json` → `users` table
- ✅ `agency_db.json` → `clients` table
- ✅ `suppliers_db.json` → `suppliers` table
- ✅ `quotes_db.json` → `quotes` table
- ✅ `messages_db.json` → `messages` table
- ✅ `events_db.json` → `events` table
- ✅ `equipment_bank.json` → `equipment` table
- ✅ `checklist_templates.json` → `checklist_templates` table
- ✅ `forms_db.json` → `forms` table
- ✅ `permissions_db.json` → `permissions` table
- ✅ `user_activity.json` → `user_activity` table

## After Migration

1. **Backup your JSON files** - Keep them as backup
2. **Set `USE_DATABASE=true`** in Railway environment variables
3. **Redeploy your app** to Railway
4. **Test the app** to verify data is working
5. **Keep JSON backups** until you're confident everything works

## Safety Features

- ✅ **Idempotent**: Safe to run multiple times
- ✅ **Checks for existing data**: Won't create duplicates
- ✅ **Connection verification**: Tests connection before starting
- ✅ **Error handling**: Shows clear error messages

## Need Help?

If you encounter issues:
1. Check Railway logs for database connection errors
2. Verify `DATABASE_URL` format is correct
3. Make sure all dependencies are installed
4. Check that JSON files exist in the project directory

