import json
import logging
import psycopg2
import boto3
import os
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger()
logger.setLevel(logging.INFO)

AWS_REGION = os.getenv("AWS_REGION")
DB_ENDPOINT = os.getenv("DB_ENDPOINT")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_USER = os.getenv("DB_USER")
DB_NAME = os.getenv("DB_NAME")
WS_ENDPOINT = os.getenv("WS_ENDPOINT_URL")

rds_client = boto3.client('rds', region_name=AWS_REGION)
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
table = dynamodb.Table('websocket-connections')
api_client = boto3.client('apigatewaymanagementapi', endpoint_url=WS_ENDPOINT)

DB_HOST = DB_ENDPOINT.split(':')[0] if DB_ENDPOINT else ""

def get_auth_token():
    return rds_client.generate_db_auth_token(
        DBHostname=DB_HOST, Port=DB_PORT, DBUsername=DB_USER, Region=AWS_REGION
    )

def send_to_conn(conn_id, payload):
    try:
        api_client.post_to_connection(ConnectionId=conn_id, Data=payload)
    except Exception:
        table.delete_item(Key={'connectionId': conn_id})

def lambda_handler(event, context):
    batch_item_failures = []
    telemetry_batch = []
    db_conn = None
    
    try:
        token = get_auth_token()
        db_conn = psycopg2.connect(
            host=DB_HOST, 
            database=DB_NAME,
            user=DB_USER,
            password=token,
            port=DB_PORT,
            connect_timeout=5,
            sslmode='disable' if 'localhost' in DB_HOST else 'require'
        )
        cur = db_conn.cursor()
        
        for record in event.get("Records", []):
            message_id = record.get("messageId")
            try:
                data = json.loads(record.get("body", ""))
                
                if data.get('machine_id') == "POISON_PILL_TEST":
                    raise ValueError("Poison Pill detectada")

                cur.execute(
                    "INSERT INTO telemetry (machine_id, temperature, status, vibration_level) VALUES (%s, %s, %s, %s)",
                    (data['machine_id'], data['temperature'], data['status'], data['vibration_level'])
                )
                telemetry_batch.append(data)
                
            except Exception as e:
                logger.error(f"Erro no processamento da mensagem {message_id}: {e}")
                batch_item_failures.append({"itemIdentifier": message_id})
        
        db_conn.commit()
        cur.close()

        if telemetry_batch:
            payload = json.dumps(telemetry_batch)
            connections = table.scan(ProjectionExpression="connectionId").get('Items', [])
            with ThreadPoolExecutor(max_workers=10) as executor:
                for item in connections:
                    executor.submit(send_to_conn, item['connectionId'], payload)
                
        return {"batchItemFailures": batch_item_failures}

    except Exception as e:
        logger.error(f"Falha crítica na infraestrutura: {e}")
        raise e
    finally:
        if db_conn: db_conn.close()