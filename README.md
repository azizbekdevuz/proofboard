# ProofBoard - World Mini App

**ProofBoard** is a human-only sticky-note Q&A system built for World App. Users post questions as sticky notes on category boards, others attach answers, and the questioner accepts one answer. Every important action is gated by World ID Verify (Incognito Actions) to prevent bots, LLM spam, and multi-account brigading.

## Features

- 🔐 **Human-only gating**: All actions (post question, post answer, accept answer) require World ID verification
- 🛡️ **Anti-abuse**: Replay protection via nullifier storage, rate limiting via World Dev Portal
- 🔒 **Privacy-by-design**: Minimal data collection (wallet + optional username only)
- 📱 **Mobile-first**: Built with World Mini App UI Kit for native-like experience

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm (or npm)
- World App Developer account at [developer.worldcoin.org](https://developer.worldcoin.org)
- PostgreSQL database (or SQLite for local dev)

### Setup Steps

1. **Clone and install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file with the following variables:
   ```env
   # World Mini App Configuration
   APP_ID=app_xxxxxxxxxxxxx                    # From Developer Portal
   NEXT_PUBLIC_APP_ID=app_xxxxxxxxxxxxx        # Same as APP_ID
   WORLD_API_KEY=your_world_api_key_here       # Optional
   
   # Incognito Action IDs (create in Developer Portal -> Incognito Actions)
   NEXT_PUBLIC_ACTION_POST_QUESTION=proofboard_post_question
   NEXT_PUBLIC_ACTION_POST_ANSWER=proofboard_post_answer
   NEXT_PUBLIC_ACTION_ACCEPT_ANSWER=proofboard_accept_answer
   
   # Database
   DATABASE_URL="file:./dev.db"                # SQLite for local dev
   # DATABASE_URL=postgresql://...            # PostgreSQL for production
   
   # NextAuth
   NEXTAUTH_SECRET=$(npx auth secret)         # Generate with: npx auth secret
   NEXTAUTH_URL=http://localhost:3000
   
   # HMAC Secret (generate random string)
   HMAC_SECRET_KEY=your_random_secret_here
   ```

3. **Create Incognito Actions in Developer Portal:**
   - Go to [developer.worldcoin.org](https://developer.worldcoin.org)
   - Navigate to your app → Incognito Actions
   - Create three actions with **INCREASED LIMITS** for demo:
     - `proofboard_post_question` - **Recommended: 10 per day** (not 1 per user!)
     - `proofboard_post_answer` - **Recommended: 20 per day**
     - `proofboard_accept_answer` - **Recommended: 10 per day**
   
   ⚠️ **IMPORTANT**: The default "1 per user" limit is too restrictive for a Q&A system. Users need to post multiple questions/answers. Set limits to at least 10 per day for testing and demos.

4. **Set up database:**
   ```bash
   pnpm prisma generate
   pnpm prisma migrate dev
   ```

5. **Seed initial categories (optional):**
   ```bash
   pnpm db:seed (or pnpm run db:seed)
   ```

6. **Run development server:**
   ```bash
   pnpm dev
   ```

7. **Test in World App:**
   - Use ngrok or similar: `ngrok http 3000`
   - Add your ngrok URL to Developer Portal → App Settings
   - Open World App and scan QR code or use deep link

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `APP_ID` | World App ID from Developer Portal | ✅ |
| `NEXT_PUBLIC_APP_ID` | Same as APP_ID (exposed to client) | ✅ |
| `NEXT_PUBLIC_ACTION_POST_QUESTION` | Incognito Action ID for posting questions | ✅ |
| `NEXT_PUBLIC_ACTION_POST_ANSWER` | Incognito Action ID for posting answers | ✅ |
| `NEXT_PUBLIC_ACTION_ACCEPT_ANSWER` | Incognito Action ID for accepting answers | ✅ |
| `DATABASE_URL` | Database connection string | ✅ |
| `NEXTAUTH_SECRET` | Secret for NextAuth sessions | ✅ |
| `NEXTAUTH_URL` | Base URL of your app | ✅ |
| `HMAC_SECRET_KEY` | Secret for nonce signing | ✅ |
| `WORLD_API_KEY` | World API key (if needed) | ❌ |

## Architecture: Atomic Verification + Write

**Critical Design Decision**: To prevent wasting World ID verification attempts when database writes fail, we use an **atomic transaction pattern**:

1. **Client**: Gets World ID proof from MiniKit (no server verification yet)
2. **Client**: Sends proof + data to action route (e.g., `/api/questions`)
3. **Server**: In a single Prisma transaction:
   - Verifies proof with `verifyCloudProof`
   - Stores nullifier (anti-replay)
   - Performs the write (create question/answer/accept)
4. **Result**: If ANY step fails, the entire transaction rolls back
   - ✅ No wasted verification attempts
   - ✅ No "verified but failed to create" errors
   - ✅ Replay protection is atomic with the action

**Error Codes**:
- `401` - Unauthorized (no session)
- `400` - Bad request (missing fields, validation failed)
- `403` - Forbidden (not question owner, etc)
- `409` - Replay (proof already used)
- `500` - Server error

## API Routes

- `GET /api/categories` - List all categories
- `GET /api/questions?categoryId=xxx` - Get questions for a category
- `POST /api/questions` - Create a question (requires verify)
- `GET /api/answers?questionId=xxx` - Get answers for a question
- `POST /api/answers` - Create an answer (requires verify)
- `POST /api/accept` - Accept an answer (requires verify, owner only)
- `POST /api/verify` - Verify World ID proof (server-side)
- `GET /api/nonce` - Get nonce for wallet auth

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Database

For production, use PostgreSQL:
- Set `DATABASE_URL` to your PostgreSQL connection string
- Run `npx prisma migrate deploy` after deployment

## Architecture

- **Authentication**: Wallet Auth via MiniKit (not Verify as login)
- **Verification**: Verify command with Incognito Actions for gating
- **Anti-replay**: Nullifier hash stored in `ActionProof` table
- **Rate limiting**: Configured in World Dev Portal per action
- **Database**: Prisma ORM with PostgreSQL/SQLite

## Security

- ✅ All proofs verified server-side using `verifyCloudProof`
- ✅ Nullifier hashes stored to prevent replay attacks
- ✅ Wallet extracted from session (not request body)
- ✅ 300-character limit enforced server-side
- ✅ Ownership checks for accept action

## Contributing

This project was built for World Build Korea 2026 hackathon.

## Authentication

This starter kit uses [Minikit's](https://github.com/worldcoin/minikit-js) wallet auth to authenticate users, and [next-auth](https://authjs.dev/getting-started) to manage sessions.

## UI Library

This starter kit uses [Mini Apps UI Kit](https://github.com/worldcoin/mini-apps-ui-kit) to style the app. We recommend using the UI kit to make sure you are compliant with [World App's design system](https://docs.world.org/mini-apps/design/app-guidelines).

## Eruda

[Eruda](https://github.com/liriliri/eruda) is a tool that allows you to inspect the console while building as a mini app. You should disable this in production.

## Contributing

This template was made with help from the amazing [supercorp-ai](https://github.com/supercorp-ai) team.
