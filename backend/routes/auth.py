from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.auth_service import AuthService
from utils.helpers import success_response, error_response

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    result = AuthService.signup(data.get('email'), data.get('password'), data.get('name'))
    
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(result["data"], "User registered successfully", result["status"])

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    result = AuthService.login(data.get('email'), data.get('password'))
    
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(result["data"], "Login successful", result["status"])

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    current_user_id = get_jwt_identity()
    result = AuthService.get_me(current_user_id)
    
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(result["data"], "User fetched successfully", result["status"])

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    return success_response(None, "Successfully logged out")
