# PHASE 6: Deployment + Submission Packaging

## Objectives
- Deploy to production (Vercel preferred)
- Generate QR code for World App access
- Create demo video script (60-90s phone recording)
- Prepare presentation slides (6 slides max, 3 mins pitch)
- Package source code ZIP
- Final submission checklist

---

## 1. Deployment (Vercel)

### Prerequisites
- Vercel account
- PostgreSQL database (Vercel Postgres or external)
- Environment variables configured

### Steps

```bash
# 1. Install Vercel CLI (if not installed)
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel --prod

# 4. Set environment variables in Vercel dashboard
# Go to: Project Settings → Environment Variables
```

### Environment Variables for Production
```env
# World Mini App
APP_ID=app_xxxxxxxxxxxxx
NEXT_PUBLIC_APP_ID=app_xxxxxxxxxxxxx
WORLD_API_KEY=your_api_key

# Actions
NEXT_PUBLIC_ACTION_POST_QUESTION=proofboard_post_question
NEXT_PUBLIC_ACTION_POST_ANSWER=proofboard_post_answer
NEXT_PUBLIC_ACTION_ACCEPT_ANSWER=proofboard_accept_answer

# Database (Vercel Postgres)
DATABASE_URL=postgres://...

# Auth
NEXTAUTH_SECRET=generate_with_npx_auth_secret
NEXTAUTH_URL=https://your-app.vercel.app
HMAC_SECRET_KEY=random_secret_string
```

### Post-Deployment
1. Run migrations: `npx prisma migrate deploy`
2. Seed categories: `npx prisma db seed`
3. Test in browser: https://your-app.vercel.app
4. Update World Dev Portal with production URL

---

## 2. QR Code Generation

### In World Dev Portal
1. Go to developer.worldcoin.org
2. Navigate to Your App → Configuration
3. Add production URL: `https://your-app.vercel.app`
4. Generate QR code or use deep link

### Deep Link Format
```
https://worldcoin.org/mini-app?app_id=app_xxxxx&path=/
```

### QR Code Tools (if manual)
- QR Code Generator: https://www.qr-code-generator.com/
- Input: Your deep link
- Size: 1000x1000px minimum
- Format: PNG or SVG

---

## 3. Demo Video Script (60-90 seconds)

### Equipment
- iPhone or Android phone
- Screen recording enabled
- Good lighting
- Stable hand/tripod

### Script

**[0-10s] Introduction**
- "Hi, I'm [Name] and this is ProofBoard"
- "A human-only Q&A platform powered by World ID"
- Show landing page

**[10-20s] Authentication**
- "First, I authenticate with World App"
- Tap "Continue with World"
- Show World ID verification
- "This ensures I'm a real, unique human"

**[20-35s] Post Question**
- "Let's post a question in the Tech category"
- Navigate to Tech category
- Tap "Post a Question"
- Type: "What's the best way to learn Web3?"
- Tap "Post Question"
- Show World ID verification modal
- "Every action is verified to prevent bots"
- Question appears on board

**[35-50s] Post Answer**
- "Now let's answer someone else's question"
- Tap on a question
- Tap "Add Answer"
- Type: "Start with Solidity tutorials and build projects"
- Tap "Post Answer"
- Show verification
- Answer appears

**[50-65s] Accept Answer**
- "As the question owner, I can accept the best answer"
- Tap "Accept" on an answer
- Show verification
- Answer highlighted in green

**[65-75s] My Activity**
- "All my activity is tracked here"
- Navigate to "My" tab
- Show questions and answers
- "Green badge shows accepted answers"

**[75-90s] Closing**
- "ProofBoard: Where every voice is human, verified, and unique"
- "No bots, no spam, just real conversations"
- Show landing page with benefits
- End

### Recording Tips
- Portrait mode (phone vertical)
- Clear audio (quiet environment)
- Smooth transitions
- No errors or retakes visible
- Show loading states naturally

---

## 4. Presentation Slides (6 slides, 3 mins)

### Slide 1: Title + Problem
**Title:** ProofBoard: Human-Only Q&A
**Content:**
- Problem: Online Q&A platforms plagued by bots, spam, and fake accounts
- 40% of internet traffic is bots (source: Imperva)
- Multi-account abuse ruins fair participation
- Image: Spam/bot illustration

### Slide 2: Solution
**Title:** World ID-Powered Verification
**Content:**
- Every action (post, answer, accept) requires World ID
- Proof of personhood prevents bots
- One human, one voice per action
- Privacy-preserving (no personal data stored)
- Image: World ID logo + verification flow

### Slide 3: How It Works
**Title:** User Flow
**Content:**
1. Authenticate with World App (Wallet Auth)
2. Browse categories & questions
3. Post question → World ID verification
4. Answer questions → World ID verification
5. Accept best answer → World ID verification
- Image: Flow diagram or screenshots

### Slide 4: Anti-Abuse Architecture
**Title:** Technical Implementation
**Content:**
- Server-side proof verification (verifyCloudProof)
- Nullifier storage for replay protection
- Signal-based uniqueness (category:date)
- Rate limiting via World Dev Portal
- Atomic transactions (verify + write)
- Image: Architecture diagram

### Slide 5: Privacy & UX
**Title:** Privacy-First Design
**Content:**
- Minimal data: wallet address only
- No email, no phone, no KYC
- World ID ensures uniqueness without revealing identity
- Mobile-first UI with World App UI Kit
- Clear error messages and loading states
- Image: Privacy icons + UI screenshots

### Slide 6: Impact & Next Steps
**Title:** Why ProofBoard Wins
**Content:**
- ✅ Essential World ID use case (breaks without it)
- ✅ Privacy-by-design (minimal data collection)
- ✅ Robust anti-abuse (replay protection, rate limits)
- ✅ Clear UX (World App guidelines)
- ✅ Technical excellence (atomic transactions, error handling)
- Next: Launch beta, gather feedback, scale
- Image: Metrics or roadmap

### Slide Design Tips
- Use World brand colors (purple, blue)
- High-quality screenshots
- Minimal text (bullet points)
- Large fonts (readable from distance)
- Consistent layout
- World logo on each slide

---

## 5. Source Code ZIP

### What to Include
```
proofboard/
├── src/
├── prisma/
├── public/
├── package.json
├── tsconfig.json
├── next.config.ts
├── README.md (updated with deployment info)
├── .env.example (template for judges)
└── SUBMISSION.md (overview for judges)
```

### What to Exclude
- node_modules/
- .next/
- .env (actual secrets)
- .git/ (optional, but include if judges want history)

### Create ZIP
```bash
# Exclude unnecessary files
zip -r proofboard-submission.zip . \
  -x "node_modules/*" \
  -x ".next/*" \
  -x ".env" \
  -x ".env.local" \
  -x "*.log"
```

### SUBMISSION.md Template
```markdown
# ProofBoard - World Mini App Submission

## Overview
ProofBoard is a human-only Q&A platform where every action is verified with World ID to prevent bots, spam, and multi-account abuse.

## Key Features
- World ID verification for all actions (post, answer, accept)
- Privacy-first design (wallet address only)
- Robust anti-abuse (replay protection, rate limits)
- Mobile-optimized UI with World App UI Kit

## Tech Stack
- Next.js 15 (App Router)
- Prisma + PostgreSQL
- World ID (MiniKit SDK)
- NextAuth.js
- Tailwind CSS + World UI Kit

## Setup Instructions
See README.md for detailed setup.

## Demo
- Live URL: https://proofboard.vercel.app
- QR Code: [included in submission]
- Demo Video: [link or file]

## Judging Criteria Alignment
- **Problem & Human-Only Fit**: Q&A without World ID = bot spam. World ID is essential.
- **Privacy-by-Design**: Only wallet address stored. No email, no phone.
- **Anti-Abuse**: Replay protection, nullifier storage, rate limiting, signal-based uniqueness.
- **UX Clarity**: Clear landing page, helpful error messages, World App UI Kit.
- **Technical Execution**: Atomic transactions, proper error handling, type-safe code.

## Contact
[Your Name]
[Email]
[GitHub]
```

---

## 6. Final Submission Checklist

### Pre-Submission
- [ ] App deployed and accessible via QR in World App
- [ ] All environment variables configured in production
- [ ] Database migrations applied
- [ ] Categories seeded
- [ ] QR code generated and tested
- [ ] Demo video recorded (60-90s)
- [ ] Presentation slides created (6 slides)
- [ ] Source code ZIP prepared
- [ ] README.md updated with deployment info
- [ ] SUBMISSION.md created

### Testing in Production
- [ ] Wallet Auth works
- [ ] Post question works (with World ID)
- [ ] Post answer works (with World ID)
- [ ] Accept answer works (with World ID)
- [ ] Replay protection works (409 errors)
- [ ] My Activity page works
- [ ] Navigation works
- [ ] Error messages are clear
- [ ] Loading states work
- [ ] No console errors

### Submission Materials
- [ ] Live URL submitted
- [ ] QR code submitted
- [ ] Demo video submitted (file or link)
- [ ] Presentation slides submitted (link)
- [ ] Source code ZIP submitted

### Judging Criteria Check
- [ ] Problem clearly stated (bot spam in Q&A)
- [ ] World ID is essential (app breaks without it)
- [ ] Privacy explained (wallet only, no personal data)
- [ ] Anti-abuse demonstrated (replay protection, rate limits)
- [ ] UX is clear (helpful messages, World App guidelines)
- [ ] Technical execution is solid (no bugs, proper error handling)

---

## 7. Deployment Commands Reference

```bash
# Development
npm run dev

# Build
npm run build

# Production (Vercel)
vercel --prod

# Database
npx prisma generate
npx prisma migrate deploy
npx prisma db seed

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

---

## 8. Post-Submission

### If Selected for Presentation
- Practice 3-minute pitch
- Prepare for Q&A
- Have backup demo ready (video)
- Know your metrics (if any)

### If Issues Arise
- Monitor error logs (Vercel dashboard)
- Have rollback plan
- Keep local dev environment ready
- Document any issues and fixes

---

## Success Criteria

- ✅ App is live and accessible
- ✅ QR code works in World App
- ✅ Demo video is clear and under 90s
- ✅ Slides are professional and concise
- ✅ Source code is clean and documented
- ✅ All judging criteria addressed
- ✅ No critical bugs in production

**PHASE 6 COMPLETE = READY TO SUBMIT!**
