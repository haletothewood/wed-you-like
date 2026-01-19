terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
  }
}

provider "vercel" {
  api_token = var.vercel_api_token
}

resource "vercel_project_environment_variable" "turso_database_url" {
  project_id = var.vercel_project_id
  key        = "TURSO_DATABASE_URL"
  value      = var.turso_database_url
  target     = ["production", "preview"]
}

resource "vercel_project_environment_variable" "turso_auth_token" {
  project_id = var.vercel_project_id
  key        = "TURSO_AUTH_TOKEN"
  value      = var.turso_auth_token
  target     = ["production", "preview"]
  sensitive  = true
}

resource "vercel_project_environment_variable" "resend_api_key" {
  project_id = var.vercel_project_id
  key        = "RESEND_API_KEY"
  value      = var.resend_api_key
  target     = ["production", "preview"]
  sensitive  = true
}

resource "vercel_project_environment_variable" "base_url" {
  project_id = var.vercel_project_id
  key        = "BASE_URL"
  value      = var.base_url
  target     = ["production"]
}

resource "vercel_project_environment_variable" "base_url_preview" {
  project_id = var.vercel_project_id
  key        = "BASE_URL"
  value      = "https://${var.vercel_project_name}-git-preview.vercel.app"
  target     = ["preview"]
}

resource "vercel_project_environment_variable" "node_env" {
  project_id = var.vercel_project_id
  key        = "NODE_ENV"
  value      = "production"
  target     = ["production", "preview"]
}
