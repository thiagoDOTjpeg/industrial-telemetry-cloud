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

DB_HOST="localhost"
DB_PORT="4510"
DB_USER="admin"
DB_PASS="admin"
DB_NAME="test"

SQL_SCRIPT=$(cat <<EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'telemetry_user') THEN
        CREATE USER telemetry_user;
    END IF;
END
\$\$;

GRANT rds_iam TO telemetry_user;

CREATE TABLE IF NOT EXISTS telemetry (
    id SERIAL PRIMARY KEY,
    machine_id TEXT NOT NULL,
    temperature FLOAT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

GRANT INSERT ON telemetry TO telemetry_user;
GRANT USAGE, SELECT ON SEQUENCE telemetry_id_seq TO telemetry_user;
EOF
)

MAX_RETRIES=10
COUNT=0
until PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$SQL_SCRIPT" > /dev/null 2>&1; do
    COUNT=$((COUNT + 1))
    if [ $COUNT -ge $MAX_RETRIES ]; then
        echo "ERRO: Falha ao configurar banco de dados apos $MAX_RETRIES tentativas."
        exit 1
    fi
    echo "Aguardando disponibilidade do banco (Tentativa $COUNT/$MAX_RETRIES)..."
    sleep 5
done

echo "Configuracao SQL finalizada com sucesso."
echo "Deploy finalizado!"