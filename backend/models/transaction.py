import math
from utils.db import get_connection, release_connection

class TransactionModel:
    @staticmethod
    def get_all(user_id, page=1, per_page=50, start_date=None, end_date=None, category=None, tx_type=None):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            
            # Dynamically build query and parameters
            where_clauses = ["user_id = %s", "deleted_at IS NULL"]
            params = [user_id]
            
            if start_date:
                where_clauses.append("date >= %s")
                params.append(start_date)
            if end_date:
                where_clauses.append("date <= %s")
                params.append(end_date)
            if category:
                where_clauses.append("category ILIKE %s")
                params.append(f"%{category}%")
            if tx_type:
                where_clauses.append("type = %s")
                params.append(tx_type)
                
            where_str = " AND ".join(where_clauses)
            
            # Count total matching items
            count_query = f"SELECT COUNT(*) FROM transactions WHERE {where_str}"
            cur.execute(count_query, tuple(params))
            total = cur.fetchone()[0]
            
            # Calculate pagination
            total_pages = math.ceil(total / per_page) if per_page > 0 else 1
            offset = (page - 1) * per_page
            
            # Fetch paginated items
            data_query = f"""
                SELECT id, category, date, amount, notes, type 
                FROM transactions 
                WHERE {where_str} 
                ORDER BY date DESC, created_at DESC 
                LIMIT %s OFFSET %s
            """
            data_params = params + [per_page, offset]
            cur.execute(data_query, tuple(data_params))
            transactions = cur.fetchall()
            
            data = [
                {"id": t[0], "category": t[1], "date": t[2].isoformat(), "amount": float(t[3]), "notes": t[4], "type": t[5]}
                for t in transactions
            ]
            
            return {
                "data": data,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "total_pages": total_pages,
                    "has_next": page < total_pages
                }
            }
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
    def update(user_id, tx_id, category, date, amount, notes, tx_type):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute(
                """
                UPDATE transactions 
                SET category = %s, date = %s, amount = %s, notes = %s, type = %s, updated_at = CURRENT_TIMESTAMP 
                WHERE id = %s AND user_id = %s AND deleted_at IS NULL 
                RETURNING id, category, date, amount, notes, type
                """,
                (category, date, amount, notes, tx_type, tx_id, user_id)
            )
            row = cur.fetchone()
            conn.commit()
            if row:
                return {
                    "id": row[0], "category": row[1], "date": row[2].isoformat() if hasattr(row[2], 'isoformat') else row[2], 
                    "amount": float(row[3]), "notes": row[4], "type": row[5]
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
    def delete(user_id, tx_id):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute("UPDATE transactions SET deleted_at = CURRENT_TIMESTAMP WHERE id = %s AND user_id = %s AND deleted_at IS NULL RETURNING id", (tx_id, user_id))
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
