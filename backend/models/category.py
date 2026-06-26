from utils.db import get_connection, release_connection

class CategoryModel:
    @staticmethod
    def get_all(user_id):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT id, name, icon, color, type FROM categories WHERE user_id = %s",
                (user_id,)
            )
            categories = cur.fetchall()
            return [
                {"id": c[0], "name": c[1], "icon": c[2], "color": c[3], "type": c[4]}
                for c in categories
            ]
        finally:
            if cur:
                cur.close()
            release_connection(conn)

    @staticmethod
    def create(user_id, name, icon, color, category_type):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO categories (user_id, name, icon, color, type) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (user_id, name, icon, color, category_type)
            )
            row = cur.fetchone()
            cat_id = row[0] if row else None
            conn.commit()
            return {"id": cat_id, "name": name, "icon": icon, "color": color, "type": category_type}
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            if cur:
                cur.close()
            release_connection(conn)

    @staticmethod
    def delete(user_id, category_id):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute("DELETE FROM categories WHERE id = %s AND user_id = %s RETURNING id", (category_id, user_id))
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
    def update(user_id, category_id, name, icon, color, cat_type):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute(
                """
                UPDATE categories 
                SET name = %s, icon = %s, color = %s, type = %s 
                WHERE id = %s AND user_id = %s 
                RETURNING id, name, icon, color, type
                """,
                (name, icon, color, cat_type, category_id, user_id)
            )
            row = cur.fetchone()
            conn.commit()
            if row:
                return {"id": row[0], "name": row[1], "icon": row[2], "color": row[3], "type": row[4]}
            return None
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            if cur:
                cur.close()
            release_connection(conn)
