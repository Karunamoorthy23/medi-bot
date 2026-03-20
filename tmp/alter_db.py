import sqlite3
import os

db_path = os.path.join('instance', 'medical_chatbot.db')
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    try:
        conn.execute('ALTER TABLE appointments ADD COLUMN location VARCHAR(100)')
        print("Column location added successfully.")
    except Exception as e:
        print(f"Error (may already exist): {e}")
    conn.commit()
    conn.close()
else:
    print("DB not found.")
