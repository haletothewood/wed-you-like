import { z } from 'zod'

export const emailSchema = z.string().email('Invalid email format').min(1, 'Email is required')

const guestSchema = z.object({
  name: z.string().min(1, 'Guest name is required'),
  email: z.string(),
})

export const createIndividualInviteSchema = z.object({
  type: z.literal('individual'),
  guestName: z.string().min(1, 'Guest name is required'),
  email: emailSchema,
  plusOneAllowed: z.boolean().default(false),
})

const baseGroupInviteSchema = z.object({
  type: z.literal('group'),
  groupName: z.string().min(1, 'Group name is required'),
  adultsCount: z.number().int().min(0, 'Adults count cannot be negative'),
  childrenCount: z.number().int().min(0, 'Children count cannot be negative'),
  guests: z.array(guestSchema).min(1, 'At least one guest is required'),
})

export const createGroupInviteSchema = baseGroupInviteSchema.refine(
  (data) => data.guests.some((g) => g.email && g.email.trim() !== ''),
  { message: 'At least one guest must have an email address' }
)

export const createInviteSchema = z
  .discriminatedUnion('type', [createIndividualInviteSchema, baseGroupInviteSchema])
  .superRefine((data, ctx) => {
    if (data.type === 'group') {
      const hasEmail = data.guests.some((g) => g.email && g.email.trim() !== '')
      if (!hasEmail) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'At least one guest must have an email address',
          path: ['guests'],
        })
      }
    }
  })

const courseTypeSchema = z.enum(['STARTER', 'MAIN', 'DESSERT'])

const mealSelectionSchema = z.object({
  guestId: z.string().min(1),
  mealOptionId: z.string().min(1),
  courseType: courseTypeSchema,
})

const questionResponseSchema = z.object({
  questionId: z.string().min(1),
  responseText: z.string(),
})

export const submitRsvpSchema = z.object({
  isAttending: z.boolean(),
  adultsAttending: z.number().int().min(0, 'Adults attending cannot be negative'),
  childrenAttending: z.number().int().min(0, 'Children attending cannot be negative'),
  dietaryRequirements: z.string().optional(),
  mealSelections: z.array(mealSelectionSchema).optional(),
  questionResponses: z.array(questionResponseSchema).optional(),
})

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').trim(),
  password: z.string().min(1, 'Password is required'),
})

export type CreateIndividualInviteInput = z.infer<typeof createIndividualInviteSchema>
export type CreateGroupInviteInput = z.infer<typeof createGroupInviteSchema>
export type CreateInviteInput = z.infer<typeof createInviteSchema>
export type SubmitRsvpInput = z.infer<typeof submitRsvpSchema>
export type LoginInput = z.infer<typeof loginSchema>
