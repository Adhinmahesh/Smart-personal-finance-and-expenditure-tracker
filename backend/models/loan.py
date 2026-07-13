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
                       reminder_day, reminder_weekday, next_due, total_paid, notes, status, amount 
                FROM loans WHERE user_id = %s AND deleted_at IS NULL ORDER BY start_date DESC
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
                    "id": loan_id, "title": l[1], "type": l[2], "amount": float(l[12] or 0),
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
            next_due_val = data.get('next_due') or data['start_date']
            cur.execute("""
                INSERT INTO loans (user_id, title, loan_type, amount, start_date, end_date, 
                                   reminder_type, reminder_day, reminder_weekday, next_due, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
            """, (
                user_id, data['title'], data['loan_type'], data.get('amount', 0), data['start_date'], data.get('end_date'),
                data.get('reminder_type', 'monthly'), data.get('reminder_day'), 
                data.get('reminder_weekday'), next_due_val, data.get('notes', '')
            ))
            row = cur.fetchone()
            loan_id = row[0] if row else None
            

            # Insert initial pending payment
            cur.execute("""
                INSERT INTO loan_payments (loan_id, due_date, status)
                VALUES (%s, %s, 'pending')
            """, (loan_id, next_due_val))
            
            conn.commit()
            return {
                "id": loan_id, "title": data['title'], "type": data['loan_type'], "amount": float(data.get('amount', 0)),
                "startDate": data['start_date'].isoformat() if data.get('start_date') else None,
                "endDate": data['end_date'].isoformat() if data.get('end_date') else None,
                "reminderType": data.get('reminder_type', 'monthly'), "reminderDay": data.get('reminder_day'),
                "reminderWeekday": data.get('reminder_weekday'),
                "nextDue": next_due_val.isoformat() if next_due_val else None,
                "notes": data.get('notes', ''), "payments": [], "totalPaid": 0, "status": "active"
            }
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
            
            # Verify ownership and check end_date
            cur.execute("SELECT id, reminder_type, reminder_day, reminder_weekday, next_due, end_date FROM loans WHERE id = %s AND user_id = %s", (loan_id, user_id))
            loan = cur.fetchone()
            if not loan: return None

            # Mark pending payments as paid
            cur.execute("""
                UPDATE loan_payments SET paid_date = %s, amount = %s, status = 'on-time'
                WHERE loan_id = %s AND status = 'pending'
            """, (date_str, amount, loan_id))
            
            # Update totals and calculate next due — ALWAYS advance to next period
            today = datetime.date.today()
            current_next_due = loan[4]  # current next_due from DB
            end_date = loan[5]          # end_date from DB
            
            if loan[1] == 'weekly':
                # Weekly: always advance at least 7 days from the current due date,
                # but if that's still in the past, keep adding 7 until it's in the future
                if current_next_due:
                    next_due = current_next_due + datetime.timedelta(days=7)
                    while next_due <= today:
                        next_due += datetime.timedelta(days=7)
                else:
                    diff = (loan[3] - today.weekday() + 7) % 7 or 7
                    next_due = today + datetime.timedelta(days=diff)
            else:
                # Monthly: advance from current due date to next month
                if current_next_due:
                    # Move to next month from the current due date
                    month = current_next_due.month
                    year = current_next_due.year
                    if month == 12:
                        next_due = datetime.date(year + 1, 1, loan[2])
                    else:
                        # Handle months with fewer days (e.g., reminder_day=31 in Feb)
                        import calendar
                        next_month = month + 1
                        next_year = year
                        max_day = calendar.monthrange(next_year, next_month)[1]
                        day = min(loan[2], max_day)
                        next_due = datetime.date(next_year, next_month, day)
                    # If somehow still in the past (e.g., multiple missed payments), keep advancing
                    while next_due <= today:
                        if next_due.month == 12:
                            next_due = datetime.date(next_due.year + 1, 1, loan[2])
                        else:
                            import calendar
                            nm = next_due.month + 1
                            ny = next_due.year
                            max_day = calendar.monthrange(ny, nm)[1]
                            day = min(loan[2], max_day)
                            next_due = datetime.date(ny, nm, day)
                else:
                    next_due = datetime.date(today.year, today.month, loan[2])
                    if next_due <= today:
                        if next_due.month == 12:
                            next_due = datetime.date(today.year + 1, 1, loan[2])
                        else:
                            next_due = datetime.date(today.year, today.month + 1, loan[2])

            # Check if the newly computed next_due is BEYOND the loan's end_date
            if end_date and next_due > end_date:
                # Loan reached or exceeded its end date! Mark completed and clear next_due.
                cur.execute("""
                    UPDATE loans SET total_paid = total_paid + %s, next_due = NULL, status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = %s
                """, (amount, loan_id))
                cur.execute("DELETE FROM loan_payments WHERE loan_id = %s AND status = 'pending'", (loan_id,))
            else:
                cur.execute("""
                    UPDATE loans SET total_paid = total_paid + %s, next_due = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s
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
            cur.execute("UPDATE loans SET status = 'completed', next_due = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = %s AND user_id = %s", (loan_id, user_id))
            cur.execute("DELETE FROM loan_payments WHERE loan_id = %s AND status = 'pending'", (loan_id,))
            conn.commit()
            return cur.rowcount > 0
        finally:
            if cur:
                cur.close()
            release_connection(conn)

    @staticmethod
    def update_end_date(user_id, loan_id, end_date, next_due=None, status=None):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            # Verify ownership
            cur.execute("SELECT id, status FROM loans WHERE id = %s AND user_id = %s", (loan_id, user_id))
            loan = cur.fetchone()
            if not loan: return False
            
            new_status = status or loan[1]
            if new_status == 'completed' or not next_due:
                cur.execute("UPDATE loans SET end_date = %s, next_due = NULL, status = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s AND user_id = %s", (end_date, new_status, loan_id, user_id))
                cur.execute("DELETE FROM loan_payments WHERE loan_id = %s AND status = 'pending'", (loan_id,))
            else:
                cur.execute("UPDATE loans SET end_date = %s, next_due = %s, status = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s AND user_id = %s", (end_date, next_due, new_status, loan_id, user_id))
                cur.execute("SELECT id FROM loan_payments WHERE loan_id = %s AND status = 'pending'", (loan_id,))
                pending = cur.fetchone()
                if pending:
                    cur.execute("UPDATE loan_payments SET due_date = %s WHERE id = %s", (next_due, pending[0]))
                else:
                    cur.execute("INSERT INTO loan_payments (loan_id, due_date, status) VALUES (%s, %s, 'pending')", (loan_id, next_due))
            conn.commit()
            return True
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
                "UPDATE loans SET reminder_type = %s, next_due = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s AND user_id = %s",
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
                    cur.execute("UPDATE loans SET reminder_day = %s, next_due = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s AND user_id = %s", (new_value, next_due, loan_id, user_id))
                else:
                    cur.execute("UPDATE loans SET reminder_weekday = %s, next_due = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s AND user_id = %s", (new_value, next_due, loan_id, user_id))
            else:
                cur.execute("UPDATE loans SET next_due = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s AND user_id = %s", (next_due, loan_id, user_id))
            
            cur.execute("UPDATE loan_payments SET due_date = %s WHERE loan_id = %s AND status = 'pending'", (next_due, loan_id))
            conn.commit()
            return cur.rowcount > 0
        finally:
            if cur:
                cur.close()
            release_connection(conn)

    @staticmethod
    def delete(user_id, loan_id):
        conn = get_connection()
        cur = None
        try:
            cur = conn.cursor()
            cur.execute("UPDATE loans SET deleted_at = CURRENT_TIMESTAMP WHERE id = %s AND user_id = %s AND deleted_at IS NULL RETURNING id", (loan_id, user_id))
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
