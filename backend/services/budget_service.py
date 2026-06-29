import logging
from marshmallow import ValidationError
from models.budget import BudgetModel
from schemas.budget_schema import BudgetSchema

logger = logging.getLogger(__name__)

class BudgetService:
    @staticmethod
    def get_budget(user_id):
        try:
            budget_items = BudgetModel.get_all(user_id)
            return {"success": True, "data": budget_items, "status": 200}
        except Exception as e:
            logger.exception("Error fetching budget items")
            return {"error": "Failed to fetch budget items", "status": 500}

    @staticmethod
    def add_budget_item(user_id, data):
        schema = BudgetSchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return {"error": err.messages, "status": 400}
            
        try:
            item = BudgetModel.create(
                user_id, 
                validated_data['category'], 
                validated_data['daily'], 
                validated_data['monthly'], 
                validated_data['month']
            )
            return {"success": True, "data": item, "status": 201}
        except Exception as e:
            logger.exception("Error creating budget item")
            return {"error": "Failed to create budget item", "status": 500}

    @staticmethod
    def update_budget_item(user_id, budget_id, data):
        schema = BudgetSchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return {"error": err.messages, "status": 400}

        try:
            updated = BudgetModel.update(
                user_id,
                budget_id,
                validated_data['category'],
                validated_data['daily'],
                validated_data['monthly'],
                validated_data['month']
            )
            if updated:
                return {"success": True, "data": updated, "status": 200}
            return {"error": "Budget item not found or unauthorized", "status": 404}
        except Exception as e:
            logger.exception("Error updating budget item")
            return {"error": "Failed to update budget item", "status": 500}

    @staticmethod
    def delete_budget_item(user_id, budget_id):
        try:
            deleted = BudgetModel.delete(user_id, budget_id)
            if deleted:
                return {"success": True, "status": 200}
            return {"error": "Budget item not found or unauthorized", "status": 404}
        except Exception as e:
            logger.exception("Error deleting budget item")
            return {"error": "Failed to delete budget item", "status": 500}
