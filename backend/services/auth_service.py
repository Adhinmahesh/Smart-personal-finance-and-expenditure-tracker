import psycopg2
from marshmallow import ValidationError
from flask_jwt_extended import create_access_token, create_refresh_token
from models.user import UserModel
from schemas.user_schema import SignupSchema, LoginSchema

class AuthService:
    @staticmethod
    def signup(data):
        schema = SignupSchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return {"error": err.messages, "status": 400}
            
        try:
            user = UserModel.create_user(
                validated_data['email'], 
                validated_data['password'], 
                validated_data.get('name')
            )
            if not user:
                return {"error": "Failed to create user account", "status": 500}
                
            access_token = create_access_token(identity=str(user['id']))
            refresh_token = create_refresh_token(identity=str(user['id']))
            return {
                "success": True,
                "data": {
                    "user": user,
                    "access_token": access_token,
                    "refresh_token": refresh_token
                },
                "status": 201
            }
        except psycopg2.errors.UniqueViolation:
            return {"error": "Email already exists", "status": 409}
        except Exception as e:
            import logging
            logging.getLogger(__name__).exception("Error during signup")
            return {"error": "An internal error occurred during signup", "status": 500}

    @staticmethod
    def update_profile(user_id, data):
        name = data.get('name')
        if not name:
            return {"error": "Name is required", "status": 400}
        try:
            updated_user = UserModel.update_profile(user_id, name)
            if updated_user:
                return {"success": True, "data": {"user": updated_user}, "status": 200}
            return {"error": "User not found", "status": 404}
        except Exception as e:
            import logging
            logging.getLogger(__name__).exception("Error updating profile")
            return {"error": "Failed to update profile", "status": 500}

    @staticmethod
    def login(data):
        schema = LoginSchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return {"error": err.messages, "status": 400}
        
        user = UserModel.get_by_email(validated_data['email'])
        if not user or not UserModel.verify_password(user['password_hash'], validated_data['password']):
            return {"error": "Invalid email or password", "status": 401}
        
        access_token = create_access_token(identity=str(user['id']))
        refresh_token = create_refresh_token(identity=str(user['id']))
        
        # Remove password hash before returning
        user.pop('password_hash', None)
        
        return {
            "success": True,
            "data": {
                "user": user,
                "access_token": access_token,
                "refresh_token": refresh_token
            },
            "status": 200
        }

    @staticmethod
    def get_me(user_id):
        user = UserModel.get_by_id(user_id)
        if not user:
            return {"error": "User not found", "status": 404}
        return {"success": True, "data": {"user": user}, "status": 200}
