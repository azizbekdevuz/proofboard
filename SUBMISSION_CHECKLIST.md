# ✅ Submission Checklist - World Build Korea 2026

## 📦 Required Files

### 1. Source Code ZIP ✅
- [ ] Run: `git archive -o proofboard-source-code.zip HEAD`
- [ ] Or manually zip (exclude `node_modules`, `.next`, `.env`)
- [ ] Verify ZIP opens correctly
- [ ] Size: < 50MB (should be ~5-10MB without dependencies)
- [ ] File name: `proofboard-source-code.zip`

### 2. Demo Video (60-90 seconds) 🎬
- [ ] Recorded on iPhone or Android device
- [ ] Shows actual mini app running in World App
- [ ] Duration: 60-90 seconds
- [ ] Resolution: 1080p minimum
- [ ] Format: MP4 (H.264)
- [ ] Includes subtitles (Korean or English)
- [ ] Shows all key features:
  - [ ] Landing page (Why World ID)
  - [ ] Wallet Auth
  - [ ] Browse categories
  - [ ] Post question (World ID verify)
  - [ ] Answer question (World ID verify)
  - [ ] My Activity
- [ ] File name: `proofboard_demo_video.mp4`
- [ ] Uploaded to: Google Drive / YouTube (unlisted)
- [ ] Link tested in incognito mode

### 3. Presentation Slides 📊
- [ ] Created in Google Slides
- [ ] 6 slides total
- [ ] Covers:
  - [ ] Title + Hook
  - [ ] Problem (Sybil attacks)
  - [ ] Solution (World ID)
  - [ ] Technical implementation
  - [ ] Demo + Features
  - [ ] Why we win
- [ ] Includes QR code on final slide
- [ ] Set to "Anyone with link can view"
- [ ] Link tested in incognito mode
- [ ] Backup PDF exported
- [ ] Presentation time: 3-4 minutes

### 4. Mini App QR Code 📱
- [ ] Generated from World Dev Portal OR qr-code-generator.com
- [ ] URL: Your Vercel deployment
- [ ] Format: PNG (high resolution)
- [ ] Size: At least 500x500px
- [ ] Tested: Scans and opens in World App
- [ ] File name: `proofboard_qr_code.png`

---

## 🔧 Technical Verification

### Deployment
- [ ] Deployed to Vercel (or similar)
- [ ] Live URL: `https://proofboard-xxx.vercel.app`
- [ ] SSL certificate valid (https)
- [ ] No console errors in browser
- [ ] Mobile-responsive

### Database
- [ ] PostgreSQL database setup (Neon/Supabase)
- [ ] Migrations run successfully
- [ ] Database seeded with sample data
- [ ] 6 categories created
- [ ] 30 questions + answers present

### World ID Integration
- [ ] App registered in developer.worldcoin.org
- [ ] 5 Incognito Actions created:
  - [ ] `proofboard_post_question` (10/day)
  - [ ] `proofboard_post_answer` (20/day)
  - [ ] `proofboard_accept_answer` (10/day)
  - [ ] `proofboard_like_note` (50/day)
  - [ ] `proofboard_view_note` (100/day)
- [ ] Vercel URL added to "Allowed Origins"
- [ ] APP_ID matches between code and Dev Portal

### Environment Variables
- [ ] All required env vars set in Vercel:
  - [ ] `APP_ID`
  - [ ] `NEXT_PUBLIC_APP_ID`
  - [ ] `NEXT_PUBLIC_ACTION_POST_QUESTION`
  - [ ] `NEXT_PUBLIC_ACTION_POST_ANSWER`
  - [ ] `NEXT_PUBLIC_ACTION_ACCEPT_ANSWER`
  - [ ] `NEXT_PUBLIC_ACTION_LIKE_NOTE`
  - [ ] `NEXT_PUBLIC_ACTION_VIEW_NOTE`
  - [ ] `DATABASE_URL`
  - [ ] `NEXTAUTH_SECRET`
  - [ ] `NEXTAUTH_URL`
  - [ ] `HMAC_SECRET_KEY`

---

## 🧪 Functional Testing

### In World App (iOS or Android):
- [ ] Scan QR code → App opens
- [ ] Landing page loads correctly
- [ ] "Continue with World" button works
- [ ] Wallet Auth completes successfully
- [ ] Redirects to Thoughts page
- [ ] Categories load (6 categories visible)
- [ ] Tap category → Questions load
- [ ] Tap "Post a Question" → Compose form opens
- [ ] Write question → Tap "Post Question"
- [ ] World ID verification triggers
- [ ] Verification completes (Orb or Device)
- [ ] Question posted successfully
- [ ] Question appears in category board
- [ ] Tap question → Answers visible
- [ ] Tap "Add your answer" → Compose form opens
- [ ] Write answer → Tap "Post Answer"
- [ ] World ID verification triggers
- [ ] Answer posted successfully
- [ ] Answer appears under question
- [ ] Tap "My" tab → My Activity loads
- [ ] Your questions listed
- [ ] Your answers listed
- [ ] Navigation works (Home/My tabs)

### Demo Mode (Without World App):
- [ ] Open in regular browser
- [ ] "Browse Demo" button visible
- [ ] Can view categories without auth
- [ ] Can view questions without auth
- [ ] "Posting requires World App" message shows
- [ ] Read-only banner displays
- [ ] No errors in console

---

## 📄 Documentation

### README.md
- [ ] Quick start instructions
- [ ] Architecture diagram
- [ ] Tech stack listed
- [ ] Deployment guide
- [ ] API reference
- [ ] Clear and concise (not too long)

### Code Quality
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No linter errors
- [ ] Code formatted consistently
- [ ] Comments on complex logic
- [ ] No hardcoded secrets
- [ ] No console.log in production code (or minimal)

---

## 🎯 Judging Criteria Self-Check

### 1. Problem & Human-Only Fit (25%)
- [ ] Problem clearly explained (Sybil attacks)
- [ ] World ID necessity demonstrated (before/after)
- [ ] Use case is compelling
- [ ] App breaks without World ID

**Score Estimate**: ___/25

### 2. Privacy-by-Design (20%)
- [ ] Minimal data collection (wallet only)
- [ ] No PII stored
- [ ] Privacy explained to users
- [ ] Transparent about data usage

**Score Estimate**: ___/20

### 3. Anti-Abuse (20%)
- [ ] Server-side verification
- [ ] Replay protection (nullifier storage)
- [ ] Rate limiting configured
- [ ] Atomic transactions
- [ ] Signal strategy implemented

**Score Estimate**: ___/20

### 4. UX Clarity (20%)
- [ ] Clear landing page
- [ ] Onboarding present
- [ ] Demo mode available
- [ ] Professional UI
- [ ] Mobile-optimized
- [ ] Error messages helpful

**Score Estimate**: ___/20

### 5. Technical Execution (15%)
- [ ] Code quality high
- [ ] Deployed and working
- [ ] No bugs or crashes
- [ ] Follows best practices
- [ ] TypeScript type-safe

**Score Estimate**: ___/15

**Total Estimated Score**: ___/100

---

## 📤 Submission Package

Create a folder: `proofboard-submission/`

```
proofboard-submission/
├── proofboard-source-code.zip
├── proofboard_demo_video.mp4
├── proofboard_qr_code.png
├── slides_link.txt
└── deployment_info.txt
```

### slides_link.txt
```
ProofBoard Presentation Slides

Google Slides Link:
https://docs.google.com/presentation/d/YOUR_SLIDE_ID/edit?usp=sharing

(Link is set to "Anyone with link can view")

Backup PDF: proofboard_slides.pdf (if required)
```

### deployment_info.txt
```
ProofBoard - Deployment Information
====================================

Live URL: https://proofboard-xxx.vercel.app

QR Code: proofboard_qr_code.png (included)

Demo Video: proofboard_demo_video.mp4 (included)
OR
Demo Video Link: https://drive.google.com/file/d/YOUR_FILE_ID/view

Presentation Slides: See slides_link.txt

Tech Stack:
- Framework: Next.js 15
- Database: PostgreSQL (Neon)
- Hosting: Vercel
- Auth: World App Wallet Auth
- Verification: World ID (5 Incognito Actions)

World Dev Portal:
- App ID: app_staging_xxxxx
- All 5 Incognito Actions configured
- Rate limits: 10-100 per day per action

Testing Instructions:
1. Scan QR code in World App
2. Authenticate with Wallet Auth
3. Browse categories
4. Post question (World ID verify)
5. Answer question (World ID verify)
6. Check My Activity

Demo Mode (No World App):
- Open URL in regular browser
- Click "Browse Demo"
- View categories and questions (read-only)

Contact:
- Name: [Your Name]
- Email: [Your Email]
- GitHub: [Your GitHub]
```

---

## ⏰ Final Timeline

### Day Before Submission:
- [ ] Complete all development
- [ ] Deploy to production
- [ ] Run full test suite
- [ ] Seed database with demo data
- [ ] Test QR code in World App

### Submission Day (Morning):
- [ ] Record demo video
- [ ] Add subtitles to video
- [ ] Create presentation slides
- [ ] Practice presentation (3-4 min)
- [ ] Generate QR code
- [ ] Test QR code one more time

### Submission Day (Afternoon):
- [ ] Create source code ZIP
- [ ] Create submission folder
- [ ] Double-check all files
- [ ] Test all links (slides, video)
- [ ] Upload to submission platform
- [ ] Confirm submission received

### After Submission:
- [ ] Keep app running (don't change anything)
- [ ] Monitor for errors
- [ ] Be ready for questions from judges
- [ ] Prepare for live demo if requested

---

## 🚨 Common Mistakes to Avoid

- ❌ Submitting with broken QR code
- ❌ Google Slides link not public
- ❌ Demo video too long (>90s) or too short (<60s)
- ❌ Source code includes `node_modules` (huge file)
- ❌ App crashes during judge testing
- ❌ Missing environment variables in deployment
- ❌ World ID actions not configured correctly
- ❌ Presentation over time limit (>4 min)
- ❌ No demo mode (judges can't test without World App)
- ❌ Amateur UI (gradients, corner folds, emoji)

---

## ✅ Final Checks (30 min before submission)

1. **QR Code Test** (5 min)
   - Scan QR in World App
   - Complete full user flow
   - Post question + answer
   - Verify everything works

2. **Links Test** (5 min)
   - Open slides link in incognito
   - Open video link in incognito
   - Verify both are accessible

3. **Files Test** (5 min)
   - Extract source code ZIP
   - Verify it contains all files
   - Check file sizes reasonable

4. **Documentation Test** (5 min)
   - Read deployment_info.txt
   - Verify all information accurate
   - Check for typos

5. **Presentation Test** (10 min)
   - Practice presentation one more time
   - Time yourself (3-4 min)
   - Ensure smooth flow

---

## 🎉 You're Ready!

- [ ] All files prepared
- [ ] All tests passed
- [ ] Submission package complete
- [ ] Presentation practiced
- [ ] Confident and ready

**Good luck! You've got this! 🚀**

---

## 📞 Emergency Contacts (If Issues Arise)

**Vercel Issues**:
- Docs: https://vercel.com/docs
- Support: https://vercel.com/support

**World ID Issues**:
- Docs: https://docs.world.org
- Discord: https://discord.gg/worldcoin

**Database Issues**:
- Neon: https://neon.tech/docs
- Supabase: https://supabase.com/docs

**General Next.js**:
- Docs: https://nextjs.org/docs
- Discord: https://nextjs.org/discord

---

**Submission Deadline**: [Add your deadline here]

**Current Status**: Ready to submit! ✅
