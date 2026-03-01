# Deployment Guide - Vercel + Turso

This guide covers deploying the Wedding RSVP application to Vercel with Turso database.

## Architecture

- **Frontend/Backend**: Vercel (Next.js 15 with App Router)
- **Database**: Turso (distributed edge SQLite)
- **Email**: Resend API
- **Cost**: $0/month (free tier)

## Prerequisites

1. GitHub account
2. Vercel account (sign up at https://vercel.com)
3. Turso CLI installed and authenticated
4. Resend API key

## Step 1: Prepare Database

### 1.1 Turso Database (Already Created)

```bash
# Database already created for this project
# Location: your selected Turso region
# URL: libsql://your-database-name-your-org.turso.io
```

### 1.2 Verify Migrations

```bash
# Check tables exist
turso db shell wed-you-like ".tables"

# Should show: admin_users, custom_questions, email_templates, guests, invites,
# meal_options, meal_selections, question_responses, rsvps, sessions,
# table_assignments, tables, wedding_settings
```

### 1.3 Verify Seed Data

```bash
# Check admin user exists
turso db shell wed-you-like "SELECT username FROM admin_users LIMIT 1;"

# Check wedding settings exist
turso db shell wed-you-like "SELECT partner1_name FROM wedding_settings LIMIT 1;"

# Check email template exists
turso db shell wed-you-like "SELECT name FROM email_templates LIMIT 1;"
```

## Step 2: Push to GitHub

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Wedding RSVP application"

# Create GitHub repository at https://github.com/new
# Then push:
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

### 3.1 Connect Repository

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Select the repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: .next
   - **Install Command**: `npm install`

### 3.2 Configure Environment Variables

Add the following environment variables in Vercel dashboard:

```bash
# Database (Turso)
TURSO_DATABASE_URL=libsql://your-db-name-username.turso.io
TURSO_AUTH_TOKEN=eyJhbG...your-token-here

# Email Service
RESEND_API_KEY=re_...your-key-here

# Blob Storage (signed uploads)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...your-token-here

# Application
NODE_ENV=production
BLOB_HERO_IMAGE_ACCESS=private
```

**Important**:
- Keep TURSO_AUTH_TOKEN secret
- Keep RESEND_API_KEY secret
- Keep BLOB_READ_WRITE_TOKEN secret
- Add these in Vercel dashboard: Settings → Environment Variables
- Apply to: Production, Preview, and Development environments

### 3.3 Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Vercel will provide a URL like: `your-app.vercel.app`

## Step 4: Verify Deployment

### 4.1 Check Application

1. Visit your Vercel URL
2. Navigate to `/admin` (should redirect to login)
3. Log in with:
   - **Username**: `admin`
   - **Password**: `change-me-immediately`

### 4.2 Verify Database Connection

1. In admin dashboard, navigate to:
   - Wedding Settings - Should show placeholder data
   - Email Templates - Should show default template
   - Invites - Should be empty
   - Custom Questions - Should be empty

### 4.3 Test Email Configuration

1. Go to Wedding Settings
2. Update all wedding details with real information
3. Go to Email Templates
4. Verify default template is active
5. Create a test invite with your email
6. Click "Send Email"
7. Check email delivery in Resend dashboard: https://resend.com/emails

## Step 5: Post-Deployment Setup

### 5.1 Change Admin Password

1. Log in to `/admin`
2. Navigate to admin user settings (if implemented)
3. Change password from default: `change-me-immediately`

### 5.2 Update Wedding Settings

1. Go to `/admin/wedding-settings`
2. Update all fields with real wedding information:
   - Partner names
   - Wedding date and time
   - Venue details
   - Dress code
   - RSVP deadline

### 5.3 Configure Email Domain (Important!)

If using a default Resend sender, move to your verified domain sender for production.

**For Production:**

1. Go to https://resend.com/domains
2. Add your domain (e.g., `yourdomain.com`)
3. Add DNS records as instructed:
   - TXT record for domain verification
   - MX records for email receiving (optional)
   - DKIM records for authentication
4. Wait for DNS propagation (5-30 minutes)
5. Verify domain is active
6. Update the email service code:
   - File: `src/infrastructure/email/ResendEmailService.ts`
   - Change sender to your verified domain, for example:
   - `from: 'Wedding RSVP <rsvp@yourdomain.com>'`
7. Commit and push changes
8. Merge to `main` to trigger GitHub Actions production release workflow

### 5.4 Customize Email Template

1. Go to `/admin/email-templates`
2. Edit the default template
3. Customize design, wording, and styling
4. Test by sending to yourself

## Step 6: Custom Domain (Optional)

### 6.1 Add Domain to Vercel

1. Go to Vercel dashboard → Settings → Domains
2. Add your custom domain (e.g., `wedding.yourdomain.com`)
3. Add DNS records:
   - **Type**: CNAME
   - **Name**: wedding (or @ for root domain)
   - **Value**: cname.vercel-dns.com
4. Wait for DNS propagation
5. Vercel will auto-issue SSL certificate

## Troubleshooting

### Build Fails

- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Ensure `package.json` has correct scripts
- Check for TypeScript errors

### Database Connection Error

- Verify `TURSO_DATABASE_URL` is correct
- Verify `TURSO_AUTH_TOKEN` is correct and not expired
- Check Turso database is accessible: `turso db shell wed-you-like`
- Verify tables exist: `turso db shell wed-you-like ".tables"`

### Email Not Sending

- Check Resend API key is valid
- Verify email address on Resend free tier:
  - Add recipient to Resend audiences OR
  - Verify a custom domain
- Check Resend dashboard for delivery status: https://resend.com/emails
- See `EMAIL-DEBUG.md` for detailed troubleshooting

### Session/Authentication Issues

- Check browser cookies are enabled
- Verify session secret is configured (if implemented)
- Clear browser cookies and try again

## Environment Variables Reference

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `TURSO_DATABASE_URL` | Turso database URL | `libsql://db-name-user.turso.io` | Yes |
| `TURSO_AUTH_TOKEN` | Turso authentication token | `eyJhbG...` | Yes |
| `RESEND_API_KEY` | Resend API key for emails | `re_...` | Yes |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token | `vercel_blob_rw_...` | Yes (for uploads) |
| `BASE_URL` | Public app base URL for email links | `https://your-domain.com` | Yes |
| `BLOB_HERO_IMAGE_ACCESS` | Hero image Blob access mode (`public` or `private`) | `private` | Optional |
| `NODE_ENV` | Node environment | `production` | Yes |

## Monitoring and Maintenance

### Vercel Dashboard

- Monitor deployments: https://vercel.com/dashboard
- Check build logs
- View runtime logs
- Monitor bandwidth and function invocations

### Turso Dashboard

- Monitor database: https://turso.tech/app
- View database size and usage
- Check query performance
- Monitor connection count

### Resend Dashboard

- Monitor emails: https://resend.com/emails
- Check delivery rates
- View bounce/spam reports
- Monitor API usage

## Scaling

### Free Tier Limits

**Vercel:**
- 100 GB bandwidth/month
- 100 GB-hours compute time/month
- Unlimited deployments
- More than enough for small wedding

**Turso:**
- 9 GB storage
- 1 billion row reads/month
- 25 million row writes/month
- More than enough for small wedding

**Resend:**
- 100 emails/day
- 3,000 emails/month
- Limited to verified domains/addresses on free tier
- Upgrade for $20/month for unlimited verified sending

### When to Upgrade

- Vercel: If you exceed bandwidth (500+ guests checking RSVP daily)
- Turso: If you exceed storage (thousands of guests with extensive data)
- Resend: If sending to unverified email addresses OR need more than 100 emails/day

## Backup Strategy

### Database Backups

Turso provides automatic backups on paid tier. For free tier:

```bash
# Manual backup (recommended weekly)
turso db shell wed-you-like ".dump" > backup-$(date +%Y%m%d).sql

# Store backups securely (Google Drive, Dropbox, etc.)
```

### Code Backups

- GitHub serves as version control and backup
- Keep `.env` file backed up separately (NOT in Git)
- Document any manual configuration changes

## Security Checklist

- [ ] Changed default admin password
- [ ] Environment variables are secret (not in Git)
- [ ] Turso auth token is kept secure
- [ ] Resend API key is kept secure
- [ ] HTTPS is enabled (automatic with Vercel)
- [ ] Custom domain has SSL certificate (automatic with Vercel)
- [ ] Admin routes are password protected
- [ ] Session management is secure

## Support

- Vercel Docs: https://vercel.com/docs
- Turso Docs: https://docs.turso.tech
- Resend Docs: https://resend.com/docs
- Next.js Docs: https://nextjs.org/docs

## Rollback

If deployment fails or has issues:

1. Go to Vercel dashboard → Deployments
2. Find last working deployment
3. Click "⋮" → "Promote to Production"
4. Previous version will be restored immediately

## Updates and Maintenance

### Deploying Updates

1. Make changes locally
2. Test locally: `npm run dev`
3. Build locally: `npm run build`
4. Commit changes: `git commit -m "Description"`
5. Push to GitHub: `git push`
6. GitHub Actions runs `Release Production`:
   - applies Turso migrations
   - builds the app
   - deploys to Vercel production (only if migration/build succeed)

### Before Merging To Main (Required)

Complete this once in GitHub repository settings:

1. Add repository secrets:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `RESEND_API_KEY`
   - `BASE_URL`
   - `BLOB_READ_WRITE_TOKEN`
   - `BLOB_HERO_IMAGE_ACCESS` (optional, defaults to private)
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
2. Ensure `main` is protected with required checks:
   - `Migration Guard`
   - `Release Production` (optional as required check, but recommended)
3. Confirm Vercel Git auto deployments are disabled (now enforced via `vercel.json`).

### Database Migrations

When schema changes:

1. Update `src/infrastructure/database/schema.ts`
2. Generate migration: `npm run db:generate`
3. Test locally with Turso
4. Apply to production:
   ```bash
   turso db shell wed-you-like < src/infrastructure/database/migrations/XXXX_migration.sql
   ```
5. Commit and push migration files
6. Vercel will deploy new code

---

**Cost Summary**: $0/month for up to 100 guests with ~50 email invites/month on Resend free tier
