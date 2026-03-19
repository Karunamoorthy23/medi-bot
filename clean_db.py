#!/usr/bin/env python3
"""Clean up old database and recreate schema"""

import os
import shutil
from pathlib import Path

db_path = Path('instance/medical_chatbot.db')
db_dir = Path('instance')

print("🧹 Database Cleanup Script")
print("=" * 50)

# Create instance directory if it doesn't exist
db_dir.mkdir(exist_ok=True)
print(f"✓ Instance directory: {db_dir.absolute()}")

# Remove old database files
if db_path.exists():
    print(f"\n🗑️  Removing old database: {db_path.absolute()}")
    try:
        os.remove(db_path)
        print("✓ Database file deleted")
    except Exception as e:
        print(f"✗ Error deleting database: {e}")
        print("  Try closing Flask first (Ctrl+C)")
        exit(1)

# Check for WAL files (SQLite write-ahead logging)
wal_file = Path(f'{db_path}-wal')
shm_file = Path(f'{db_path}-shm')

if wal_file.exists():
    try:
        os.remove(wal_file)
        print(f"✓ Deleted WAL file: {wal_file}")
    except:
        pass

if shm_file.exists():
    try:
        os.remove(shm_file)
        print(f"✓ Deleted SHM file: {shm_file}")
    except:
        pass

print("\n" + "=" * 50)
print("✅ Database cleanup complete!")
print("\nNext steps:")
print("1. Start Flask again")
print("2. The database will be recreated with the correct schema")
print("3. Test appointment booking again")
