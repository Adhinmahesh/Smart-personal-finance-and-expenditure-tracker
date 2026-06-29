from utils.db import get_connection, release_connection

class BudgetModel:
    @staticmethod
    def get_all(user_id):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, category, daily, monthly, month 
                FROM budget_items 
                WHERE user_id = %s AND deleted_at IS NULL
            """, (user_id,))
            items = cur.fetchall()
            return [
                {"id": i[0], "category": i[1], "daily": float(i[2]), "monthly": float(i[3]), "month": i[4]}
                for i in items
            ]
        finally:
            if cur:
                cur.close()
            release_connection(conn)

    @staticmethod
    def create(user_id, category, daily, monthly, month):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO budget_items (user_id, category, daily, monthly, month) 
                VALUES (%s, %s, %s, %s, %s) RETURNING id
            """, (user_id, category, daily, monthly, month))
            row = cur.fetchone()
            b_id = row[0] if row else None
            conn.commit()
            return {"id": b_id, "category": category, "daily": daily, "monthly": monthly, "month": month}
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            if cur:
                cur.close()
            release_connection(conn)

    @staticmethod
    def delete(user_id, budget_id):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute("UPDATE budget_items SET deleted_at = CURRENT_TIMESTAMP WHERE id = %s AND user_id = %s AND deleted_at IS NULL RETURNING id", (budget_id, user_id))
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

    @staticmethod
    def update(user_id, budget_id, category, daily, monthly, month):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute("""
                UPDATE budget_items 
                SET category = %s, daily = %s, monthly = %s, month = %s, updated_at = CURRENT_TIMESTAMP 
                WHERE id = %s AND user_id = %s AND deleted_at IS NULL 
                RETURNING id, category, daily, monthly, month
            """, (category, daily, monthly, month, budget_id, user_id))
            row = cur.fetchone()
            conn.commit()
            if row:
                return {"id": row[0], "category": row[1], "daily": float(row[2]), "monthly": float(row[3]), "month": row[4]}
            return None
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            if cur:
                cur.close()
            release_connection(conn)
