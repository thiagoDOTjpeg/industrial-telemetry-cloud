import json
import logging
import psycopg2
import boto3
from config import AWS_REGION, DB_NAME, DB_ENDPOINT, DB_PORT, DB_USER

logger = logging.getLogger()
logger.setLevel(logging.INFO)

client = boto3.client('rds', region_name=AWS_REGION)

DB_HOST = DB_ENDPOINT.split(':')[0]

def get_auth_token():
    return client.generate_db_auth_token(
        DBHostname=DB_HOST,
        Port=DB_PORT,
        DBUsername=DB_USER,
        Region=AWS_REGION
    )


def lambda_handler(event, context):
    token = get_auth_token()
    
    conn = None
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=token,
            port=DB_PORT,
            connect_timeout=5,
            sslmode='disable' 
        )
        
        cur = conn.cursor()

        records = event.get("Records", [])
        
        for record in records:
            message_body = record.get("body", "")

            message_data = json.loads(message_body)

            logger.info("telemetry received")
            
            query = "INSERT INTO telemetry (machine_id, temperature, status) VALUES (%s, %s, %s)"
            cur.execute(query, (
                message_data['machine_id'], 
                message_data['temperature'], 
                message_data['status']
            ))
            
        conn.commit()
        cur.close()
        return {'statusCode': 200, 'body': json.dumps('Sucesso')}

    except Exception as e:
        logger.error(f"Erro na conexão ou execução: {e}")
        raise e
    finally:
        if conn:
            conn.close()
