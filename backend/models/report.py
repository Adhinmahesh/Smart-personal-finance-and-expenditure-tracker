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
                WHERE user_id = %s AND deleted_at IS NULL
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
                WHERE user_id = %s AND type = 'expense' AND deleted_at IS NULL
                GROUP BY category 
                ORDER BY total DESC
            """, (user_id,))
            results = cur.fetchall()
            return [{"category": r[0], "amount": float(r[1])} for r in results]
        finally:
            if cur:
                cur.close()
            release_connection(conn)

    @staticmethod
    def get_monthly_trends(user_id, months=6):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT 
                    TO_CHAR(date, 'YYYY-MM') AS month,
                    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
                    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses
                FROM transactions
                WHERE user_id = %s 
                    AND deleted_at IS NULL
                    AND date >= (CURRENT_DATE - (INTERVAL '1 month' * %s))
                GROUP BY TO_CHAR(date, 'YYYY-MM')
                ORDER BY month ASC
            """, (user_id, months))
            results = cur.fetchall()
            return [
                {"month": r[0], "income": float(r[1]), "expenses": float(r[2]), "savings": float(r[1]) - float(r[2])}
                for r in results
            ]
        finally:
            if cur:
                cur.close()
            release_connection(conn)
