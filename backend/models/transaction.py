from utils.db import get_connection, release_connection

class TransactionModel:
    @staticmethod
    def get_all(user_id, limit=50):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, category, date, amount, notes, type 
                FROM transactions 
                WHERE user_id = %s 
                ORDER BY date DESC, created_at DESC
                LIMIT %s
            """, (user_id, limit))
            
            transactions = cur.fetchall()
            return [
                {"id": t[0], "category": t[1], "date": t[2].isoformat(), "amount": float(t[3]), "notes": t[4], "type": t[5]}
                for t in transactions
            ]
        finally:
            if cur:
                cur.close()
            release_connection(conn)

    @staticmethod
    def create(user_id, category, date, amount, notes, tx_type):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO transactions (user_id, category, date, amount, notes, type) 
                VALUES (%s, %s, %s, %s, %s, %s) 
                RETURNING id
                """,
                (user_id, category, date, amount, notes, tx_type)
            )
            row = cur.fetchone()
            tx_id = row[0] if row else None
            conn.commit()
            return {
                "id": tx_id, "category": category, "date": date, 
                "amount": amount, "notes": notes, "type": tx_type
            }
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            if cur:
                cur.close()
            release_connection(conn)

    @staticmethod
    def delete(user_id, tx_id):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute("DELETE FROM transactions WHERE id = %s AND user_id = %s RETURNING id", (tx_id, user_id))
            deleted = cur.fetchone()
            conn.commit()
            return deleted is not None
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            if cur:
                cur.close()
            release_connection(conn)
