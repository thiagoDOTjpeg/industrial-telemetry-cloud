variable "db_username" {
  type    = string
  default = "admin"
}

variable "db_password" {
  type    = string
}

variable "db_indentifier" {
  type    = string
  default = "industrial-db"
}

variable "db_engine" {
  type    = string
  default = "postgres"
}

variable "db_engine_version" {
  type    = string
  default = "10"
}

variable "db_instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "db_allocated_storage" {
  type    = number
  default = 10
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "aws_access_key" {
  type    = string
}

variable "aws_secret_key" {
  type    = string
}