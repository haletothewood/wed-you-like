export interface EmailSendRequest {
  to: string
  subject: string
  html: string
}

export interface EmailService {
  sendEmail(request: EmailSendRequest): Promise<void>
}
