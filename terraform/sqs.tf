resource "aws_sqs_queue" "telemetry_dlq" {
  name = "dev-industrial-telemetry-dlq"
  
  message_retention_seconds = 604800 

  tags = {
    Name = "dev-industrial-telemetry-dlq"
  }
}

resource "aws_sqs_queue" "telemetry_queue" {
  name                      = "dev-industrial-telemetry-queue"
  delay_seconds             = 0
  max_message_size          = 262144 
  message_retention_seconds = 86400  
  receive_wait_time_seconds = 10     
  
  visibility_timeout_seconds = 180

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.telemetry_dlq.arn
    maxReceiveCount     = 3 #
  })

  tags = {
    Name = "dev-industrial-telemetry-queue"
  }
}