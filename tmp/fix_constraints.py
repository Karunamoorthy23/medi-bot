import sqlite3
import os

db_path = os.path.join('instance', 'medical_chatbot.db')
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 1. Update chats table to make user_id nullable
        print("Migrating chats table...")
        cursor.execute("CREATE TABLE chats_new (id VARCHAR(50) PRIMARY KEY, user_id INTEGER REFERENCES users(id), doctor_id INTEGER REFERENCES doctors(id), title VARCHAR(255), created_at DATETIME, updated_at DATETIME)")
        cursor.execute("INSERT INTO chats_new (id, user_id, title, created_at, updated_at, doctor_id) SELECT id, user_id, title, created_at, updated_at, doctor_id FROM chats")
        cursor.execute("DROP TABLE chats")
        cursor.execute("ALTER TABLE chats_new RENAME TO chats")
        
        # 2. Update chat_history table to make user_id nullable
        print("Migrating chat_history table...")
        cursor.execute("CREATE TABLE chat_history_new (id INTEGER PRIMARY KEY, chat_id VARCHAR(50) REFERENCES chats(id), user_id INTEGER REFERENCES users(id), doctor_id INTEGER REFERENCES doctors(id), message TEXT NOT NULL, response TEXT NOT NULL, detected_symptoms TEXT, suggested_doctor_id INTEGER REFERENCES doctors(id), emergency_detected BOOLEAN, severity INTEGER, timestamp DATETIME)")
        cursor.execute("INSERT INTO chat_history_new (id, chat_id, user_id, message, response, detected_symptoms, suggested_doctor_id, emergency_detected, severity, timestamp, doctor_id) SELECT id, chat_id, user_id, message, response, detected_symptoms, suggested_doctor_id, emergency_detected, severity, timestamp, doctor_id FROM chat_history")
        cursor.execute("DROP TABLE chat_history")
        cursor.execute("ALTER TABLE chat_history_new RENAME TO chat_history")
        
        conn.commit()
        print("Database constraints fixed successfully.")
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()
else:
    print("DB not found")
