import { z } from 'zod'

export const emailSchema = z.string().email('Invalid email format').min(1, 'Email is required')
const phonePattern = /^\+?[0-9\s().-]{8,20}$/
const optionalEmailSchema = z
  .string()
  .trim()
  .refine((value) => value === '' || emailSchema.safeParse(value).success, 'Invalid email format')
const optionalPhoneSchema = z
  .string()
  .trim()
  .refine((value) => value === '' || phonePattern.test(value), 'Invalid phone format')

const guestSchema = z.object({
  id: z.string().min(1, 'Guest ID is required'),
  name: z.string().min(1, 'Guest name is required'),
  email: optionalEmailSchema.default(''),
  phone: optionalPhoneSchema.default(''),
  isChild: z.boolean().default(false),
  parentGuestId: z.string().optional(),
  isInviteLead: z.boolean().optional(),
})

const baseIndividualInviteSchema = z.object({
  type: z.literal('individual'),
  guestName: z.string().min(1, 'Guest name is required'),
  email: optionalEmailSchema.default(''),
  phone: optionalPhoneSchema.default(''),
  plusOneAllowed: z.boolean().default(false),
})

const validateIndividualInviteData = (
  data: z.infer<typeof baseIndividualInviteSchema>,
  ctx: z.RefinementCtx
) => {
  if (!data.email && !data.phone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Either an email address or phone number is required',
      path: ['email'],
    })
  }
}

export const createIndividualInviteSchema = baseIndividualInviteSchema.superRefine(
  validateIndividualInviteData
)

const baseGroupInviteSchema = z.object({
  type: z.literal('group'),
  groupName: z.string().min(1, 'Group name is required'),
  guests: z.array(guestSchema).min(2, 'At least two guests are required for a group invite'),
})

const validateGroupInviteData = (
  data: z.infer<typeof baseGroupInviteSchema>,
  ctx: z.RefinementCtx
) => {
  const hasContactMethod = data.guests.some(
    (g) => (g.email && g.email.trim() !== '') || (g.phone && g.phone.trim() !== '')
  )
  if (!hasContactMethod) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one guest must have an email address or phone number',
      path: ['guests'],
    })
  }

  const adults = data.guests.filter((g) => !g.isChild)
  const children = data.guests.filter((g) => g.isChild)

  if (adults.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one adult guest is required',
      path: ['guests'],
    })
  }

  const ids = new Set(data.guests.map((g) => g.id))
  if (ids.size !== data.guests.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Guest IDs must be unique',
      path: ['guests'],
    })
  }

  for (const guest of data.guests) {
    if (!guest.isChild && guest.parentGuestId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Adult guests cannot have a parent guest',
        path: ['guests'],
      })
    }

    if (guest.isChild && !guest.parentGuestId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Child guest "${guest.name}" must have a parent guest`,
        path: ['guests'],
      })
    }
  }

  const adultsById = new Map(adults.map((g) => [g.id, g]))
  for (const child of children) {
    if (!child.parentGuestId || !ids.has(child.parentGuestId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Child guest "${child.name}" has an invalid parent`,
        path: ['guests'],
      })
      continue
    }

    const parent = adultsById.get(child.parentGuestId)
    if (!parent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Parent for "${child.name}" must be an adult guest`,
        path: ['guests'],
      })
      continue
    }

    if (parent.isInviteLead) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Children cannot be assigned to invite lead "${parent.name}"`,
        path: ['guests'],
      })
    }
  }

  const leadCount = adults.filter((g) => g.isInviteLead).length
  if (leadCount > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Only one invite lead is allowed',
      path: ['guests'],
    })
  }
}

export const createGroupInviteSchema = baseGroupInviteSchema.superRefine(
  validateGroupInviteData
)

export const createInviteSchema = z
  .discriminatedUnion('type', [baseIndividualInviteSchema, baseGroupInviteSchema])
  .superRefine((data, ctx) => {
    if (data.type === 'individual') {
      validateIndividualInviteData(data, ctx)
    } else {
      validateGroupInviteData(data, ctx)
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
  plusOneName: z.string().optional(),
  selectedGuestIds: z.array(z.string().min(1)).optional(),
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
