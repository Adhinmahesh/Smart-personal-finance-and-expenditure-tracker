import logging
from marshmallow import ValidationError
from models.category import CategoryModel
from schemas.category_schema import CategorySchema

logger = logging.getLogger(__name__)

class CategoryService:
    @staticmethod
    def get_categories(user_id):
        try:
            categories = CategoryModel.get_all(user_id)
            return {"success": True, "data": categories, "status": 200}
        except Exception as e:
            logger.exception("Error fetching categories")
            return {"error": "Failed to fetch categories", "status": 500}

    @staticmethod
    def add_category(user_id, data):
        schema = CategorySchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return {"error": err.messages, "status": 400}
            
        try:
            category = CategoryModel.create(
                user_id, 
                validated_data['name'], 
                validated_data.get('icon', ''), 
                validated_data.get('color', '#000000'), 
                validated_data['type']
            )
            return {"success": True, "data": category, "status": 201}
        except Exception as e:
            logger.exception("Error creating category")
            return {"error": "Failed to create category", "status": 500}

    @staticmethod
    def update_category(user_id, category_id, data):
        schema = CategorySchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return {"error": err.messages, "status": 400}

        try:
            updated = CategoryModel.update(
                user_id,
                category_id,
                validated_data['name'],
                validated_data.get('icon', ''),
                validated_data.get('color', '#000000'),
                validated_data['type']
            )
            if updated:
                return {"success": True, "data": updated, "status": 200}
            return {"error": "Category not found or unauthorized", "status": 404}
        except Exception as e:
            logger.exception("Error updating category")
            return {"error": "Failed to update category", "status": 500}

    @staticmethod
    def delete_category(user_id, category_id):
        try:
            deleted = CategoryModel.delete(user_id, category_id)
            if deleted:
                return {"success": True, "status": 200}
            return {"error": "Category not found or unauthorized", "status": 404}
        except Exception as e:
            logger.exception("Error deleting category")
            return {"error": "Failed to delete category", "status": 500}
