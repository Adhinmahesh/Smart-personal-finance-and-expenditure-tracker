import logging
from models.report import ReportModel

logger = logging.getLogger(__name__)

class ReportService:
    @staticmethod
    def get_summary(user_id):
        try:
            summary = ReportModel.get_summary(user_id)
            return {"success": True, "data": summary, "status": 200}
        except Exception as e:
            logger.exception("Error fetching report summary")
            return {"error": "Failed to fetch summary", "status": 500}

    @staticmethod
    def get_category_breakdown(user_id):
        try:
            data = ReportModel.get_category_breakdown(user_id)
            return {"success": True, "data": data, "status": 200}
        except Exception as e:
            logger.exception("Error fetching category breakdown")
            return {"error": "Failed to fetch category breakdown", "status": 500}

    @staticmethod
    def get_monthly_trends(user_id, months=6):
        try:
            data = ReportModel.get_monthly_trends(user_id, months)
            return {"success": True, "data": data, "status": 200}
        except Exception as e:
            logger.exception("Error fetching monthly trends")
            return {"error": "Failed to fetch monthly trends", "status": 500}

