# 🚀 Quick Deployment Guide (Error-Free)

## ⚡ Fast Track (15 minutes)

### Step 1: Prepare Environment Variables (2 min)

Create `.env.production` with these values:

```env
# World Mini App
APP_ID=app_staging_xxxxx  # From developer.worldcoin.org
NEXT_PUBLIC_APP_ID=app_staging_xxxxx

# Incognito Actions (must be created in Dev Portal first!)
NEXT_PUBLIC_ACTION_POST_QUESTION=proofboard_post_question
NEXT_PUBLIC_ACTION_POST_ANSWER=proofboard_post_answer
NEXT_PUBLIC_ACTION_ACCEPT_ANSWER=proofboard_accept_answer
NEXT_PUBLIC_ACTION_LIKE_NOTE=proofboard_like_note
NEXT_PUBLIC_ACTION_VIEW_NOTE=proofboard_view_note

# Database (get from your provider)
DATABASE_URL=postgresql://user:password@host:5432/database

# Auth Secrets
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=https://your-app.vercel.app
HMAC_SECRET_KEY=<generate with: openssl rand -base64 32>
```

---

### Step 2: Setup Database (3 min)

#### Option A: Neon (Recommended - Free tier)

1. Go to [neon.tech](https://neon.tech)
2. Sign up / Login
3. Click "Create Project"
4. Name: `proofboard`
5. Region: Choose closest to your users
6. Copy connection string
7. Paste as `DATABASE_URL` in `.env.production`

#### Option B: Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy "Connection string" (URI mode)
5. Replace `[YOUR-PASSWORD]` with your database password
6. Paste as `DATABASE_URL`

---

### Step 3: Deploy to Vercel (5 min)

#### 3.1 Push to GitHub

```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Ready for deployment"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/proofboard.git
git branch -M main
git push -u origin main
```

#### 3.2 Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repo
4. **Framework Preset**: Next.js (auto-detected)
5. **Root Directory**: `./` (leave as is)
6. **Build Command**: `pnpm build` (or `npm run build`)
7. **Output Directory**: `.next` (auto-detected)

#### 3.3 Add Environment Variables

In Vercel project settings:
1. Go to "Settings" → "Environment Variables"
2. Add ALL variables from `.env.production`
3. Select "Production", "Preview", "Development" for each
4. Click "Save"

#### 3.4 Deploy

1. Click "Deploy"
2. Wait 2-3 minutes
3. Copy deployment URL: `https://proofboard-xxx.vercel.app`

---

### Step 4: Run Database Migrations (2 min)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.production.local

# Run migrations
npx prisma migrate deploy

# Seed database (optional but recommended for demo)
npx prisma db seed
```

**Alternative (if CLI doesn't work)**:
1. Go to Vercel Dashboard → Your Project → Settings → Functions
2. Add a new function: `api/migrate.ts`
3. Trigger it once via browser: `https://your-app.vercel.app/api/migrate`
4. Delete the function after migration completes

---

### Step 5: Configure World Dev Portal (3 min)

1. Go to [developer.worldcoin.org](https://developer.worldcoin.org)
2. Select your app
3. Go to "App Settings"
4. Add Vercel URL to "Allowed Origins":
   ```
   https://proofboard-xxx.vercel.app
   ```
5. Save

#### Create Incognito Actions (if not done yet):

1. Go to "Incognito Actions" tab
2. Create 5 actions:

| Action ID | Name | Max Verifications | Description |
|-----------|------|-------------------|-------------|
| `proofboard_post_question` | Post Question | 10 per day | Post a question on ProofBoard |
| `proofboard_post_answer` | Post Answer | 20 per day | Answer a question on ProofBoard |
| `proofboard_accept_answer` | Accept Answer | 10 per day | Accept an answer as question owner |
| `proofboard_like_note` | Like Note | 50 per day | Like a question or answer |
| `proofboard_view_note` | View Note | 100 per day | Record a view on a note |

3. Save each action
4. **IMPORTANT**: Action IDs must match exactly with your `.env` variables

---

### Step 6: Generate QR Code (2 min)

#### Option 1: World Dev Portal (Recommended)

1. In Dev Portal → Your App → "App Settings"
2. Find "Mini App URL" section
3. Enter: `https://proofboard-xxx.vercel.app`
4. Click "Generate QR Code"
5. Download QR code image
6. Save as `proofboard_qr_code.png`

#### Option 2: Manual QR Code

1. Go to [qr-code-generator.com](https://www.qr-code-generator.com/)
2. Enter URL: `https://proofboard-xxx.vercel.app`
3. Customize (optional): Add logo, colors
4. Download as PNG (high resolution)
5. Save as `proofboard_qr_code.png`

---

## ✅ Verification Checklist

### Test in World App:

1. **Scan QR Code**
   - [ ] QR code opens in World App
   - [ ] Landing page loads correctly
   - [ ] "Why World ID" section visible

2. **Authentication**
   - [ ] "Continue with World" button works
   - [ ] Wallet Auth completes successfully
   - [ ] Redirects to Thoughts page

3. **Browse (Read-Only)**
   - [ ] Categories load
   - [ ] Questions load in each category
   - [ ] Answers display correctly

4. **Post Question**
   - [ ] "Post a Question" button visible
   - [ ] Compose form opens
   - [ ] World ID verification triggers
   - [ ] Question posts successfully
   - [ ] Appears in category board

5. **Post Answer**
   - [ ] "Add your answer" button works
   - [ ] World ID verification triggers
   - [ ] Answer posts successfully
   - [ ] Appears under question

6. **Accept Answer**
   - [ ] "Accept Answer" button visible (owner only)
   - [ ] World ID verification triggers
   - [ ] Answer marked as accepted (green indicator)

7. **My Activity**
   - [ ] "My" tab works
   - [ ] Your questions listed
   - [ ] Your answers listed
   - [ ] Accepted status shown

### Test Demo Mode (Without World App):

1. Open in regular browser: `https://proofboard-xxx.vercel.app`
2. [ ] "Browse Demo" button visible
3. [ ] Can view categories without auth
4. [ ] Can view questions without auth
5. [ ] "Posting requires World App" message shows
6. [ ] Read-only banner displays

---

## 🐛 Common Issues & Fixes

### Issue 1: "Database connection failed"

**Cause**: DATABASE_URL not set or incorrect

**Fix**:
```bash
# Check environment variables in Vercel
vercel env ls

# If missing, add:
vercel env add DATABASE_URL

# Redeploy
vercel --prod
```

### Issue 2: "Action ID not configured"

**Cause**: Incognito Action IDs don't match between code and Dev Portal

**Fix**:
1. Go to Dev Portal → Incognito Actions
2. Copy exact action IDs
3. Update `.env` in Vercel
4. Redeploy

### Issue 3: "Verification failed" or "credential_unavailable"

**Cause**: APP_ID mismatch or user doesn't have World ID

**Fix**:
1. Verify `APP_ID` matches Dev Portal (including `app_staging_` prefix)
2. Ensure user has completed World ID verification in World App
3. Try Device verification as fallback (code already handles this)

### Issue 4: "Prisma Client not generated"

**Cause**: Build didn't generate Prisma client

**Fix**:
```bash
# In Vercel, add build command override:
# Settings → General → Build & Development Settings
# Build Command: pnpm prisma generate && pnpm build
```

### Issue 5: QR code doesn't open in World App

**Cause**: URL not registered in Dev Portal

**Fix**:
1. Dev Portal → App Settings → Allowed Origins
2. Add your Vercel URL
3. Regenerate QR code
4. Test again

---

## 📊 Production Checklist

Before submitting:

### Code Quality
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No console errors in browser
- [ ] All API routes return proper status codes
- [ ] Error messages are user-friendly

### Security
- [ ] All secrets in environment variables (not hardcoded)
- [ ] NEXTAUTH_SECRET is strong (32+ characters)
- [ ] Database connection uses SSL
- [ ] No sensitive data in logs

### Performance
- [ ] Images optimized
- [ ] No unnecessary API calls
- [ ] Database queries indexed
- [ ] Loading states present

### UX
- [ ] Mobile-responsive
- [ ] Safe-area padding (iOS notch)
- [ ] Touch targets >= 44px
- [ ] Clear error messages
- [ ] Loading indicators

### World ID Integration
- [ ] All actions use server-side verification
- [ ] Nullifiers stored correctly
- [ ] Replay protection works
- [ ] Rate limits configured in Dev Portal
- [ ] Signal strategy matches client/server

---

## 📦 Submission Package

Create a folder with:

```
proofboard-submission/
├── source-code.zip           # Full repo (git archive)
├── proofboard_qr_code.png    # QR code image
├── demo_video.mp4            # 60-90s demo
├── slides_link.txt           # Google Slides link
└── deployment_info.txt       # URL, credentials, notes
```

### Generate Source Code ZIP:

```bash
# Clean build artifacts
rm -rf node_modules .next .vercel

# Create archive
git archive -o proofboard-source-code.zip HEAD

# Or manually zip (exclude node_modules, .next, .env)
zip -r proofboard-source-code.zip . -x "node_modules/*" ".next/*" ".env*" ".git/*"
```

### Create `deployment_info.txt`:

```
ProofBoard Deployment Information
==================================

Live URL: https://proofboard-xxx.vercel.app
QR Code: Included as proofboard_qr_code.png

Demo Credentials:
- Open in World App (no separate login needed)
- Wallet Auth via World App
- World ID verification for all actions

Tech Stack:
- Framework: Next.js 15
- Database: PostgreSQL (Neon)
- Hosting: Vercel
- Auth: World App Wallet Auth
- Verification: World ID (Incognito Actions)

World Dev Portal:
- App ID: app_staging_xxxxx
- 5 Incognito Actions configured
- Rate limits: 10-100 per day per action

Notes:
- Demo mode available (browse without World App)
- Database seeded with 30 questions across 6 categories
- All flows tested and working
```

---

## 🎯 Final Steps

1. **Test Everything** (30 min)
   - Go through verification checklist above
   - Test on both iOS and Android if possible
   - Have a friend test the QR code

2. **Record Demo Video** (30 min)
   - Follow `DEMO_VIDEO_SCRIPT.md`
   - Practice 2-3 times
   - Record final version with subtitles

3. **Create Slides** (1 hour)
   - Follow `SLIDES_OUTLINE.md` (next document)
   - Use Google Slides
   - Set to "Anyone with link can view"

4. **Package Submission** (15 min)
   - Create submission folder
   - Double-check all files present
   - Test QR code one more time
   - Verify slides link is public

5. **Submit** 🚀
   - Upload to hackathon platform
   - Confirm all files received
   - Celebrate! 🎉

---

**You're ready to deploy! Good luck! 🚀**
