import logging
from models.comparison import ComparisonModel

logger = logging.getLogger(__name__)

class ComparisonService:
    @staticmethod
    def get_comparison(user_id, month=None):
        try:
            data = ComparisonModel.get_comparison(user_id, month)
            
            over_budget = [d for d in data if d["diff"] > 0]
            under_budget = [d for d in data if d["diff"] < 0]
            net_variance = sum(d["diff"] for d in data)
            
            return {
                "success": True,
                "data": {
                    "categories": data,
                    "summary": {
                        "over_budget_count": len(over_budget),
                        "under_budget_count": len(under_budget),
                        "net_variance": net_variance
                    }
                },
                "status": 200
            }
        except Exception as e:
            logger.exception("Error fetching comparison data")
            return {"error": "Failed to fetch comparison data", "status": 500}
