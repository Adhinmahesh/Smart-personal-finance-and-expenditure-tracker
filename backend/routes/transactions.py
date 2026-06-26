from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.transaction_service import TransactionService
from utils.helpers import success_response, error_response
from utils.extensions import limiter

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('', methods=['GET'])
@jwt_required()
def get_transactions():
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', request.args.get('limit', 50, type=int), type=int)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    category = request.args.get('category')
    tx_type = request.args.get('type')
    
    result = TransactionService.get_transactions(user_id, page, per_page, start_date, end_date, category, tx_type)
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(result["data"], "Transactions fetched successfully", result["status"], pagination=result.get("pagination"))

@transactions_bp.route('', methods=['POST'])
@limiter.limit("30 per minute")
@jwt_required()
def add_transaction():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    result = TransactionService.add_transaction(user_id, data)
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(result["data"], "Transaction created successfully", result["status"])

@transactions_bp.route('/<string:tx_id>', methods=['PUT'])
@limiter.limit("30 per minute")
@jwt_required()
def update_transaction(tx_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    
    result = TransactionService.update_transaction(user_id, tx_id, data)
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(result["data"], "Transaction updated successfully", result["status"])

@transactions_bp.route('/<string:tx_id>', methods=['DELETE'])
@limiter.limit("30 per minute")
@jwt_required()
def delete_transaction(tx_id):
    user_id = get_jwt_identity()
    
    result = TransactionService.delete_transaction(user_id, tx_id)
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(None, "Transaction deleted successfully", result["status"])
