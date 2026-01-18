import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { CreateAdminUser } from '@/application/use-cases/CreateAdminUser'
import { DrizzleAdminUserRepository } from './repositories/DrizzleAdminUserRepository'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const adminUserRepository = new DrizzleAdminUserRepository()
const createAdminUser = new CreateAdminUser(adminUserRepository)

async function seedAdmin() {
  try {
    const existingAdmin = await adminUserRepository.findByUsername('admin')
    if (existingAdmin) {
      console.log('Admin user already exists. Skipping seed.')
      return
    }

    const result = await createAdminUser.execute({
      username: 'admin',
      email: 'admin@example.com',
      password: 'change-me-immediately',
    })

    console.log('✅ Admin user created successfully!')
    console.log(`   Username: admin`)
    console.log(`   Password: change-me-immediately`)
    console.log(`   Email: ${result.email}`)
    console.log(`   ID: ${result.id}`)
    console.log('')
    console.log('⚠️  IMPORTANT: Please change the password immediately after first login!')
  } catch (error) {
    console.error('Failed to create admin user:', error)
    process.exit(1)
  }
}

seedAdmin()
  .then(() => {
    console.log('Seed completed.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
