from marshmallow import Schema, fields, validate, validates_schema, ValidationError, pre_load
from utils.sanitizers import sanitize_string_fields

class LoanSchema(Schema):
    title = fields.String(required=True, validate=validate.Length(min=1, max=200))
    loan_type = fields.String(data_key="type", required=True, validate=validate.Length(max=50))
    start_date = fields.Date(data_key="startDate", required=True)
    end_date = fields.Date(data_key="endDate", allow_none=True)
    reminder_type = fields.String(data_key="reminderType", load_default="monthly", validate=validate.OneOf(["monthly", "weekly"]))
    reminder_day = fields.Integer(data_key="reminderDay", allow_none=True, validate=validate.Range(min=1, max=31))
    reminder_weekday = fields.Integer(data_key="reminderWeekday", allow_none=True, validate=validate.Range(min=0, max=6))
    next_due = fields.Date(data_key="nextDue", allow_none=True)
    notes = fields.String(load_default="", validate=validate.Length(max=1000))
    status = fields.String(load_default="active", validate=validate.OneOf(["active", "completed"]))
    
    @pre_load
    def sanitize_inputs(self, data, **kwargs):
        return sanitize_string_fields(data, ["title", "notes"])

    @validates_schema
    def validate_dates(self, data, **kwargs):
        if data.get("end_date") and data.get("start_date"):
            if data["end_date"] < data["start_date"]:
                raise ValidationError("End date cannot be before start date.", "end_date")

class LoanPaymentSchema(Schema):
    amount = fields.Decimal(required=True, validate=validate.Range(min=0.01, max=999999999.99, error="Amount must be between 0.01 and 999,999,999.99."))

class LoanReminderUpdateSchema(Schema):
    newType = fields.String(required=True, validate=validate.OneOf(["monthly", "weekly"]))
    nextDue = fields.Date(required=True)

class LoanDueDateUpdateSchema(Schema):
    newValue = fields.Integer(required=True, validate=validate.Range(min=0, max=31))
    nextDue = fields.Date(required=True)
    changeType = fields.String(required=True, validate=validate.OneOf(["temporary", "permanent"]))
    reminderType = fields.String(required=True, validate=validate.OneOf(["monthly", "weekly"]))
