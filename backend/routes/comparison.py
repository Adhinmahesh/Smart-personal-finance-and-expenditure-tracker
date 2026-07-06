from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.comparison_service import ComparisonService
from utils.helpers import success_response, error_response

comparison_bp = Blueprint('comparison', __name__)

@comparison_bp.route('', methods=['GET'])
@jwt_required()
def get_comparison():
    user_id = get_jwt_identity()
    month = request.args.get('month')  # Optional: ?month=2026-06
    
    result = ComparisonService.get_comparison(user_id, month)
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(result["data"])
