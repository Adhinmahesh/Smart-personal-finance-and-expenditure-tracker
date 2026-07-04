from marshmallow import Schema, fields, validate, pre_load
from utils.sanitizers import sanitize_string_fields

class TransactionSchema(Schema):
    category = fields.String(required=True, validate=validate.Length(min=1, max=100))
    date = fields.Date(required=True, error_messages={"invalid": "Not a valid date. Expected format: YYYY-MM-DD."})
    amount = fields.Decimal(required=True, validate=validate.Range(min=0.01, max=999999999.99, error="Amount must be between 0.01 and 999,999,999.99."))
    notes = fields.String(load_default="", validate=validate.Length(max=500))
    type = fields.String(required=True, validate=validate.OneOf(["income", "expense"]))

    @pre_load
    def sanitize_inputs(self, data, **kwargs):
        return sanitize_string_fields(data, ["category", "notes"])
