from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from services.auth_service import AuthService
from utils.helpers import success_response, error_response
from utils.extensions import limiter
from models.token import TokenBlocklistModel

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
@limiter.limit("3 per minute")
def signup():
    data = request.get_json()
    result = AuthService.signup(data)
    
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(result["data"], "User registered successfully", result["status"])

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    data = request.get_json()
    result = AuthService.login(data)
    
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(result["data"], "Login successful", result["status"])

@auth_bp.route('/refresh', methods=['POST'])
@limiter.limit("10 per minute")
@jwt_required(refresh=True)
def refresh():
    from flask_jwt_extended import create_access_token
    current_user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user_id)
    return success_response({"access_token": new_access_token}, "Token refreshed successfully")

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    current_user_id = get_jwt_identity()
    result = AuthService.get_me(current_user_id)
    
    if "error" in result:
        return error_response(result["error"], result["status"])
    return success_response(result["data"], "User fetched successfully", result["status"])

@auth_bp.route('/logout', methods=['POST'])
@limiter.limit("10 per minute")
@jwt_required()
def logout():
    jti = get_jwt()["jti"]
    try:
        TokenBlocklistModel.add_token(jti)
        return success_response(None, "Successfully logged out")
    except Exception as e:
        return error_response("Logout failed", 500)
