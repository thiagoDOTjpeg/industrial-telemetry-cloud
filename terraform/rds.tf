resource "aws_db_instance" "main-db" {
  identifier             = "industrial-db"
  instance_class         = "db.t3.micro"
  allocated_storage      = 10 
  engine                 = "postgres"
  engine_version         = "16"
  
  username               = var.db_username
  password               = var.db_password
  
  db_subnet_group_name   = aws_db_subnet_group.default.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  
  publicly_accessible    = false
  skip_final_snapshot    = true
  
  storage_type           = "gp3" 
  backup_retention_period = 7 
}