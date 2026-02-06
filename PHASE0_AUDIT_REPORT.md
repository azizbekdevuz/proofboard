# PHASE 0: REPOSITORY AUDIT REPORT
## ProofBoard - World Mini App Hackathon Project

**Date:** 2026-02-06  
**Status:** Foundation partially complete, needs fixes and completion

---

## ✅ WHAT'S DONE (Working/Implemented)

### 1. **Project Structure & Configuration**
- ✅ Next.js 15 with App Router (`src/app/`)
- ✅ TypeScript configured
- ✅ Prisma installed and configured
- ✅ MiniKit packages installed (`@worldcoin/minikit-js`, `@worldcoin/minikit-react`, `@worldcoin/mini-apps-ui-kit-react`)
- ✅ `src/lib/db.ts` uses singleton pattern correctly
- ✅ `next.config.ts` exists with basic config

### 2. **Database Schema (Prisma)**
- ✅ **User** model: `id`, `wallet` (unique), `username?`, `createdAt`
- ✅ **Category** model: `id`, `name` (unique), `createdAt`
- ✅ **Question** model: `id`, `categoryId`, `userId`, `text`, `createdAt`, `acceptedId?`
- ✅ **Answer** model: `id`, `questionId`, `userId`, `text`, `createdAt`
- ✅ **ActionProof** model: `id`, `action`, `nullifier`, `createdAt` with `@@unique([action, nullifier])`
- ✅ Migration exists (`20260206183151_init/migration.sql`)
- ⚠️ **ISSUE:** Schema uses PostgreSQL but requirements mention SQLite (needs confirmation)

### 3. **MiniKit Integration**
- ✅ `MiniKitProvider` in root layout (`src/app/layout.tsx`)
- ✅ Client providers setup (`src/providers/index.tsx`) with MiniKitProvider
- ✅ Wallet Auth implementation exists (`src/auth/wallet/index.ts`)
- ✅ Nonce route exists (`src/app/api/nonce/route.ts`)

### 4. **API Routes - Core Structure**
- ✅ `/api/verify` route exists with `verifyCloudProof` usage
- ✅ `/api/nonce` route exists
- ✅ `/api/questions` POST route exists (with 300-char limit check)
- ✅ `/api/answers` POST route exists (with 300-char limit check)
- ✅ `/api/accept` POST route exists (with ownership check)

### 5. **Authentication (NextAuth)**
- ✅ NextAuth configured with Credentials provider
- ✅ Wallet Auth flow implemented (`walletAuth` function)
- ✅ Session management with JWT strategy
- ✅ Auth button component exists (`src/components/AuthButton/index.tsx`)

### 6. **Verify Helper**
- ✅ `verifyAndConsume` helper exists (`src/components/verify.ts`)
- ✅ Uses `MiniKit.commandsAsync.verify` with Orb verification level
- ✅ Calls `/api/verify` endpoint

---

## ❌ WHAT'S MISSING (Critical Gaps)

### 1. **Environment Variables**
- ❌ No `.env.example` file found
- ❌ Missing documented env vars:
  - `APP_ID` (used in `/api/verify`)
  - `NEXT_PUBLIC_ACTION_POST_QUESTION`
  - `NEXT_PUBLIC_ACTION_POST_ANSWER`
  - `NEXT_PUBLIC_ACTION_ACCEPT_ANSWER`
  - `DATABASE_URL`
  - `NEXTAUTH_SECRET`
  - `HMAC_SECRET_KEY`
  - `WORLD_API_KEY` (if needed)

### 2. **API Routes - Missing Functionality**
- ❌ `/api/questions` - Missing GET route (to fetch questions by category)
- ❌ `/api/answers` - Missing GET route (to fetch answers by question)
- ❌ `/api/questions` - Missing verify gating (should require verify before POST)
- ❌ `/api/answers` - Missing verify gating (should require verify before POST)
- ❌ `/api/accept` - Missing verify gating (should require verify before POST)
- ❌ `/api/verify` - Uses `APP_ID` but should also check `NEXT_PUBLIC_APP_ID` consistency
- ❌ Missing `/api/categories` route (GET to list categories)

### 3. **UI/Pages - Missing Core Flows**
- ❌ **Home page** (`src/app/page.tsx`) - Only shows AuthButton, needs "Thoughts" and "My" tabs
- ❌ **Home/Thoughts** - Category list page missing
- ❌ **Home/My** - Activity page missing (my questions, my answers)
- ❌ **Category board** (`src/app/(mini)/category/[id]/page.tsx`) - Incomplete:
  - Missing sticky note layout
  - Missing question display
  - Missing answer display around questions
  - Missing random question feed
  - Hardcoded wallet/username in POST
- ❌ Missing question detail page (to view question + answers)
- ❌ Missing compose question UI (proper form with verify flow)
- ❌ Missing compose answer UI (proper form with verify flow)
- ❌ Missing "accept answer" UI/button

### 4. **Verify Integration - Incomplete**
- ⚠️ `verifyAndConsume` exists but not integrated into API routes
- ❌ API routes don't check for verify proof before processing
- ❌ Missing error messages for verify failures
- ❌ Missing "Already used / limit reached" messaging
- ❌ Category page references `process.env.NEXT_PUBLIC_ACTION_POST_QUESTION` but env var not set

### 5. **Navigation & Routing**
- ❌ Navigation component (`src/components/Navigation/index.tsx`) has placeholder tabs
- ❌ Missing routing to Thoughts/My tabs
- ❌ Missing deep linking from "My" page to questions/answers

### 6. **Data Seeding**
- ❌ No category seeding (need initial categories)
- ❌ No seed script

### 7. **Error Handling & UX**
- ❌ Missing error boundaries
- ❌ Missing loading states
- ❌ Missing empty states
- ❌ Missing privacy explanation copy
- ❌ Missing "human-only" explanation copy

### 8. **Database Issues**
- ⚠️ Schema uses PostgreSQL but requirements mention SQLite - needs clarification
- ❌ No database seeding script

### 9. **Documentation**
- ⚠️ README exists but is template-based, needs ProofBoard-specific docs:
  - Setup instructions
  - Environment variables
  - Action IDs setup
  - How to deploy
  - How to test in World App

---

## 🔧 WHAT NEEDS FIXING (Issues Found)

### 1. **API Route Issues**
- 🔧 `/api/verify/route.ts` line 18: Returns `{ verifyRes, status: 400 }` but should return proper NextResponse
- 🔧 `/api/verify/route.ts` line 30: Returns `{ verifyRes, status: 200 }` but should return proper NextResponse
- 🔧 `/api/questions/route.ts`: Missing wallet extraction from session (uses hardcoded wallet from body)
- 🔧 `/api/answers/route.ts`: Missing wallet extraction from session (uses hardcoded wallet from body)
- 🔧 `/api/accept/route.ts`: Missing wallet extraction from session (uses hardcoded wallet from body)
- 🔧 All API routes should extract wallet from NextAuth session, not request body

### 2. **Verify Flow Issues**
- 🔧 `src/components/verify.ts`: Error handling could be better (specific error messages)
- 🔧 Category page uses `verifyAndConsume` but doesn't handle errors properly
- 🔧 Missing signal parameter usage (category ID should be signal for question posting)

### 3. **Auth Flow Issues**
- 🔧 Auth session should store wallet address properly (check `src/auth/index.ts` line 89 - uses `token.address` but should be `token.walletAddress`)

### 4. **Database Schema**
- 🔧 ActionProof model uses `nullifier` but code references `nullifier_hash` - needs consistency

### 5. **Environment Variables**
- 🔧 Inconsistent usage: `/api/verify` uses `APP_ID`, `/api/verify-proof` uses `NEXT_PUBLIC_APP_ID`
- 🔧 Need to standardize on one approach (server-side should use `APP_ID`)

---

## 📋 PHASE 0 VERIFICATION CHECKLIST

Before proceeding to Phase 1, verify:

- [ ] Run `npm install` (or `pnpm install`)
- [ ] Create `.env.local` with all required variables
- [ ] Run `npx prisma generate`
- [ ] Run `npx prisma migrate dev` (or `prisma migrate deploy` for production)
- [ ] Run `npm run build` - should compile without errors
- [ ] Run `npm run dev` - should start without errors
- [ ] Basic page loads at `http://localhost:3000`

---

## 🎯 PRIORITY FIXES FOR PHASE 0

1. **Create `.env.example`** with all required variables
2. **Fix API routes** to extract wallet from session (not body)
3. **Fix verify route** response format
4. **Add GET routes** for questions, answers, categories
5. **Fix auth session** wallet address storage
6. **Standardize environment variable** usage (APP_ID vs NEXT_PUBLIC_APP_ID)
7. **Update README** with ProofBoard-specific instructions

---

## 📝 NOTES

- The project has a solid foundation with Prisma, MiniKit, and NextAuth set up
- Core database models are correct
- Verify helper exists but needs integration
- Main work needed: UI flows, API route completion, verify gating integration
- Database provider (PostgreSQL vs SQLite) needs confirmation

---

**Next Step:** After fixing Phase 0 issues, proceed to Phase 1 (Wallet Auth completion).
