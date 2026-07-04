from utils.db import get_connection, release_connection

class ComparisonModel:
    @staticmethod
    def get_comparison(user_id, month=None):
        """
        Compare budget (planned) vs actual spending per category for a given month.
        month format: 'YYYY-MM' (e.g., '2026-06')
        """
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT 
                    b.category,
                    b.monthly AS planned,
                    COALESCE(SUM(t.amount), 0) AS actual
                FROM budget_items b
                LEFT JOIN transactions t 
                    ON t.user_id = b.user_id 
                    AND t.category = b.category 
                    AND t.type = 'expense'
                    AND t.deleted_at IS NULL
                    AND TO_CHAR(t.date, 'YYYY-MM') = COALESCE(%s, TO_CHAR(CURRENT_DATE, 'YYYY-MM'))
                WHERE b.user_id = %s
                    AND b.deleted_at IS NULL
                    AND COALESCE(b.month, TO_CHAR(CURRENT_DATE, 'YYYY-MM')) = COALESCE(%s, TO_CHAR(CURRENT_DATE, 'YYYY-MM'))
                GROUP BY b.category, b.monthly
                ORDER BY b.monthly DESC
            """, (month, user_id, month))
            results = cur.fetchall()
            return [
                {
                    "category": r[0],
                    "planned": float(r[1]),
                    "actual": float(r[2]),
                    "diff": float(r[2]) - float(r[1])
                }
                for r in results
            ]
        finally:
            if cur:
                cur.close()
            release_connection(conn)
