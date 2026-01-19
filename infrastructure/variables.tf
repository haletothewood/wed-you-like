variable "vercel_api_token" {
  description = "Vercel API token (from https://vercel.com/account/tokens)"
  type        = string
  sensitive   = true
}

variable "vercel_project_id" {
  description = "Vercel project ID (from project settings, starts with prj_)"
  type        = string
}

variable "vercel_project_name" {
  description = "Name of the Vercel project (for preview URL generation)"
  type        = string
  default     = "wed-you-like"
}

variable "turso_database_url" {
  description = "Turso database URL (libsql://...)"
  type        = string
}

variable "turso_auth_token" {
  description = "Turso authentication token"
  type        = string
  sensitive   = true
}

variable "resend_api_key" {
  description = "Resend API key for email sending"
  type        = string
  sensitive   = true
}

variable "base_url" {
  description = "Production base URL for email links"
  type        = string
  default     = "https://davidandalex.co.uk"
}
