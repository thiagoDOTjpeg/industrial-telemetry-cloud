variable "db_username" {
  type    = string
  default = "admin"
}

variable "db_password" {
  type    = string
  default = "admin"
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

variable "provider_localhost" {
  type    = string
  default = "http://localhost:4566"
}

variable "provider_localhost_s3" {
  type    = string
  default = "http://s3.localhost.localstack.cloud:4566"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "aws_access_key" {
  type    = string
  default = "teste"
}

variable "aws_secret_key" {
  type    = string
  default = "teste"
}