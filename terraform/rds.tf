resource "aws_db_instance" "main-db" {
  identifier             = var.db_indentifier
  instance_class         = var.db_instance_class
  allocated_storage      = var.db_allocated_storage
  engine                 = var.db_engine
  engine_version         = var.db_engine_version
  
  username               = var.db_username
  password               = var.db_password
  
  db_subnet_group_name   = aws_db_subnet_group.default.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  
  publicly_accessible    = false
  skip_final_snapshot    = true
  
  storage_type           = "gp3" 
  backup_retention_period = 7 
}