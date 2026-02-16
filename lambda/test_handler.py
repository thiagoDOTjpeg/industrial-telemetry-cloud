from lambda_handler import lambda_handler
import json

mock_event = {
    "Records": [{"body": json.dumps({"machine_id": "dev-01", "temperature": 25.5, "status": "OK"})}]
}

if __name__ == "__main__":
    lambda_handler(mock_event, None)