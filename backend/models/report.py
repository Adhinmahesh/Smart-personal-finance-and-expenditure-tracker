from utils.db import get_connection, release_connection

class ReportModel:
    @staticmethod
    def get_summary(user_id):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT 
                    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses
                FROM transactions 
                WHERE user_id = %s
            """, (user_id,))
            result = cur.fetchone()
            income = float(result[0] or 0) if result else 0.0
            expenses = float(result[1] or 0) if result else 0.0
            return {
                "income": income,
                "expenses": expenses,
                "savings": income - expenses
            }
        finally:
            if cur:
                cur.close()
            release_connection(conn)

    @staticmethod
    def get_category_breakdown(user_id):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT category, SUM(amount) as total 
                FROM transactions 
                WHERE user_id = %s AND type = 'expense'
                GROUP BY category 
                ORDER BY total DESC
            """, (user_id,))
            results = cur.fetchall()
            return [{"category": r[0], "amount": float(r[1])} for r in results]
        finally:
            if cur:
                cur.close()
            release_connection(conn)
