from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.category_service import CategoryService
from utils.helpers import success_response, error_response
from utils.extensions import limiter

categories_bp = Blueprint('categories', __name__)

@categories_bp.route('', methods=['GET'])
@jwt_required()
def get_categories():
    user_id = get_jwt_identity()
    result = CategoryService.get_categories(user_id)
    
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(result["data"])

@categories_bp.route('', methods=['POST'])
@limiter.limit("30 per minute")
@jwt_required()
def add_category():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    result = CategoryService.add_category(user_id, data)
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(result["data"], "Category created successfully", result["status"])

@categories_bp.route('/<string:category_id>', methods=['DELETE'])
@limiter.limit("30 per minute")
@jwt_required()
def delete_category(category_id):
    user_id = get_jwt_identity()
    
    result = CategoryService.delete_category(user_id, category_id)
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(None, "Category deleted successfully", result["status"])
