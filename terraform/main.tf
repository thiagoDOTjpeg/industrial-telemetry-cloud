provider "aws" {
  region                      = var.aws_region
}



terraform {
  required_version = ">= 1.0"

  backend "s3" {
    bucket = "terraform-state"
    key = "industrial-telemetry/terraform.tfstate"
    region = "us-east-1"
    endpoint = "http://localhost:4566"
    skip_credentials_validation = true
    skip_metadata_api_check = true
    force_path_style = true
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
