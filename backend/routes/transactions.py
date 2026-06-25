from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.transaction_service import TransactionService
from utils.helpers import success_response, error_response

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('', methods=['GET'])
@jwt_required()
def get_transactions():
    user_id = get_jwt_identity()
    limit = request.args.get('limit', 50, type=int)
    
    result = TransactionService.get_transactions(user_id, limit)
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(result["data"], "Transactions fetched successfully", result["status"])

@transactions_bp.route('', methods=['POST'])
@jwt_required()
def add_transaction():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    result = TransactionService.add_transaction(user_id, data)
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(result["data"], "Transaction created successfully", result["status"])

@transactions_bp.route('/<string:tx_id>', methods=['DELETE'])
@jwt_required()
def delete_transaction(tx_id):
    user_id = get_jwt_identity()
    
    result = TransactionService.delete_transaction(user_id, tx_id)
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(None, "Transaction deleted successfully", result["status"])
