from utils.db import get_connection, release_connection
import datetime

class LoanModel:
    @staticmethod
    def get_all(user_id):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, title, loan_type, start_date, end_date, reminder_type, 
                       reminder_day, reminder_weekday, next_due, total_paid, notes, status 
                FROM loans WHERE user_id = %s ORDER BY start_date DESC
            """, (user_id,))
            loans_data = cur.fetchall()
            
            loans = []
            for l in loans_data:
                loan_id = l[0]
                cur.execute("""
                    SELECT id, due_date, paid_date, amount, status 
                    FROM loan_payments WHERE loan_id = %s ORDER BY due_date DESC
                """, (loan_id,))
                payments = [
                    {"id": p[0], "dueDate": p[1], "paidDate": p[2], "amount": float(p[3]) if p[3] else None, "status": p[4]}
                    for p in cur.fetchall()
                ]
                
                loans.append({
                    "id": loan_id, "title": l[1], "type": l[2], 
                    "startDate": l[3].isoformat() if l[3] else None, 
                    "endDate": l[4].isoformat() if l[4] else None,
                    "reminderType": l[5], "reminderDay": l[6], "reminderWeekday": l[7],
                    "nextDue": l[8].isoformat() if l[8] else None, 
                    "totalPaid": float(l[9]), "notes": l[10], "status": l[11],
                    "payments": payments
                })
            return loans
        finally:
            if cur:
                cur.close()
            release_connection(conn)

    @staticmethod
    def create(user_id, data):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO loans (user_id, title, loan_type, start_date, end_date, 
                                   reminder_type, reminder_day, reminder_weekday, next_due, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
            """, (
                user_id, data['title'], data['type'], data['startDate'], data.get('endDate'),
                data.get('reminderType', 'monthly'), data.get('reminderDay'), 
                data.get('reminderWeekday'), data.get('nextDue'), data.get('notes', '')
            ))
            row = cur.fetchone()
            loan_id = row[0] if row else None
            

            # Insert initial pending payment
            cur.execute("""
                INSERT INTO loan_payments (loan_id, due_date, status)
                VALUES (%s, %s, 'pending')
            """, (loan_id, data.get('nextDue')))
            
            conn.commit()
            return {"id": loan_id, **data, "payments": [], "totalPaid": 0, "status": "active"}
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            if cur:
                cur.close()
            release_connection(conn)

    @staticmethod
    def pay_loan(user_id, loan_id, amount, date_str):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            
            # Verify ownership
            cur.execute("SELECT id, reminder_type, reminder_day, reminder_weekday, next_due FROM loans WHERE id = %s AND user_id = %s", (loan_id, user_id))
            loan = cur.fetchone()
            if not loan: return None

            # Mark pending payments as paid
            cur.execute("""
                UPDATE loan_payments SET paid_date = %s, amount = %s, status = 'on-time'
                WHERE loan_id = %s AND status = 'pending'
            """, (date_str, amount, loan_id))
            
            # Update totals and calculate next due
            today = datetime.date.today()
            if loan[1] == 'weekly':
                diff = (loan[3] - today.weekday() + 7) % 7 or 7
                next_due = today + datetime.timedelta(days=diff)
            else:
                next_due = datetime.date(today.year, today.month, loan[2])
                if next_due <= today:
                    if next_due.month == 12:
                        next_due = datetime.date(today.year + 1, 1, loan[2])
                    else:
                        next_due = datetime.date(today.year, today.month + 1, loan[2])

            cur.execute("""
                UPDATE loans SET total_paid = total_paid + %s, next_due = %s WHERE id = %s
            """, (amount, next_due, loan_id))
            
            # Add new pending payment for next cycle
            cur.execute("""
                INSERT INTO loan_payments (loan_id, due_date, status)
                VALUES (%s, %s, 'pending')
            """, (loan_id, next_due))
            
            # Also record in transactions
            cur.execute("""
                INSERT INTO transactions (user_id, category, date, amount, notes, type)
                VALUES (%s, 'Loan Payment', %s, %s, 'Loan payment recorded', 'expense')
            """, (user_id, date_str, amount))

            conn.commit()
            return True
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            if cur:
                cur.close()
            release_connection(conn)

    @staticmethod
    def complete(user_id, loan_id):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute("UPDATE loans SET status = 'completed' WHERE id = %s AND user_id = %s", (loan_id, user_id))
            conn.commit()
            return cur.rowcount > 0
        finally:
            if cur:
                cur.close()
            release_connection(conn)

    @staticmethod
    def switch_reminder_type(user_id, loan_id, new_type, new_next_due):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute(
                "UPDATE loans SET reminder_type = %s, next_due = %s WHERE id = %s AND user_id = %s",
                (new_type, new_next_due, loan_id, user_id)
            )
            # Update pending payment's due date
            cur.execute(
                "UPDATE loan_payments SET due_date = %s WHERE loan_id = %s AND status = 'pending'",
                (new_next_due, loan_id)
            )
            conn.commit()
            return cur.rowcount > 0
        finally:
            if cur:
                cur.close()
            release_connection(conn)

    @staticmethod
    def change_due_date(user_id, loan_id, new_value, next_due, change_type, reminder_type):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            if change_type == 'permanent':
                if reminder_type == 'monthly':
                    cur.execute("UPDATE loans SET reminder_day = %s, next_due = %s WHERE id = %s AND user_id = %s", (new_value, next_due, loan_id, user_id))
                else:
                    cur.execute("UPDATE loans SET reminder_weekday = %s, next_due = %s WHERE id = %s AND user_id = %s", (new_value, next_due, loan_id, user_id))
            else:
                cur.execute("UPDATE loans SET next_due = %s WHERE id = %s AND user_id = %s", (next_due, loan_id, user_id))
            
            cur.execute("UPDATE loan_payments SET due_date = %s WHERE loan_id = %s AND status = 'pending'", (next_due, loan_id))
            conn.commit()
            return cur.rowcount > 0
        finally:
            if cur:
                cur.close()
            release_connection(conn)
