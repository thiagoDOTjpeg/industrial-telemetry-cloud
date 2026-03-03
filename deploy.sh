#!/bin/bash
set -e 

echo "Iniciando automacao de deploy (Target: Python 3.12)..."

PROJECT_ROOT=$(pwd)
LAYER_PATH="$PROJECT_ROOT/layers/psycopg2_layer/python/lib/python3.12/site-packages"

echo "Limpando artefatos antigos..."
rm -rf "$PROJECT_ROOT/layers/psycopg2_layer"
rm -f "$PROJECT_ROOT/terraform/*.zip"

echo "Instalando psycopg2-binary via Python 3.12..."
mkdir -p "$LAYER_PATH"
python3.12 -m pip install --upgrade psycopg2-binary==2.9.11 -t "$LAYER_PATH"

echo "Removendo arquivos desnecessarios..."
rm -rf "$LAYER_PATH"/*.dist-info
rm -rf "$LAYER_PATH"/*.egg-info
find "$PROJECT_ROOT/layers/psycopg2_layer" -name "__pycache__" -type d -exec rm -rf {} +

echo "Verificando versao do binario..."
if ls "$LAYER_PATH/psycopg2/"*cpython-312* >/dev/null 2>&1; then
    echo "Binario cpython-312 detectado corretamente."
else
    echo "ERRO: Binario 3.12 nao encontrado."
    exit 1
fi

echo "Aplicando infraestrutura via Terraform..."
cd "$PROJECT_ROOT/terraform"
terraform init
terraform apply -auto-approve

echo "Configurando banco de dados e permissoes SQL..."

if [ -z "$REST_API_ID" ] || [ "$REST_API_ID" == "null" ]; then
    echo "ERRO: Nao foi possivel capturar o REST_API_ID."
    exit 1
fi

REST_API_ID=$(aws --endpoint-url=http://localhost:4566 apigateway get-rest-apis | grep -o '"id": "[^"]*' | grep -o '[^"]*$')
VITE_REST_URL="http://athens.gritti.dev.br:4566/restapis/$REST_API_ID/dev/_user_request_/telemetry"

VITE_WS_URL="ws://athens.gritti.dev.br:4510/dev"

echo "Gerando arquivo .env..."

cat <<EOF > "$PROJECT_ROOT/web/.env"
VITE_REST_URL=$VITE_REST_URL
VITE_WS_URL=$VITE_WS_URL
EOF

DB_HOST="127.0.0.1"
DB_PORT="4511"
DB_USER="admin"
DB_PASS="admin"
DB_NAME="test"

SQL_SCRIPT=$(cat <<EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'grafana_reader') THEN
        CREATE USER grafana_reader;
    END IF;
END
\$\$;

DO \$\$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'lambda_api_user') THEN
        CREATE USER lambda_api_user;
    END IF;
END 
\$\$;

GRANT rds_iam TO lambda_api_user;
GRANT rds_iam TO grafana_reader;

CREATE TABLE IF NOT EXISTS telemetry (
    id SERIAL PRIMARY KEY,
    machine_id TEXT NOT NULL,
    temperature FLOAT NOT NULL,
    vibration_level FLOAT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

GRANT SELECT ON telemetry TO lambda_api_user;
GRANT INSERT ON telemetry TO lambda_api_user;
GRANT SELECT ON telemetry TO grafana_reader;
GRANT USAGE, SELECT ON SEQUENCE telemetry_id_seq TO lambda_api_user;
EOF
)
MAX_RETRIES=10
COUNT=0
ERROR_LOG=$(mktemp)

echo "Tentando configurar o banco de dados..."

until PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$SQL_SCRIPT" > /dev/null 2> "$ERROR_LOG"; do
    COUNT=$((COUNT + 1))
    
    echo "Falha na tentativa $COUNT/$MAX_RETRIES. Erro:"
    sed 's/^/  [PSQL ERR] /' "$ERROR_LOG"
    
    if [ $COUNT -ge $MAX_RETRIES ]; then
        echo "--------------------------------------------------------"
        echo "ERRO FATAL: Falha ao configurar banco de dados após $MAX_RETRIES tentativas."
        echo "Log final do erro:"
        cat "$ERROR_LOG"
        rm -f "$ERROR_LOG"
        exit 1
    fi
    
    echo "Aguardando disponibilidade do banco... (5s)"
    sleep 5
done

rm -f "$ERROR_LOG"
echo "Configuracao SQL finalizada com sucesso."
