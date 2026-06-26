from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.budget_service import BudgetService
from utils.helpers import success_response, error_response
from utils.extensions import limiter

budget_bp = Blueprint('budget', __name__)

@budget_bp.route('', methods=['GET'])
@jwt_required()
def get_budget():
    user_id = get_jwt_identity()
    result = BudgetService.get_budget(user_id)
    
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(result["data"])

@budget_bp.route('', methods=['POST'])
@limiter.limit("30 per minute")
@jwt_required()
def add_budget_item():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    result = BudgetService.add_budget_item(user_id, data)
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(result["data"], "Budget item created successfully", result["status"])

@budget_bp.route('/<string:budget_id>', methods=['PUT'])
@limiter.limit("30 per minute")
@jwt_required()
def update_budget(budget_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    
    result = BudgetService.update_budget_item(user_id, budget_id, data)
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(result["data"], "Budget item updated successfully", result["status"])

@budget_bp.route('/<string:budget_id>', methods=['DELETE'])
@limiter.limit("30 per minute")
@jwt_required()
def delete_budget(budget_id):
    user_id = get_jwt_identity()
    
    result = BudgetService.delete_budget_item(user_id, budget_id)
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(None, "Budget item deleted successfully", result["status"])
