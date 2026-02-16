data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda"
  output_path = "${path.module}/lambda_handler.zip"
}

resource "aws_lambda_function" "lambda_handler" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "lambda_handler"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "lambda_handler.lambda_handler"
  runtime          = "python3.12"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  reserved_concurrent_executions = 10

  timeout = 30

  vpc_config {
    subnet_ids = [aws_subnet.private_zone1.id, aws_subnet.private_zone2]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }
}

resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = aws_sqs_queue.telemetry_queue.arn
  function_name    = aws_lambda_function.lambda_handler.arn
  batch_size       = 10
  enabled          = true
}