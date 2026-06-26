from utils.db import get_connection, release_connection

class TokenBlocklistModel:
    @staticmethod
    def add_token(jti):
        conn = get_connection()
        cur = conn.cursor()
        try:
            cur.execute(
                "INSERT INTO jwt_blocklist (jti) VALUES (%s) ON CONFLICT DO NOTHING RETURNING id",
                (jti,)
            )
            conn.commit()
            return True
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cur.close()
            release_connection(conn)

    @staticmethod
    def is_token_revoked(jti):
        conn = get_connection()
        cur = conn.cursor()
        try:
            cur.execute("SELECT id FROM jwt_blocklist WHERE jti = %s", (jti,))
            result = cur.fetchone()
            return result is not None
        except Exception:
            return False
        finally:
            cur.close()
            release_connection(conn)
