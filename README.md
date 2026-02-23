# 🏭 Industrial Telemetry Cloud

Sistema de telemetria industrial serverless na AWS, projetado para ingestão, processamento e armazenamento seguro de dados de máquinas e equipamentos industriais.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Decisões de Arquitetura](#decisões-de-arquitetura)
- [Fluxo de Dados](#fluxo-de-dados)
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

![Diagrama de Arquitetura](./diagrama-arquitetura.png)


---

## 💡 Decisões de Arquitetura

1. **VPC Endpoints em vez de NAT Gateways**: O projeto utiliza VPC Endpoints (PrivateLink) em substituição aos NAT Gateways. Essa decisão foi motivada por otimização de custos, visto que o NAT Gateway gera cobranças baseadas no volume de dados (banda) trafegados e por hora ativa, enquanto os endpoints proporcionam comunicação privada direta aos serviços da AWS (como SQS) mantendo o tráfego inteiramente na rede da AWS com um custo significativamente menor.

2. **Utilização do RDS Proxy**: Foi implementado o Amazon RDS Proxy para o gerenciamento inteligente do *pool* de conexões com o banco de dados. Isso previne gargalos de conexão e evita falhas/timeout durante os *cold starts* das funções Lambda, bem como em cenários de alta concorrência.

3. **IAM Authentication no Banco de Dados**: Utilização do AWS IAM para autenticação no banco de dados em vez de senhas tradicionais. Isso elimina a necessidade de gerenciar ou rotacionar senhas em banco ou no código, aumentando a segurança e facilitando a auditoria.

4. **Princípio do Menor Privilégio**: Segurança reforçada onde cada Lambda tem um acesso restrito. Ao invés de usar um usuário genérico no banco de dados, cada Lambda possui um usuário próprio no banco de dados aliado ao IAM que permite realizar estritamente as operações necessárias para a finalidade da função (por exemplo, habilitado apenas para realizar `INSERT`, com restrições para demais execuções).

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
- Persiste dados no RDS PostgreSQL através do RDS Proxy
- Completamente stateless (sem estado local)

### 4. RDS PostgreSQL (Armazenamento Seguro)

Banco de dados relacional em ambiente isolado:

- Deploy em **Private Subnets** (sem IP público)
- Acesso restrito via Security Groups
- Autenticação via IAM Database Authentication

---

## 🔐 Segurança

### VPC e Rede

```text
VPC
├── Public Subnets (2 AZs)
└── Private Subnets (2 AZs)
    ├── VPC Endpoints
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
- Usuário do banco com permissões restritas (cada Lambda tem um usuário próprio que a permite fazer apenas o que deve):
  - ✅ `INSERT` - Inserir dados de telemetria
  - ❌ `SELECT` / `DELETE` / `DROP` / `UPDATE` - Bloqueados para envio genérico

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
2. **Reserved Concurrency na Lambda** - Limite configurado para proteger as conexões do banco
3. **RDS Proxy (Connection Pooling)** - Trata de forma eficiente milhares de conexões em curtos espaços de tempo devido à escala ágil das Lambdas.

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

```text
industrial-telemetry-cloud/
├── README.md
├── diagrama-arquitetura.png # Diagrama visual da arquitetura
├── terraform/
│   ├── main.tf              # Provider e configurações gerais
│   ├── vpc.tf               # VPC, Subnets, VPC Endpoints
│   ├── security_groups.tf   # Security Groups
│   ├── sqs.tf               # Filas SQS + DLQ
│   ├── lambda.tf            # Função Lambda + IAM Role
│   ├── rds.tf               # RDS PostgreSQL e RDS Proxy
│   ├── cloudwatch.tf        # Logs e métricas
│   ├── variables.tf         # Variáveis de entrada
│   ├── outputs.tf           # Outputs do deploy
│   └── terraform.tfvars     # Valores das variáveis
├── lambda/
│   ├── handler.py           # Código da Lambda
│   ├── requirements.txt     # Dependências Python
│   └── schema.py            # Validação de schema JSON
└── producer/
    ├── edge_device.py       # Simulador de dispositivo industrial
    ├── requirements.txt     # Dependências Python
    └── config.py            # Configurações do produtor
```

---

## 🛠️ Recursos Terraform

### VPC e Rede

- `aws_vpc` - VPC principal
- `aws_subnet` - 2 públicas + 2 privadas
- `aws_vpc_endpoint` - Comunicação privada sem NAT Gatway
- `aws_route_table` - Tabelas de roteamento

### Segurança

- `aws_security_group` - SGs para Lambda e RDS
- `aws_iam_role` - Role da Lambda baseada em Least Privilege
- `aws_iam_policy` - Políticas de acesso restritas

### Mensageria

- `aws_sqs_queue` - Fila principal
- `aws_sqs_queue` - Dead Letter Queue

### Compute

- `aws_lambda_function` - Processador
- `aws_lambda_event_source_mapping` - Trigger SQS

### Database

- `aws_db_subnet_group` - Subnet group para RDS
- `aws_db_instance` - RDS PostgreSQL
- `aws_db_proxy` - Integração e pool de conexões (RDS Proxy)

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
