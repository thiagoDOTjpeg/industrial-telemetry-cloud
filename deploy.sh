#!/bin/bash
set -e 

echo "Iniciando automação de deploy..."

PROJECT_ROOT=$(pwd)
LAYER_PATH="$PROJECT_ROOT/layers/psycopg2_layer/python/lib/python3.12/site-packages"

echo "Limpando ambiente..."
rm -rf "$PROJECT_ROOT/layers/psycopg2_layer"
rm -f "$PROJECT_ROOT/terraform/*.zip"

echo "Instalando dependências da Layer..."
mkdir -p "$LAYER_PATH"
pip install --upgrade psycopg2-binary==2.9.11 -t "$LAYER_PATH"

rm -rf "$LAYER_PATH"/*.dist-info "$LAYER_PATH"/*.egg-info

echo "Aplicando infraestrutura via Terraform..."
cd "$PROJECT_ROOT/terraform"
terraform init
terraform apply -auto-approve

echo "Deploy finalizado com sucesso no LocalStack!"