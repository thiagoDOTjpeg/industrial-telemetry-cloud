resource "aws_iam_role" "lambda_exec" {
  name = "lambda_exec_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Sid    = ""
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_access" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "lambda_sqs" {
  name = "lambda_sqs_policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.telemetry_queue.arn
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_rds_connect" {
  name = "lambda_rds_connect_policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "rds-db:connect"
      Resource = "arn:aws:rds-db:${var.aws_region}:*:dbuser:*/*"
    }]
  })
}

resource "aws_iam_role" "rds_proxy_role" {
  name = "rds-proxy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "rds.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "rds_proxy_policy" {
  name = "rds-proxy-policy"
  role = aws_iam_role.rds_proxy_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "secretsmanager:GetSecretValue",
          "kms:Decrypt"
        ],
        Resource = [aws_secretsmanager_secret.db_secret.arn]
      }
    ]
  })
}

resource "aws_iam_policy" "grafana_policy" {
  name = "GrafanaAccessPolicy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
          "cloudwatch:GetMetricData",
          "cloudwatch:ListMetrics",
          "logs:DescribeLogGroups",
          "logs:GetLogEvents",
          "logs:FilterLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = "rds-db:connect"
        Resource = "arn:aws:rds-db:${var.aws_region}:*:dbuser:${element(split(":", aws_db_proxy.rds-proxy.arn), 6)}/grafana_reader"
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_ws_broadcast" {
  name = "lambda_ws_broadcast_policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Scan",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ]
        Resource = aws_dynamodb_table.ws_connections.arn
      },
      {
        Effect = "Allow"
        Action = "execute-api:ManageConnections"
        Resource = "arn:aws:execute-api:${var.aws_region}:*:*"
      }
    ]
  })
}

resource "aws_iam_user" "grafana_external" {
  name = "grafana-external-user"
}

resource "aws_iam_access_key" "grafana_external" {
  user = aws_iam_user.grafana_external.name
}

resource "aws_iam_user_policy_attachment" "grafana_attach" {
  user       = aws_iam_user.grafana_external.name
  policy_arn = aws_iam_policy.grafana_policy.arn 
}
