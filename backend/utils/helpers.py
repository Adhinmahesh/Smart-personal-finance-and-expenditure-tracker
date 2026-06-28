from flask import jsonify

def success_response(data=None, message="Success", status_code=200, **kwargs):
    response = {"success": True, "message": message}
    if data is not None:
        response["data"] = data
    for key, val in kwargs.items():
        if val is not None:
            response[key] = val
    return jsonify(response), status_code

def error_response(message="An error occurred", status_code=400, errors=None):
    response = {"success": False, "message": message}
    if errors is not None:
        response["errors"] = errors
    return jsonify(response), status_code
