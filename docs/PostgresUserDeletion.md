# Postgres-aware user deletion

When the app runs with `USE_DATABASE=true` (Railway/production), user management operates against PostgreSQL instead of the local JSON files.

## Flow

1. `/admin/users` POST with `action=delete_user` still loads the user list via `load_users()` but now calls `delete_user_record(user_id)` from `database_helpers.py` when `USE_DATABASE` is enabled.
2. `database_helpers.delete_user_record` looks up the `User` row, issues `db.delete(user)` and `db.commit()`, and ensures the session is closed.
3. After the SQL delete succeeds the client assignments cleanup runs the same way as before so there are no dangling references.

## Notes

- The existing JSON file branch (`USE_DATABASE=false`) continues to remove the entry from `users_db.json` and save the clients list.
- Keep `USE_DATABASE` set to `true` in production so deletions actually persist in PostgreSQL.
