import logging
from marshmallow import ValidationError
from models.transaction import TransactionModel
from schemas.transaction_schema import TransactionSchema

logger = logging.getLogger(__name__)

class TransactionService:
    @staticmethod
    def get_transactions(user_id, page=1, per_page=50, start_date=None, end_date=None, category=None, tx_type=None):
        try:
            result = TransactionModel.get_all(user_id, page, per_page, start_date, end_date, category, tx_type)
            return {"success": True, "data": result["data"], "pagination": result["pagination"], "status": 200}
        except Exception as e:
            logger.exception("Error fetching transactions")
            return {"error": "Failed to fetch transactions", "status": 500}

    @staticmethod
    def add_transaction(user_id, data):
        schema = TransactionSchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return {"error": err.messages, "status": 400}
            
        try:
            tx = TransactionModel.create(
                user_id, 
                validated_data['category'], 
                validated_data['date'], 
                validated_data['amount'], 
                validated_data.get('notes', ''), 
                validated_data['type']
            )
            return {"success": True, "data": tx, "status": 201}
        except Exception as e:
            logger.exception("Error creating transaction")
            return {"error": "Failed to create transaction", "status": 500}

    @staticmethod
    def update_transaction(user_id, tx_id, data):
        schema = TransactionSchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return {"error": err.messages, "status": 400}

        try:
            updated = TransactionModel.update(
                user_id,
                tx_id,
                validated_data['category'],
                validated_data['date'],
                validated_data['amount'],
                validated_data.get('notes', ''),
                validated_data['type']
            )
            if updated:
                return {"success": True, "data": updated, "status": 200}
            return {"error": "Transaction not found or unauthorized", "status": 404}
        except Exception as e:
            logger.exception("Error updating transaction")
            return {"error": "Failed to update transaction", "status": 500}

    @staticmethod
    def delete_transaction(user_id, tx_id):
        try:
            deleted = TransactionModel.delete(user_id, tx_id)
            if deleted:
                return {"success": True, "status": 200}
            return {"error": "Transaction not found or unauthorized", "status": 404}
        except Exception as e:
            logger.exception("Error deleting transaction")
            return {"error": "Failed to delete transaction", "status": 500}
