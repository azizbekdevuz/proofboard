# Quick Start - Signal Migration Fix

## What Changed
ActionProof now uses `@@unique([action, nullifier, signal])` instead of `@@unique([action, nullifier])`.

This allows the same user to perform the same action multiple times with different signals (e.g., different categories or different days).

---

## Commands to Run

```bash
# 1. Regenerate Prisma client (CRITICAL)
npx prisma generate

# 2. Apply migrations (if not already applied)
npx prisma migrate deploy

# 3. Restart dev server
npm run dev

# 4. Restart TypeScript server in your IDE
# VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"
# Cursor: Same as VS Code
```

---

## What to Test

### 1. Post Question
- Category A → Success ✅
- Category A again (same day) → 409 "Already used for this category today" ⚠️
- Category B (same day) → Success ✅

### 2. Post Answer
- Question 1 → Success ✅
- Question 1 again (same day) → 409 "Already used for this question today" ⚠️

### 3. Accept Answer
- First accept → Success ✅
- Try to accept again → 409 "Already accepted" ⚠️

---

## Expected Logs

**Success:**
```
[q-xxx] ActionProof stored: { 
  action: 'proofboard_post_question', 
  nullifier: '0x1234...', 
  signal: 'categoryA:2026-02-07' 
}
```

**Replay (same signal):**
```
[q-xxx] Replay attempt detected: { 
  action: 'proofboard_post_question', 
  nullifier: '0x1234...', 
  signal: 'categoryA:2026-02-07' 
}
```

**Success (different signal):**
```
[q-xxx] ActionProof stored: { 
  action: 'proofboard_post_question', 
  nullifier: '0x1234...', 
  signal: 'categoryB:2026-02-07'  ← Different!
}
```

---

## Troubleshooting

### TypeScript Error: "signal does not exist"
```bash
# Regenerate Prisma client
npx prisma generate

# Restart TypeScript server in IDE
# Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Database Error: "column signal does not exist"
```bash
# Apply migrations
npx prisma migrate deploy
```

### Still Getting Replay on First Attempt
1. Check console - is same request ID appearing twice?
2. Check signal value - does it match between client and server?
3. Check database for 'legacy' signal rows:
   ```sql
   SELECT * FROM "ActionProof" WHERE signal = 'legacy';
   ```
4. If legacy rows exist, delete them:
   ```sql
   DELETE FROM "ActionProof" WHERE signal = 'legacy';
   ```

---

## Files Changed

### Server (3 files)
- `src/app/api/questions/route.ts` - Added signal to ActionProof.create
- `src/app/api/answers/route.ts` - Added signal to ActionProof.create
- `src/app/api/accept/route.ts` - Added signal to ActionProof.create

### Client (3 files)
- `src/components/ComposeQuestion/index.tsx` - Handle replay_or_already_used
- `src/components/ComposeAnswer/index.tsx` - Handle replay_or_already_used
- `src/components/QuestionCard/index.tsx` - Handle replay_or_already_used

### New File
- `src/lib/worldActions.ts` - Centralized action ID constants

---

## Action IDs to Verify

Check `.env.local` has:
```env
NEXT_PUBLIC_ACTION_POST_QUESTION=proofboard_post_question
NEXT_PUBLIC_ACTION_POST_ANSWER=proofboard_post_answer
NEXT_PUBLIC_ACTION_ACCEPT_ANSWER=proofboard_accept_answer
```

Verify these match your World Dev Portal → Incognito Actions EXACTLY.

---

## Build Status

✅ TypeScript: PASSED
✅ Prisma client: REGENERATED
✅ Migrations: APPLIED
✅ Ready to test

See `SIGNAL_MIGRATION_COMPLETE.md` for detailed testing guide.
