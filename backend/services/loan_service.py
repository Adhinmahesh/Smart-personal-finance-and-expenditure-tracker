import datetime
import logging
from marshmallow import ValidationError
from models.loan import LoanModel
from schemas.loan_schema import LoanSchema, LoanPaymentSchema, LoanReminderUpdateSchema, LoanDueDateUpdateSchema, LoanEndDateUpdateSchema

logger = logging.getLogger(__name__)

class LoanService:
    @staticmethod
    def get_loans(user_id):
        try:
            loans = LoanModel.get_all(user_id)
            return {"success": True, "data": loans, "status": 200}
        except Exception as e:
            logger.exception("Error fetching loans")
            return {"error": "Failed to fetch loans", "status": 500}

    @staticmethod
    def add_loan(user_id, data):
        schema = LoanSchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return {"error": err.messages, "status": 400}

        try:
            loan = LoanModel.create(user_id, validated_data)
            return {"success": True, "data": loan, "status": 201}
        except Exception as e:
            logger.exception("Error creating loan")
            return {"error": "Failed to create loan", "status": 500}

    @staticmethod
    def pay_loan(user_id, loan_id, data):
        schema = LoanPaymentSchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return {"error": err.messages, "status": 400}
        
        date_str = datetime.date.today().isoformat()
        try:
            success = LoanModel.pay_loan(user_id, loan_id, validated_data['amount'], date_str)
            if success:
                return {"success": True, "status": 200}
            return {"error": "Loan not found", "status": 404}
        except Exception as e:
            logger.exception("Error recording loan payment")
            return {"error": "Failed to record payment", "status": 500}

    @staticmethod
    def complete_loan(user_id, loan_id):
        try:
            success = LoanModel.complete(user_id, loan_id)
            if success:
                return {"success": True, "status": 200}
            return {"error": "Loan not found", "status": 404}
        except Exception as e:
            logger.exception("Error completing loan")
            return {"error": "Failed to complete loan", "status": 500}

    @staticmethod
    def update_reminder_type(user_id, loan_id, data):
        schema = LoanReminderUpdateSchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return {"error": err.messages, "status": 400}
        
        try:
            success = LoanModel.switch_reminder_type(user_id, loan_id, validated_data['newType'], validated_data['nextDue'])
            if success:
                return {"success": True, "status": 200}
            return {"error": "Loan not found", "status": 404}
        except Exception as e:
            logger.exception("Error updating reminder type")
            return {"error": "Failed to update reminder type", "status": 500}

    @staticmethod
    def update_due_date(user_id, loan_id, data):
        schema = LoanDueDateUpdateSchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return {"error": err.messages, "status": 400}
        
        try:
            success = LoanModel.change_due_date(
                user_id, loan_id, validated_data['newValue'], validated_data['nextDue'], 
                validated_data['changeType'], validated_data['reminderType']
            )
            if success:
                return {"success": True, "status": 200}
            return {"error": "Loan not found", "status": 404}
        except Exception as e:
            logger.exception("Error updating due date")
            return {"error": "Failed to update due date", "status": 500}

    @staticmethod
    def update_end_date(user_id, loan_id, data):
        schema = LoanEndDateUpdateSchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return {"error": err.messages, "status": 400}
        
        try:
            success = LoanModel.update_end_date(
                user_id, loan_id, validated_data.get('endDate'), validated_data.get('nextDue'), validated_data.get('status')
            )
            if success:
                return {"success": True, "status": 200}
            return {"error": "Loan not found", "status": 404}
        except Exception as e:
            logger.exception("Error updating end date")
            return {"error": "Failed to update end date", "status": 500}

    @staticmethod
    def delete_loan(user_id, loan_id):
        try:
            deleted = LoanModel.delete(user_id, loan_id)
            if deleted:
                return {"success": True, "status": 200}
            return {"error": "Loan not found or unauthorized", "status": 404}
        except Exception as e:
            logger.exception("Error deleting loan")
            return {"error": "Failed to delete loan", "status": 500}
