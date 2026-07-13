import psycopg2
import random
from marshmallow import ValidationError
from flask_jwt_extended import create_access_token, create_refresh_token
from models.user import UserModel
from schemas.user_schema import SignupSchema, LoginSchema
from utils.email_service import send_verification_email, send_password_reset_email

class AuthService:
    @staticmethod
    def signup(data):
        schema = SignupSchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return {"error": err.messages, "status": 400}
            
        try:
            verification_code = f"{random.randint(100000, 999999)}"
            user = UserModel.create_user(
                validated_data['email'], 
                validated_data['password'], 
                validated_data.get('name'),
                verification_code=verification_code
            )
            if not user:
                return {"error": "Failed to create user account", "status": 500}
                
            email_sent = send_verification_email(
                user['email'], 
                user['name'], 
                verification_code
            )
            
            return {
                "success": True,
                "data": {
                    "user": user,
                    "requires_verification": True,
                    "email": user['email'],
                    "email_sent": email_sent
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
        
        # Check if email is verified
        if user.get('is_verified') is False:
            code = user.get('verification_code') or f"{random.randint(100000, 999999)}"
            UserModel.set_verification_code(user['email'], code)
            return {
                "error": "Please verify your email address to continue",
                "status": 403,
                "data": {
                    "email": user['email']
                }
            }
        
        access_token = create_access_token(identity=str(user['id']))
        refresh_token = create_refresh_token(identity=str(user['id']))
        
        # Remove password hash and verification details before returning
        user.pop('password_hash', None)
        user.pop('verification_code', None)
        user.pop('verification_expires_at', None)
        
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
    def verify_email(data):
        email = data.get('email')
        code = data.get('code')
        if not email or not code:
            return {"error": "Email and verification code are required", "status": 400}
            
        user = UserModel.verify_email(email, str(code).strip())
        if not user:
            return {"error": "Invalid or expired verification code", "status": 400}
            
        access_token = create_access_token(identity=str(user['id']))
        refresh_token = create_refresh_token(identity=str(user['id']))
        
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
    def resend_verification(data):
        email = data.get('email')
        if not email:
            return {"error": "Email is required", "status": 400}
            
        user = UserModel.get_by_email(email)
        if not user:
            return {"error": "Account not found with this email", "status": 404}
            
        new_code = f"{random.randint(100000, 999999)}"
        success = UserModel.set_verification_code(email, new_code)
        if not success:
            return {"error": "Account not found with this email", "status": 404}
            
        email_sent = send_verification_email(
            email, 
            user.get('name'), 
            new_code
        )
            
        return {
            "success": True,
            "data": {
                "email": email,
                "email_sent": email_sent,
                "message": "A new verification code has been sent"
            },
            "status": 200
        }

    @staticmethod
    def get_me(user_id):
        user = UserModel.get_by_id(user_id)
        if not user:
            return {"error": "User not found", "status": 404}
        return {"success": True, "data": {"user": user}, "status": 200}

    @staticmethod
    def forgot_password(data):
        email = data.get('email')
        if not email:
            return {"error": "Email address is required", "status": 400}
            
        user = UserModel.get_by_email(email)
        if not user:
            return {"error": "No account found with this email address", "status": 404}
            
        reset_code = f"{random.randint(100000, 999999)}"
        UserModel.set_verification_code(email, reset_code)
        
        email_sent = send_password_reset_email(
            email,
            user.get('name'),
            reset_code
        )
        
        return {
            "success": True,
            "data": {
                "email": email,
                "email_sent": email_sent,
                "message": "A 6-digit password reset code has been sent to your email"
            },
            "status": 200
        }

    @staticmethod
    def reset_password(data):
        email = data.get('email')
        code = data.get('code')
        new_password = data.get('new_password')
        
        if not email or not code or not new_password:
            return {"error": "Email, verification code, and new password are required", "status": 400}
            
        if len(str(new_password)) < 6:
            return {"error": "Password must be at least 6 characters long", "status": 400}
            
        # Verify code first
        verified_user = UserModel.verify_email(email, str(code).strip())
        if not verified_user:
            return {"error": "Invalid or expired verification code", "status": 400}
            
        # Update password
        success = UserModel.update_password(email, new_password)
        if not success:
            return {"error": "Failed to update password", "status": 500}
            
        return {
            "success": True,
            "data": {
                "message": "Password changed successfully"
            },
            "status": 200
        }

    @staticmethod
    def google_auth(data):
        import requests
        import secrets

        token = data.get('token') or data.get('access_token')
        if not token:
            return {"error": "Missing Google authentication token", "status": 400}

        email = None
        name = None
        picture = None

        # Try verifying as an ID token first via Google endpoint
        try:
            res = requests.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={token}", timeout=10)
            if res.status_code == 200:
                info = res.json()
                email = info.get("email")
                name = info.get("name")
                picture = info.get("picture")
        except Exception:
            pass

        # If ID token check didn't yield email, try verifying as an access token via userinfo endpoint
        if not email:
            try:
                res = requests.get("https://www.googleapis.com/oauth2/v3/userinfo", headers={"Authorization": f"Bearer {token}"}, timeout=10)
                if res.status_code == 200:
                    info = res.json()
                    email = info.get("email")
                    name = info.get("name")
                    picture = info.get("picture")
            except Exception:
                pass

        if not email:
            return {"error": "Invalid or expired Google authentication token. Could not verify identity with Google.", "status": 401}

        # Check if user already exists
        user = UserModel.get_by_email(email)
        if not user:
            # Create new user with random secure password
            random_password = secrets.token_urlsafe(16)
            user = UserModel.create_user(
                email=email,
                password=random_password,
                name=name or email.split("@")[0]
            )
        else:
            if not user.get("is_verified"):
                user = UserModel.mark_verified(email)

        if not user:
            return {"error": "Failed to create or update account via Google OAuth", "status": 500}

        access_token = create_access_token(identity=str(user["id"]))
        refresh_token = create_refresh_token(identity=str(user["id"]))

        return {
            "success": True,
            "data": {
                "user": {
                    "id": user["id"],
                    "email": user["email"],
                    "name": user["name"],
                    "picture": picture
                },
                "access_token": access_token,
                "refresh_token": refresh_token
            },
            "status": 200
        }
