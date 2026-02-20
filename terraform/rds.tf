data "aws_db_instance" "data-rds-main-db" {
  db_instance_identifier = aws_db_instance.main-db.identifier
}

resource "aws_db_instance" "main-db" {
  identifier        = var.db_indentifier
  instance_class    = var.db_instance_class
  allocated_storage = var.db_allocated_storage
  engine            = var.db_engine
  engine_version    = var.db_engine_version
  db_name = "test"

  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.default.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]

  publicly_accessible = false
  skip_final_snapshot = true

  storage_type            = "gp3"
  backup_retention_period = 7

  iam_database_authentication_enabled = true

  tags = {
    Name = "dev-rds-postgres-db"
  }
}


resource "aws_secretsmanager_secret" "db_secret" {
  name = "dev/industrial-db/credentials"
}

resource "aws_secretsmanager_secret_version" "db_secret_val" {
  secret_id = aws_secretsmanager_secret.db_secret.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
    engine   = "postgres"
    host     = aws_db_instance.main-db.address
    port     = 4510
  })
}

resource "aws_db_proxy" "rds-proxy" {
  name                   = "rds-proxy"
  engine_family          = "POSTGRESQL"
  role_arn               = aws_iam_role.rds_proxy_role.arn
  vpc_subnet_ids         = [aws_subnet.private_zone1.id, aws_subnet.private_zone2.id]
  vpc_security_group_ids = [aws_security_group.db_sg.id]

  auth {
    auth_scheme = "SECRETS"
    secret_arn  = aws_secretsmanager_secret.db_secret.arn
    iam_auth    = "REQUIRED"
  }
}

resource "aws_db_proxy_default_target_group" "rds-proxy-target-group" {
  db_proxy_name = aws_db_proxy.rds-proxy.name

  connection_pool_config {
    connection_borrow_timeout    = 120
    max_connections_percent      = 100
    max_idle_connections_percent = 50
  }
}

resource "aws_db_proxy_target" "proxy-target" {
  target_group_name      = aws_db_proxy_default_target_group.rds-proxy-target-group.name
  db_proxy_name          = aws_db_proxy.rds-proxy.name
  db_instance_identifier = data.aws_db_instance.data-rds-main-db.id
}
