from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.report_service import ReportService
from utils.helpers import success_response, error_response

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_summary():
    user_id = get_jwt_identity()
    result = ReportService.get_summary(user_id)
    
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(result["data"])

@reports_bp.route('/category', methods=['GET'])
@jwt_required()
def get_category_breakdown():
    user_id = get_jwt_identity()
    result = ReportService.get_category_breakdown(user_id)
    
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(result["data"])

@reports_bp.route('/trends', methods=['GET'])
@jwt_required()
def get_monthly_trends():
    user_id = get_jwt_identity()
    months = request.args.get('months', 6, type=int)
    result = ReportService.get_monthly_trends(user_id, months)
    
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(result["data"])

