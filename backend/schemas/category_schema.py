from marshmallow import Schema, fields, validate, pre_load
from utils.sanitizers import sanitize_string_fields

class CategorySchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=100))
    icon = fields.String(load_default="", validate=validate.Length(max=10))
    color = fields.String(load_default="#000000", validate=validate.Regexp(r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$", error="Invalid hex color code."))
    type = fields.String(required=True, validate=validate.OneOf(["expense", "income", "both"]))

    @pre_load
    def sanitize_inputs(self, data, **kwargs):
        return sanitize_string_fields(data, ["name"])
