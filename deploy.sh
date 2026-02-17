#!/bin/bash
set -e 

echo "Iniciando automação de deploy (Target: Python 3.12)..."

PROJECT_ROOT=$(pwd)
LAYER_PATH="$PROJECT_ROOT/layers/psycopg2_layer/python/lib/python3.12/site-packages"

echo "Limpando artefatos antigos..."
rm -rf "$PROJECT_ROOT/layers/psycopg2_layer"
rm -f "$PROJECT_ROOT/terraform/*.zip"

echo "Instalando psycopg2-binary via Python 3.12..."
mkdir -p "$LAYER_PATH"

python3.12 -m pip install --upgrade psycopg2-binary==2.9.11 -t "$LAYER_PATH"

echo "🗑️ Removendo arquivos desnecessários para reduzir o ZIP..."
rm -rf "$LAYER_PATH"/*.dist-info
rm -rf "$LAYER_PATH"/*.egg-info
find "$PROJECT_ROOT/layers/psycopg2_layer" -name "__pycache__" -type d -exec rm -rf {} +

echo "🔍 Verificando versão do binário..."
if ls "$LAYER_PATH/psycopg2/"*cpython-312* >/dev/null 2>&1; then
    echo "Binário cpython-312 detectado corretamente."
else
    echo "ERRO: Binário 3.12 não encontrado. Verifique a instalação do python3.12-pip na VPS."
    exit 1
fi

echo "Aplicando infraestrutura via Terraform..."
cd "$PROJECT_ROOT/terraform"
terraform init
terraform apply -auto-approve

echo "Deploy finalizado com sucesso no LocalStack!"