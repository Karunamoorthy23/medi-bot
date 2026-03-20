import sqlite3
import os

db_path = os.path.join('instance', 'medical_chatbot.db')
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("--- Table: chats ---")
    try:
        cursor.execute("PRAGMA table_info(chats)")
        for col in cursor.fetchall():
            print(col)
    except Exception as e:
        print(e)
        
    print("\n--- Table: chat_history ---")
    try:
        cursor.execute("PRAGMA table_info(chat_history)")
        for col in cursor.fetchall():
            print(col)
    except Exception as e:
        print(e)
        
    conn.close()
else:
    print("DB not found")
