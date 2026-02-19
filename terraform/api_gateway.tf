resource "aws_api_gateway_rest_api" "telemetry_api" {
  name = "dev-telemetry-api"
}

resource "aws_api_gateway_resource" "telemetry" {
  rest_api_id = aws_api_gateway_rest_api.telemetry_api.id
  parent_id   = aws_api_gateway_rest_api.telemetry_api.root_resource_id
  path_part   = "telemetry"
}

resource "aws_api_gateway_method" "get_telemetry" {
  rest_api_id   = aws_api_gateway_rest_api.telemetry_api.id
  resource_id   = aws_api_gateway_resource.telemetry.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id             = aws_api_gateway_rest_api.telemetry_api.id
  resource_id             = aws_api_gateway_resource.telemetry.id
  http_method             = aws_api_gateway_method.get_telemetry.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.get_telemetry_lambda.invoke_arn
}

resource "aws_api_gateway_deployment" "dev" {
  rest_api_id = aws_api_gateway_rest_api.telemetry_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.telemetry.id,
      aws_api_gateway_method.get_telemetry.id,
      aws_api_gateway_integration.lambda_integration.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [aws_api_gateway_integration.lambda_integration]
}

resource "aws_api_gateway_stage" "dev" {
  deployment_id = aws_api_gateway_deployment.dev.id
  rest_api_id   = aws_api_gateway_rest_api.telemetry_api.id
  stage_name    = "dev"
}

resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_telemetry_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.telemetry_api.execution_arn}/*/*"
}