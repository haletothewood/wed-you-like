import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { relations, sql } from 'drizzle-orm'

export const guests = sqliteTable('guests', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  inviteId: text('invite_id')
    .notNull()
    .references(() => invites.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const invites = sqliteTable('invites', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  groupName: text('group_name'),
  adultsCount: integer('adults_count').notNull().default(1),
  childrenCount: integer('children_count').notNull().default(0),
  plusOneAllowed: integer('plus_one_allowed', { mode: 'boolean' })
    .notNull()
    .default(false),
  sentAt: integer('sent_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const rsvps = sqliteTable('rsvps', {
  id: text('id').primaryKey(),
  inviteId: text('invite_id')
    .notNull()
    .references(() => invites.id, { onDelete: 'cascade' }),
  isAttending: integer('is_attending', { mode: 'boolean' }).notNull(),
  adultsAttending: integer('adults_attending').notNull().default(0),
  childrenAttending: integer('children_attending').notNull().default(0),
  dietaryRequirements: text('dietary_requirements'),
  respondedAt: integer('responded_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const mealOptions = sqliteTable('meal_options', {
  id: text('id').primaryKey(),
  courseType: text('course_type', {
    enum: ['STARTER', 'MAIN', 'DESSERT'],
  }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  isAvailable: integer('is_available', { mode: 'boolean' })
    .notNull()
    .default(true),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const mealSelections = sqliteTable('meal_selections', {
  id: text('id').primaryKey(),
  guestId: text('guest_id')
    .notNull()
    .references(() => guests.id, { onDelete: 'cascade' }),
  mealOptionId: text('meal_option_id')
    .notNull()
    .references(() => mealOptions.id),
  courseType: text('course_type', {
    enum: ['STARTER', 'MAIN', 'DESSERT'],
  }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const customQuestions = sqliteTable('custom_questions', {
  id: text('id').primaryKey(),
  questionText: text('question_text').notNull(),
  questionType: text('question_type', {
    enum: ['TEXT', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE'],
  }).notNull(),
  options: text('options'),
  isRequired: integer('is_required', { mode: 'boolean' })
    .notNull()
    .default(false),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const questionResponses = sqliteTable('question_responses', {
  id: text('id').primaryKey(),
  rsvpId: text('rsvp_id')
    .notNull()
    .references(() => rsvps.id, { onDelete: 'cascade' }),
  questionId: text('question_id')
    .notNull()
    .references(() => customQuestions.id, { onDelete: 'cascade' }),
  responseText: text('response_text').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const tables = sqliteTable('tables', {
  id: text('id').primaryKey(),
  tableNumber: integer('table_number').notNull().unique(),
  capacity: integer('capacity').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const tableAssignments = sqliteTable('table_assignments', {
  id: text('id').primaryKey(),
  tableId: text('table_id')
    .notNull()
    .references(() => tables.id, { onDelete: 'cascade' }),
  guestId: text('guest_id')
    .notNull()
    .references(() => guests.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const emailTemplates = sqliteTable('email_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  templateType: text('template_type', {
    enum: ['invite', 'thank_you'],
  }).notNull(),
  subject: text('subject').notNull(),
  htmlContent: text('html_content').notNull(),
  heroImageUrl: text('hero_image_url'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const adminUsers = sqliteTable('admin_users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  email: text('email').notNull().unique(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  adminUserId: text('admin_user_id')
    .notNull()
    .references(() => adminUsers.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const weddingSettings = sqliteTable('wedding_settings', {
  id: text('id').primaryKey(),
  partner1Name: text('partner1_name').notNull(),
  partner2Name: text('partner2_name').notNull(),
  weddingDate: text('wedding_date').notNull(),
  weddingTime: text('wedding_time').notNull(),
  venueName: text('venue_name').notNull(),
  venueAddress: text('venue_address').notNull(),
  dressCode: text('dress_code'),
  rsvpDeadline: text('rsvp_deadline'),
  registryUrl: text('registry_url'),
  additionalInfo: text('additional_info'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

// Relations
export const invitesRelations = relations(invites, ({ many }) => ({
  guests: many(guests),
}))

export const guestsRelations = relations(guests, ({ one }) => ({
  invite: one(invites, {
    fields: [guests.inviteId],
    references: [invites.id],
  }),
}))
