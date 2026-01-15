// SECURITY GROUP PARA A LAMBDA
resource "aws_security_group" "lambda_sg" {
  name   = "dev-lambda-sg"
  vpc_id = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "dev-lambda-sg" }
}

// SECURITY GROUP PARA O RDS (O COFRE)
resource "aws_security_group" "db_sg" {
  name   = "dev-db-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda_sg.id]
  }

  tags = { Name = "dev-db-sg" }
}