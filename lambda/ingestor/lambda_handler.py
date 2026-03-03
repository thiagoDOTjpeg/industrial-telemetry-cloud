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
DB_PORT = int(os.getenv("DB_PORT"))
DB_USER = os.getenv("DB_USER")
DB_NAME = os.getenv("DB_NAME")
LOCALSTACK_URL = "http://localhost.localstack.cloud:4566"
WS_API_ID = "2bd6ca48"

WS_ENDPOINT = f"http://{WS_API_ID}.execute-api.localhost.localstack.cloud:4566/dev"

rds_client = boto3.client('rds', region_name=AWS_REGION, endpoint_url=LOCALSTACK_URL)
dynamodb = boto3.resource('dynamodb', endpoint_url=LOCALSTACK_URL)
table = dynamodb.Table('websocket-connections')
api_client = boto3.client(
    'apigatewaymanagementapi', 
    endpoint_url=WS_ENDPOINT
)

DB_HOST = DB_ENDPOINT.split(':')[0]

def get_auth_token():
    return rds_client.generate_db_auth_token(
        DBHostname=DB_HOST, Port=DB_PORT, DBUsername=DB_USER, Region=AWS_REGION
    )

def send_to_conn(conn_id, payload):
    try:
        print(f"Tentando enviar para {conn_id} no endpoint {WS_ENDPOINT}")
        api_client.post_to_connection(ConnectionId=conn_id, Data=payload)
    except Exception as e:
        print(f"FALHA NO BROADCAST: {str(e)}") 
        table.delete_item(Key={'connectionId': conn_id})

def lambda_handler(event, context):
    token = get_auth_token()
    db_conn = None
    
    try:
        db_conn = psycopg2.connect(
            host=DB_HOST, 
            database=DB_NAME,
            user=DB_USER,
            password=token,
            port=DB_PORT,
            connect_timeout=5,
            sslmode='disable'
        )
        cur = db_conn.cursor()
        
        records = event.get("Records", [])
        telemetry_batch = []
        
        for record in records:
            data = json.loads(record.get("body", ""))
            telemetry_batch.append(data)
            cur.execute(
                "INSERT INTO telemetry (machine_id, temperature, status, vibration_level) VALUES (%s, %s, %s, %s)",
                (data['machine_id'], data['temperature'], data['status'], data['vibration_level'])
            )
            
        db_conn.commit()
        cur.close()

        if telemetry_batch:
            payload = json.dumps(telemetry_batch)
            connections = table.scan(ProjectionExpression="connectionId").get('Items', [])
            with ThreadPoolExecutor(max_workers=10) as executor:
                for item in connections:
                    executor.submit(send_to_conn, item['connectionId'], payload)
                
        return {'statusCode': 200, 'body': 'Sucesso'}
    except Exception as e:
        logger.error(f"Erro: {e}")
        raise e
    finally:
        if db_conn: db_conn.close()
