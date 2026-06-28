from marshmallow import Schema, fields, validate, validates, ValidationError, pre_load
import re
from utils.sanitizers import sanitize_string_fields

class SignupSchema(Schema):
    email = fields.Email(required=True, error_messages={"required": "Email is required.", "invalid": "Not a valid email address."})
    password = fields.String(required=True, validate=validate.Length(min=8, error="Password must be at least 8 characters long."))
    name = fields.String(required=False, validate=validate.Length(max=100))

    @pre_load
    def sanitize_inputs(self, data, **kwargs):
        return sanitize_string_fields(data, ["name"])

    @validates("password")
    def validate_password_complexity(self, value, **kwargs):
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", value):
            raise ValidationError("Password must contain at least one special character.")

class LoginSchema(Schema):
    email = fields.Email(required=True, error_messages={"required": "Email is required."})
    password = fields.String(required=True, error_messages={"required": "Password is required."})
