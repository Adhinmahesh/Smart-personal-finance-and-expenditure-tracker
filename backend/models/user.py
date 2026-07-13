import bcrypt
from utils.db import get_connection, release_connection

class UserModel:
    @staticmethod
    def create_user(email, password, name, verification_code=None):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            
            if verification_code:
                cur.execute(
                    "INSERT INTO users (email, password_hash, name, is_verified, verification_code, verification_expires_at) VALUES (%s, %s, %s, FALSE, %s, CURRENT_TIMESTAMP + INTERVAL '15 minutes') RETURNING id, email, name, created_at, is_verified",
                    (email, hashed.decode('utf-8'), name, verification_code)
                )
            else:
                cur.execute(
                    "INSERT INTO users (email, password_hash, name, is_verified) VALUES (%s, %s, %s, TRUE) RETURNING id, email, name, created_at, is_verified",
                    (email, hashed.decode('utf-8'), name)
                )
            user = cur.fetchone()
            conn.commit()
            if user:
                return {
                    "id": user[0],
                    "email": user[1],
                    "name": user[2],
                    "created_at": user[3],
                    "is_verified": user[4]
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
            cur.execute("SELECT id, email, password_hash, name, is_verified, verification_code, verification_expires_at FROM users WHERE email = %s", (email,))
            user = cur.fetchone()
            if user:
                return {
                    "id": user[0],
                    "email": user[1],
                    "password_hash": user[2],
                    "name": user[3],
                    "is_verified": user[4],
                    "verification_code": user[5],
                    "verification_expires_at": user[6]
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
            cur.execute("SELECT id, email, name, created_at, is_verified FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            if user:
                return {
                    "id": user[0],
                    "email": user[1],
                    "name": user[2],
                    "created_at": user[3],
                    "is_verified": user[4]
                }
            return None
        finally:
            if cur:
                cur.close()
            release_connection(conn)

    @staticmethod
    def set_verification_code(email, code):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute(
                "UPDATE users SET verification_code = %s, verification_expires_at = CURRENT_TIMESTAMP + INTERVAL '15 minutes' WHERE email = %s RETURNING id, email, name",
                (code, email)
            )
            user = cur.fetchone()
            conn.commit()
            return user is not None
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            if cur:
                cur.close()
            release_connection(conn)

    @staticmethod
    def verify_email(email, code):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT id, email, name, created_at FROM users WHERE email = %s AND verification_code = %s AND verification_expires_at >= CURRENT_TIMESTAMP",
                (email, code)
            )
            user = cur.fetchone()
            if not user:
                return None
            
            cur.execute(
                "UPDATE users SET is_verified = TRUE, verification_code = NULL, verification_expires_at = NULL WHERE id = %s RETURNING id, email, name, created_at, is_verified",
                (user[0],)
            )
            verified_user = cur.fetchone()
            conn.commit()
            if verified_user:
                return {
                    "id": verified_user[0],
                    "email": verified_user[1],
                    "name": verified_user[2],
                    "created_at": verified_user[3],
                    "is_verified": verified_user[4]
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
    def verify_password(stored_hash, provided_password):
        return bcrypt.checkpw(provided_password.encode('utf-8'), stored_hash.encode('utf-8'))

    @staticmethod
    def update_profile(user_id, name):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute(
                "UPDATE users SET name = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING id, email, name, created_at",
                (name, user_id)
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
    def update_password(email, new_password):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
            cur.execute(
                "UPDATE users SET password_hash = %s, verification_code = NULL, verification_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE email = %s RETURNING id, email, name",
                (hashed.decode('utf-8'), email)
            )
            user = cur.fetchone()
            conn.commit()
            return user is not None
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            if cur:
                cur.close()
            release_connection(conn)

    @staticmethod
    def mark_verified(email):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute(
                "UPDATE users SET is_verified = TRUE, verification_code = NULL, verification_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE email = %s RETURNING id, email, name, created_at, is_verified",
                (email,)
            )
            user = cur.fetchone()
            conn.commit()
            if user:
                return {
                    "id": user[0],
                    "email": user[1],
                    "name": user[2],
                    "created_at": user[3],
                    "is_verified": user[4]
                }
            return None
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            if cur:
                cur.close()
            release_connection(conn)
