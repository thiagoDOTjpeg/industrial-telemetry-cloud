resource "aws_dynamodb_table" "ws_connections" {
  name           = "websocket-connections"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "connectionId"
  attribute { 
    name = "connectionId"
     type = "S"
  }
}

resource "aws_apigatewayv2_api" "telemetry_ws" {
  name                       = "dev-telemetry-ws"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

resource "aws_apigatewayv2_stage" "dev" {
  api_id      = aws_apigatewayv2_api.telemetry_ws.id
  name        = "dev"
  auto_deploy = true
}

resource "aws_lambda_function" "ws_connect" {
  filename         = data.archive_file.query_zip.output_path
  function_name    = "ws_connect"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "ws_connect.handler"
  runtime          = "python3.12"
}

resource "aws_apigatewayv2_route" "connect" {
  api_id    = aws_apigatewayv2_api.telemetry_ws.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.ws_connect.id}"
}

resource "aws_apigatewayv2_integration" "ws_connect" {
  api_id           = aws_apigatewayv2_api.telemetry_ws.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.ws_connect.invoke_arn
}

resource "aws_lambda_permission" "ws_connect_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ws_connect.function_name
  principal     = "apigateway.amazonaws.com"
}