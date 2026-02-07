# ProofBoard - Human-Only Q&A

**ProofBoard** is a World ID-verified Q&A platform where every action is proven human. Post questions, share answers, and accept the best response—all protected from bots and Sybil attacks.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
Create `.env.local`:
```env
# World Mini App (get from developer.worldcoin.org)
APP_ID=app_xxxxxxxxxxxxx
NEXT_PUBLIC_APP_ID=app_xxxxxxxxxxxxx

# Incognito Actions (create in Dev Portal)
NEXT_PUBLIC_ACTION_POST_QUESTION=proofboard_post_question
NEXT_PUBLIC_ACTION_POST_ANSWER=proofboard_post_answer
NEXT_PUBLIC_ACTION_ACCEPT_ANSWER=proofboard_accept_answer
NEXT_PUBLIC_ACTION_LIKE_NOTE=proofboard_like_note
NEXT_PUBLIC_ACTION_VIEW_NOTE=proofboard_view_note

# Database
DATABASE_URL="postgresql://..."  # Production
# DATABASE_URL="file:./dev.db"  # Local dev

# Auth
NEXTAUTH_SECRET=your_secret_here  # Generate: npx auth secret
NEXTAUTH_URL=http://localhost:3000
HMAC_SECRET_KEY=your_random_secret
```

### 3. Setup Database
```bash
pnpm prisma generate
pnpm prisma migrate deploy
pnpm db:seed  # Optional: adds sample data
```

### 4. Run
```bash
# Development
pnpm dev

# Production
pnpm build && pnpm start
```

### 5. Test in World App
```bash
# For local testing
ngrok http 3000
# Add ngrok URL to Dev Portal → App Settings
# Scan QR in World App
```

---

## 🏗️ Architecture

### System Overview
```
┌─────────────────────────────────────────────────────────────┐
│                        World App                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Wallet Auth  │  │ World ID     │  │   MiniKit    │     │
│  │  (Login)     │  │   Verify     │  │     SDK      │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    ProofBoard Frontend                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Next.js 15 App Router + React 19                    │  │
│  │  • Landing Page (Why World ID?)                      │  │
│  │  • Category Browser (Demo Mode)                      │  │
│  │  • Question Board (Sticky Notes)                     │  │
│  │  • My Activity (Questions/Answers)                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ POST /api/   │  │ POST /api/   │  │ POST /api/   │     │
│  │  questions   │  │   answers    │  │   accept     │     │
│  │              │  │              │  │              │     │
│  │ Verify +     │  │ Verify +     │  │ Verify +     │     │
│  │ Create       │  │ Create       │  │ Update       │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Atomic Transaction Layer                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  1. verifyCloudProof (World ID)                        │ │
│  │  2. Store nullifier (ActionProof table)                │ │
│  │  3. Create/Update Note                                 │ │
│  │  → All or nothing (prevents wasted verifications)     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                  Database (PostgreSQL)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   User   │  │ Category │  │   Note   │  │ActionProof│  │
│  │          │  │          │  │          │  │           │   │
│  │ wallet   │  │   name   │  │  type    │  │ nullifier │   │
│  │ username │  │          │  │  text    │  │  signal   │   │
│  └──────────┘  └──────────┘  │ parentId │  │  action   │   │
│                               │ accepted │  └──────────┘   │
│                               └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Patterns

**1. Atomic Verification + Write**
```typescript
// Prevents wasted World ID verification attempts
await db.$transaction(async (tx) => {
  // Step 1: Verify proof
  const verified = await verifyCloudProof(proof, APP_ID, action, signal);
  
  // Step 2: Store nullifier (anti-replay)
  await tx.actionProof.create({
    data: { action, nullifier, signal }
  });
  
  // Step 3: Create note
  await tx.note.create({ data: { ... } });
  
  // If ANY step fails, ALL steps rollback
});
```

**2. Signal Strategy (Scoped Uniqueness)**
```typescript
// Post Question: One per category per day
signal = `${categoryId}:${YYYY-MM-DD}`

// Post Answer: Multiple per question per day
signal = `${questionId}:${YYYY-MM-DD}`

// Accept Answer: One per question (permanent)
signal = `${questionId}`
```

**3. Asymmetric Verification (Like Toggle)**
```typescript
// Like: Requires World ID (first time only)
// Unlike: No verification (reduces friction)
// Result: Human-only likes, smooth UX
```

---

## 🔐 Security Features

| Feature | Implementation | Purpose |
|---------|----------------|---------|
| **Server-Side Verification** | `verifyCloudProof` in all POST routes | Prevents client-side proof forgery |
| **Replay Protection** | `ActionProof` table with unique constraint | Prevents proof reuse |
| **Atomic Transactions** | Prisma `$transaction` | No wasted verifications |
| **Rate Limiting** | World Dev Portal per-action limits | Prevents spam even from verified humans |
| **Soft Delete** | `deletedAt` timestamp | Maintains data integrity |
| **Session-Based Auth** | NextAuth + Wallet Auth | Secure wallet authentication |

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Prisma ORM)
- **Auth**: NextAuth.js + World App Wallet Auth
- **Verification**: World ID (MiniKit SDK)
- **UI**: Tailwind CSS + World Mini App UI Kit
- **Deployment**: Vercel

---

## 📦 Project Structure

```
proofboard/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── questions/    # POST question (verify)
│   │   │   ├── answers/      # POST answer (verify)
│   │   │   ├── accept/       # POST accept (verify)
│   │   │   └── notes/[id]/   # Like/view/CRUD
│   │   ├── (protected)/      # Auth-required pages
│   │   │   └── home/
│   │   │       ├── thoughts/ # Category list
│   │   │       └── my/       # User activity
│   │   └── page.tsx          # Landing (Why World ID)
│   ├── components/
│   │   ├── QuestionCard/     # Note display
│   │   ├── ComposeQuestion/  # Post form
│   │   ├── CategoryBoard/    # Board view
│   │   └── verify.ts         # World ID helper
│   ├── lib/
│   │   ├── worldActions.ts   # Action IDs
│   │   └── db.ts             # Prisma client
│   └── auth/                 # Wallet auth
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Sample data
└── package.json
```

---

## 🎯 World ID Actions

Configure these in [developer.worldcoin.org](https://developer.worldcoin.org):

| Action ID | Rate Limit | Signal | Purpose |
|-----------|------------|--------|---------|
| `proofboard_post_question` | 10/day | `categoryId:date` | Post question |
| `proofboard_post_answer` | 20/day | `questionId:date` | Post answer |
| `proofboard_accept_answer` | 10/day | `questionId` | Accept answer |
| `proofboard_like_note` | 50/day | `noteId` | Like toggle |
| `proofboard_view_note` | 100/day | `noteId:date` | View tracking |

---

## 🚢 Deployment (Vercel)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/proofboard.git
git push -u origin main
```

### 2. Import to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repo
4. Add environment variables (same as `.env.local`)
5. Deploy

### 3. Configure Database
```bash
# After first deploy, run migrations
vercel env pull .env.production
npx prisma migrate deploy
npx prisma db seed
```

### 4. Update World Dev Portal
- Add Vercel URL to "App Settings"
- Generate QR code for submission

---

## 📝 API Reference

### Core Actions (Require World ID)
- `POST /api/questions` - Create question
- `POST /api/answers` - Create answer
- `POST /api/accept` - Accept answer
- `POST /api/notes/:id/like` - Toggle like
- `POST /api/notes/:id/view` - Record view

### Public Endpoints
- `GET /api/categories` - List categories
- `GET /api/questions?categoryId=x` - Get questions
- `GET /api/my/questions` - User's questions
- `GET /api/my/answers` - User's answers

---

## 🙏 Credits

Built for **World Build Korea 2026** hackathon.

- [World Foundation](https://world.org) - World ID & MiniKit
- [Worldcoin Docs](https://docs.world.org) - Mini App guides
- [Next.js](https://nextjs.org) - Framework
- [Prisma](https://prisma.io) - ORM
