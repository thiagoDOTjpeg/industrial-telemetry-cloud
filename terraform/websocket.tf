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