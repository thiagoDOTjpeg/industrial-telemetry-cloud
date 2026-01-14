# 🏭 Industrial Telemetry Cloud

Sistema de telemetria industrial serverless na AWS, projetado para ingestão, processamento e armazenamento seguro de dados de máquinas e equipamentos industriais.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Fluxo de Dados](#fluxo-de-dados)
- [Componentes](#componentes)
- [Segurança](#segurança)
- [Observabilidade](#observabilidade)
- [Escalabilidade](#escalabilidade)
- [Pré-requisitos](#pré-requisitos)
- [Deploy](#deploy)
- [Estrutura do Projeto](#estrutura-do-projeto)

---

## 🎯 Visão Geral

Este projeto implementa uma arquitetura Cloud-Native para coleta e processamento de dados de telemetria industrial, utilizando:

- **Infraestrutura como Código (IaC)** com Terraform
- **Arquitetura Serverless** com AWS Lambda
- **Mensageria Resiliente** com Amazon SQS
- **Banco de Dados Seguro** com Amazon RDS PostgreSQL
- **Mentalidade DevSecOps** aplicada em todas as camadas

---

## 🏗️ Arquitetura

```
┌─────────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐
│  Industrial     │     │             │     │             │     │    Private Subnet   │
│  Edge Device    │────▶│  Amazon SQS │────▶│ AWS Lambda  │────▶│  ┌───────────────┐  │
│  (Python)       │     │  + DLQ      │     │ (Processor) │     │  │ RDS PostgreSQL│  │
└─────────────────┘     └─────────────┘     └─────────────┘     │  └───────────────┘  │
                                                   │             └─────────────────────┘
                                                   ▼
                                            ┌─────────────┐
                                            │ CloudWatch  │
                                            │ Logs/Metrics│
                                            └─────────────┘
```

---

## 🔄 Fluxo de Dados

### 1. Produtor (Industrial Edge Device)

Script Python que simula um dispositivo industrial de borda:

- Coleta dados de sensores/máquinas
- Envia mensagens JSON para o SQS
- Implementa **retry com exponential backoff** para resiliência
- Trata erros de conexão graciosamente

### 2. SQS (Amortecedor de Carga)

Fila de mensagens que atua como buffer:

- Absorve picos de carga sem perda de dados
- Desacopla produtor do consumidor
- **Dead Letter Queue (DLQ)**: Mensagens que falham 3x são movidas para auditoria
- Garante que nenhum dado seja perdido (crítico na indústria)

### 3. Lambda (Processador Stateless)

Função serverless que processa os eventos:

- Recebe eventos do SQS
- Valida schema JSON dos dados de telemetria
- Persiste dados no RDS PostgreSQL
- Completamente stateless (sem estado local)

### 4. RDS PostgreSQL (Armazenamento Seguro)

Banco de dados relacional em ambiente isolado:

- Deploy em **Private Subnets** (sem IP público)
- Acesso restrito via Security Groups
- Autenticação via IAM Database Authentication

---

## 🔐 Segurança

### VPC e Rede

```
VPC
├── Public Subnets (2 AZs)
│   └── NAT Gateway
└── Private Subnets (2 AZs)
    └── RDS PostgreSQL
```

### Security Groups

| Resource | Inbound Rule | Source                |
| -------- | ------------ | --------------------- |
| RDS      | TCP 5432     | Lambda Security Group |
| Lambda   | -            | Outbound only         |

### IAM (Least Privilege)

- **Sem credenciais hardcoded** - Uso de IAM Database Authentication
- Role da Lambda com permissões mínimas:
  - `rds-db:connect` - Apenas conexão ao RDS
- Usuário do banco com permissões restritas:
  - ✅ `INSERT` - Inserir dados de telemetria
  - ✅ `SELECT` - Consultar dados (se necessário)
  - ❌ `DELETE` - Bloqueado
  - ❌ `DROP` - Bloqueado

---

## 📊 Observabilidade

### CloudWatch Logs

- Logs estruturados da Lambda para troubleshooting
- Rastreamento de falhas sem "adivinhação"
- Retention policy configurável

### Métricas

- Mensagens na fila (SQS)
- Invocações e erros (Lambda)
- Conexões e performance (RDS)

### Alertas

- Mensagens na DLQ
- Erros de processamento
- Latência elevada

---

## 📈 Escalabilidade

### Pergunta: "E se o volume de dados aumentar 10x?"

**Resposta:**

1. **SQS absorve o pico** - A fila segura as mensagens durante spikes de carga
2. **Reserved Concurrency na Lambda** - Limite configurado para proteger as conexões do RDS
3. **RDS Connection Pooling** - Gerenciamento eficiente de conexões

```hcl
# Exemplo: Limite de concorrência da Lambda
resource "aws_lambda_function" "processor" {
  reserved_concurrent_executions = 10  # Protege o RDS
}
```

---

## ⚙️ Pré-requisitos

- [Terraform](https://www.terraform.io/downloads) >= 1.0
- [AWS CLI](https://aws.amazon.com/cli/) configurado
- [Python](https://www.python.org/) >= 3.9
- Conta AWS com permissões adequadas

---

## 🚀 Deploy

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/industrial-telemetry-cloud.git
cd industrial-telemetry-cloud
```

### 2. Configure as variáveis

```bash
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
# Edite o arquivo com suas configurações
```

### 3. Inicialize e aplique o Terraform

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### 4. Execute o produtor

```bash
cd producer
pip install -r requirements.txt
python edge_device.py
```

---

## 📁 Estrutura do Projeto

```
industrial-telemetry-cloud/
├── README.md
├── terraform/
│   ├── main.tf              # Provider e configurações gerais
│   ├── vpc.tf               # VPC, Subnets, NAT Gateway
│   ├── security_groups.tf   # Security Groups
│   ├── sqs.tf               # Filas SQS + DLQ
│   ├── lambda.tf            # Função Lambda + IAM Role
│   ├── rds.tf               # RDS PostgreSQL
│   ├── cloudwatch.tf        # Logs e métricas
│   ├── variables.tf         # Variáveis de entrada
│   ├── outputs.tf           # Outputs do deploy
│   └── terraform.tfvars     # Valores das variáveis
├── lambda/
│   ├── handler.py           # Código da Lambda
│   ├── requirements.txt     # Dependências Python
│   └── schema.py            # Validação de schema JSON
├── producer/
│   ├── edge_device.py       # Simulador de dispositivo industrial
│   ├── requirements.txt     # Dependências Python
│   └── config.py            # Configurações do produtor
└── docs/
    ├── architecture.md      # Detalhes da arquitetura
    └── troubleshooting.md   # Guia de resolução de problemas
```

---

## 🛠️ Recursos Terraform

### VPC e Rede

- `aws_vpc` - VPC principal
- `aws_subnet` - 2 públicas + 2 privadas
- `aws_internet_gateway` - Acesso à internet
- `aws_nat_gateway` - NAT para subnets privadas
- `aws_route_table` - Tabelas de roteamento
- `aws_eip` - IP elástico para NAT

### Segurança

- `aws_security_group` - SGs para Lambda e RDS
- `aws_iam_role` - Role da Lambda
- `aws_iam_policy` - Políticas de acesso

### Mensageria

- `aws_sqs_queue` - Fila principal
- `aws_sqs_queue` - Dead Letter Queue

### Compute

- `aws_lambda_function` - Processador
- `aws_lambda_event_source_mapping` - Trigger SQS

### Database

- `aws_db_subnet_group` - Subnet group para RDS
- `aws_db_instance` - RDS PostgreSQL

### Observabilidade

- `aws_cloudwatch_log_group` - Logs da Lambda
- `aws_cloudwatch_metric_alarm` - Alertas

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👤 Autor

**Thiago Gritti**

---

<p align="center">
  <i>Desenvolvido com mentalidade DevSecOps 🔒</i>
</p>
