data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda"
  output_path = "${path.module}/lambda_handler.zip"

  excludes = [
    "venv",
    ".venv",
    "__pycache__",
    ".env",
    "requirements-dev.txt",
    "test_handler.py"
  ]
}

data "archive_file" "psycopg2_layer_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../layers/psycopg2_layer"
  output_path = "${path.module}/psycopg2_layer.zip"
}
resource "aws_lambda_layer_version" "psycopg2" {
  filename            = data.archive_file.psycopg2_layer_zip.output_path
  layer_name          = "psycopg2_layer"
  compatible_runtimes = ["python3.12"]
}

resource "aws_lambda_function" "lambda_handler" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "lambda_handler"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "lambda_handler.lambda_handler"
  runtime          = "python3.12"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  layers           = [aws_lambda_layer_version.psycopg2.arn]

  reserved_concurrent_executions = 10

  timeout = 30

  environment {
    variables = {
      AWS_REGION  = var.aws_region
      DB_ENDPOINT = aws_db_proxy.rds-proxy.endpoint
      DB_PORT     = 5432
      DB_USER     = var.db_username_iam
      DB_NAME     = "postgres"
    }
  }

  vpc_config {
    subnet_ids         = [aws_subnet.private_zone1.id, aws_subnet.private_zone2.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }
}

resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = aws_sqs_queue.telemetry_queue.arn
  function_name    = aws_lambda_function.lambda_handler.arn
  batch_size       = 10
  enabled          = true
}
