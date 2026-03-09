import json
import logging
import psycopg2
import boto3
import os

logger = logging.getLogger()
logger.setLevel(logging.INFO)

AWS_REGION = os.getenv("AWS_REGION")
DB_ENDPOINT = os.getenv("DB_ENDPOINT")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_USER = os.getenv("DB_USER")
DB_NAME = os.getenv("DB_NAME")

client = boto3.client('rds', region_name=AWS_REGION)
DB_HOST = DB_ENDPOINT.split(':')[0] if DB_ENDPOINT else ""

def get_auth_token():
    return client.generate_db_auth_token(
        DBHostname=DB_HOST,
        Port=DB_PORT,
        DBUsername=DB_USER,
        Region=AWS_REGION
    )

def lambda_handler(event, context):
    token = get_auth_token()

    query = "SELECT machine_id, temperature, status, created_at, vibration_level FROM telemetry"
    orderLimit = " ORDER BY created_at DESC LIMIT 50"
    conditions = []
    values = []

    params = event.get("queryStringParameters") or {}

    if "machine_id" in params:
        conditions.append("machine_id = %s")
        values.append(params["machine_id"])
    
    if "status" in params:
        conditions.append("status = %s")
        values.append(params["status"])

    if "interval" in params:
        conditions.append("created_at > NOW() - INTERVAL %s")
        values.append(params["interval"]) 
    elif not conditions:
        conditions.append("created_at > NOW() - INTERVAL '1 hour'")

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    if "limit" in params:
        try:
            limit_val = int(params["limit"])
            query += f" ORDER BY created_at DESC LIMIT %s"
            values.append(limit_val)
        except ValueError:
            query += orderLimit
    else:
        query += orderLimit

    conn = None
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=token,
            port=DB_PORT,
            connect_timeout=5,
            sslmode='disable' if 'localhost' in DB_HOST else 'require'
        )

        cur = conn.cursor()
        cur.execute(query, values)
        rows = cur.fetchall()
        
        telemetry_data = [
            {
                "machine_id": r[0], 
                "temperature": r[1], 
                "status": r[2], 
                "timestamp": r[3].isoformat(),
                "vibration_level": r[4]
            } for r in rows
        ]
        
        cur.close()
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' 
            },
            'body': json.dumps(telemetry_data)
        }

    except Exception as e:
        logger.error(f"Erro na consulta: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}
    finally:
        if conn:
            conn.close()
