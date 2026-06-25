from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.loan_service import LoanService
from utils.helpers import success_response, error_response

loans_bp = Blueprint('loans', __name__)

@loans_bp.route('', methods=['GET'])
@jwt_required()
def get_loans():
    user_id = get_jwt_identity()
    result = LoanService.get_loans(user_id)
    
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(result["data"])

@loans_bp.route('', methods=['POST'])
@jwt_required()
def add_loan():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    result = LoanService.add_loan(user_id, data)
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(result["data"], "Loan created successfully", result["status"])

@loans_bp.route('/<string:loan_id>/pay', methods=['POST'])
@jwt_required()
def pay_loan(loan_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    
    result = LoanService.pay_loan(user_id, loan_id, data)
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(None, "Payment recorded successfully", result["status"])

@loans_bp.route('/<string:loan_id>/complete', methods=['PUT'])
@jwt_required()
def complete_loan(loan_id):
    user_id = get_jwt_identity()
    
    result = LoanService.complete_loan(user_id, loan_id)
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(None, "Loan marked as completed", result["status"])

@loans_bp.route('/<string:loan_id>/reminder-type', methods=['PUT'])
@jwt_required()
def update_reminder_type(loan_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    
    result = LoanService.update_reminder_type(user_id, loan_id, data)
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(None, "Reminder type updated", result["status"])

@loans_bp.route('/<string:loan_id>/due-date', methods=['PUT'])
@jwt_required()
def update_due_date(loan_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    
    result = LoanService.update_due_date(user_id, loan_id, data)
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(None, "Due date updated", result["status"])
