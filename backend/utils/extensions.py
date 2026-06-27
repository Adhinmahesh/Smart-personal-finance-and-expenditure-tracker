from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import JWTManager

limiter = Limiter(key_func=get_remote_address, default_limits=["2000 per day", "200 per minute"], storage_uri="memory://")
jwt = JWTManager()
