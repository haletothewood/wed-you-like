output "project_url" {
  description = "Vercel project URL"
  value       = "https://${var.vercel_project_name}.vercel.app"
}

output "production_url" {
  description = "Production URL"
  value       = var.base_url
}

output "environment_variables" {
  description = "Environment variables managed by Terraform"
  value = [
    "TURSO_DATABASE_URL",
    "TURSO_AUTH_TOKEN",
    "RESEND_API_KEY",
    "BASE_URL",
    "NODE_ENV"
  ]
}
