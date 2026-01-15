provider "aws" {
  region                      = var.aws_region
  access_key                  = var.aws_access_key
  secret_key                  = var.aws_secret_key
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    ec2            = var.provider_localhost
    s3             = var.provider_localhost_s3
    sts            = var.provider_localhost
    iam            = var.provider_localhost
    sqs            = var.provider_localhost
    lambda         = var.provider_localhost
    rds            = var.provider_localhost
  }
}

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}