import bcrypt
from utils.db import get_connection, release_connection

class UserModel:
    @staticmethod
    def create_user(email, password, name):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            # Hash the password
            hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            
            cur.execute(
                "INSERT INTO users (email, password_hash, name) VALUES (%s, %s, %s) RETURNING id, email, name, created_at",
                (email, hashed.decode('utf-8'), name)
            )
            user = cur.fetchone()
            conn.commit()
            if user:
                return {
                    "id": user[0],
                    "email": user[1],
                    "name": user[2],
                    "created_at": user[3]
                }
            return None
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            if cur:
                cur.close()
            release_connection(conn)

    @staticmethod
    def get_by_email(email):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute("SELECT id, email, password_hash, name FROM users WHERE email = %s", (email,))
            user = cur.fetchone()
            if user:
                return {
                    "id": user[0],
                    "email": user[1],
                    "password_hash": user[2],
                    "name": user[3]
                }
            return None
        finally:
            if cur:
                cur.close()
            release_connection(conn)

    @staticmethod
    def get_by_id(user_id):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute("SELECT id, email, name, created_at FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            if user:
                return {
                    "id": user[0],
                    "email": user[1],
                    "name": user[2],
                    "created_at": user[3]
                }
            return None
        finally:
            if cur:
                cur.close()
            release_connection(conn)

    @staticmethod
    def verify_password(stored_hash, provided_password):
        return bcrypt.checkpw(provided_password.encode('utf-8'), stored_hash.encode('utf-8'))
