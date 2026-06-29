from marshmallow import Schema, fields, validate, pre_load
from utils.sanitizers import sanitize_string_fields

class BudgetSchema(Schema):
    category = fields.String(required=True, validate=validate.Length(min=1, max=100))
    daily = fields.Decimal(required=True, validate=validate.Range(min=0, max=999999999.99))
    monthly = fields.Decimal(required=True, validate=validate.Range(min=0, max=999999999.99))
    month = fields.String(required=True, validate=validate.Regexp(r"^\d{4}-(0[1-9]|1[0-2])$", error="Month must be in YYYY-MM format."))

    @pre_load
    def sanitize_inputs(self, data, **kwargs):
        return sanitize_string_fields(data, ["category"])
