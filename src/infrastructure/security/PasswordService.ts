import bcrypt from 'bcryptjs'

export class PasswordService {
  private static readonly SALT_ROUNDS = 10
  private static readonly MIN_PASSWORD_LENGTH = 8

  static async hash(plainPassword: string): Promise<string> {
    this.validatePassword(plainPassword)
    return bcrypt.hash(plainPassword, this.SALT_ROUNDS)
  }

  static async compare(plainPassword: string, passwordHash: string): Promise<boolean> {
    if (!plainPassword || !passwordHash) {
      return false
    }
    return bcrypt.compare(plainPassword, passwordHash)
  }

  private static validatePassword(password: string): void {
    if (!password || password.trim() === '') {
      throw new Error('Password is required')
    }

    if (password.length < this.MIN_PASSWORD_LENGTH) {
      throw new Error(`Password must be at least ${this.MIN_PASSWORD_LENGTH} characters long`)
    }
  }
}
