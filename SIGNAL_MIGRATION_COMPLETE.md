# Signal Migration Complete - ActionProof Schema Update

## Summary

Successfully updated the codebase to use the new ActionProof schema with `signal` field and `@@unique([action, nullifier, signal])` constraint.

---

## Changes Made

### 1. Prisma Schema (Already Updated)
**File:** `prisma/schema.prisma`
- ✅ ActionProof model has `signal: String` field
- ✅ Unique constraint: `@@unique([action, nullifier, signal])`

### 2. Migrations (Already Applied)
- ✅ `20260206225624_actionproof_add_signal` - Added signal column with default 'legacy'
- ✅ `20260206225808_actionproofedit` - Removed default, made signal required

### 3. Server Routes Updated (3 files)

#### src/app/api/questions/route.ts
- ✅ Added `signal` validation (required, non-empty string)
- ✅ ActionProof.create now includes `{ action, nullifier, signal }`
- ✅ Replay error returns `replay_or_already_used` with action and signal
- ✅ Error message: "Already used for this category today"

#### src/app/api/answers/route.ts
- ✅ Added `signal` validation (required, non-empty string)
- ✅ ActionProof.create now includes `{ action, nullifier, signal }`
- ✅ Replay error returns `replay_or_already_used` with action and signal
- ✅ Error message: "Already used for this question today"

#### src/app/api/accept/route.ts
- ✅ Added `signal` validation (required, non-empty string)
- ✅ ActionProof.create now includes `{ action, nullifier, signal }`
- ✅ Replay error returns `replay_or_already_used` with action and signal
- ✅ Error message: "Already accepted"

### 4. Client Components Updated (3 files)

#### src/components/ComposeQuestion/index.tsx
- ✅ Handles `replay_or_already_used` error
- ✅ Shows: "Already used for this category today"
- ✅ Handles `missing_signal` error
- ✅ Signal: `${categoryId}:${YYYY-MM-DD}`

#### src/components/ComposeAnswer/index.tsx
- ✅ Handles `replay_or_already_used` error
- ✅ Shows: "Already used for this question today"
- ✅ Handles `missing_signal` error
- ✅ Signal: `${questionId}:${YYYY-MM-DD}`

#### src/components/QuestionCard/index.tsx
- ✅ Handles `replay_or_already_used` error
- ✅ Shows: "Already accepted"
- ✅ Handles `missing_signal` error
- ✅ Signal: `questionId`

### 5. Action ID Constants (New File)
**File:** `src/lib/worldActions.ts`
- ✅ Centralized action ID getters
- ✅ Throws clear errors if env vars not configured
- ✅ Documentation for expected action IDs

---

## Setup Commands

Run these commands in order:

```bash
# 1. Regenerate Prisma client (ALREADY DONE)
npx prisma generate

# 2. Apply migrations (if not already applied)
npx prisma migrate deploy

# 3. Verify database schema
npx prisma db pull

# 4. Start dev server
npm run dev
```

---

## Verification Checklist

### Database Verification
```bash
# Check ActionProof table structure
npx prisma studio
# Navigate to ActionProof model
# Verify columns: id, action, signal, nullifier, createdAt
# Verify unique constraint on (action, nullifier, signal)
```

### Code Verification
- [x] TypeScript compiles: `npx tsc --noEmit` ✅
- [x] Prisma client regenerated with signal field ✅
- [x] All ActionProof.create calls include signal ✅
- [x] All routes validate signal (non-empty string) ✅
- [x] All routes return structured 409 errors ✅
- [x] Client components handle new error codes ✅

---

## Testing in World App

### Test 1: Post Question in Category A (Day 1)
**Steps:**
1. Open World App
2. Navigate to Category A
3. Post a question: "Test question 1"
4. Complete World ID verification

**Expected:**
- ✅ Success: Question created
- ✅ Console log: `ActionProof stored: { action: 'proofboard_post_question', nullifier: '0x...', signal: 'categoryA:2026-02-07' }`

### Test 2: Post Second Question in Category A (Same Day)
**Steps:**
1. Try to post another question in Category A
2. Complete World ID verification

**Expected:**
- ⚠️ 409 Error: "Already used for this category today"
- ✅ Console log: `Replay attempt detected: { action: '...', nullifier: '0x...', signal: 'categoryA:2026-02-07' }`
- ✅ User sees: "Already used for this category today. Please try again tomorrow or choose a different category."

**Note:** This assumes action limit in World Dev Portal is set to allow multiple verifications per day. The replay is detected by our database constraint, not World ID limits.

### Test 3: Post Question in Category B (Same Day)
**Steps:**
1. Navigate to Category B
2. Post a question: "Test question 2"
3. Complete World ID verification

**Expected:**
- ✅ Success: Question created (different signal: `categoryB:2026-02-07`)
- ✅ No replay error (signal is different)

### Test 4: Post Question in Category A (Next Day)
**Steps:**
1. Wait until next day (or change system date for testing)
2. Post a question in Category A
3. Complete World ID verification

**Expected:**
- ✅ Success: Question created (signal: `categoryA:2026-02-08`)
- ✅ No replay error (signal includes date)

### Test 5: Post Answer to Question
**Steps:**
1. Open a question
2. Post an answer: "Test answer 1"
3. Complete World ID verification

**Expected:**
- ✅ Success: Answer created
- ✅ Console log: `ActionProof stored: { action: 'proofboard_post_answer', nullifier: '0x...', signal: 'questionId:2026-02-07' }`

### Test 6: Post Second Answer to Same Question (Same Day)
**Steps:**
1. Try to post another answer to the same question
2. Complete World ID verification

**Expected:**
- ⚠️ 409 Error: "Already used for this question today"
- ✅ User sees: "Already used for this question today. Please try again tomorrow."

### Test 7: Accept Answer
**Steps:**
1. As question owner, click "Accept" on an answer
2. Complete World ID verification

**Expected:**
- ✅ Success: Answer accepted
- ✅ Console log: `ActionProof stored: { action: 'proofboard_accept_answer', nullifier: '0x...', signal: 'questionId' }`

### Test 8: Try to Accept Again
**Steps:**
1. Try to accept the same or different answer for the same question
2. Complete World ID verification

**Expected:**
- ⚠️ 409 Error: "Already accepted"
- ✅ User sees: "Already accepted. This answer has already been accepted for this question."

---

## Expected Console Logs

### Success (Question)
```
[q-xxx] Starting question submission
[q-xxx] Getting World ID proof with action: proofboard_post_question signal: cmlxxx:2026-02-07
[q-xxx] Got proof - nullifier: 0x1234... signal: cmlxxx:2026-02-07
[q-xxx] CREATE_QUESTION request: { hasSession: true, wallet: '0x...' }
[q-xxx] CREATE_QUESTION body: { hasCategoryId: true, hasText: true, hasProof: true, hasSignal: true }
[q-xxx] Verifying proof for question: { action: 'proofboard_post_question', signal: 'cmlxxx:2026-02-07', nullifier: '0x1234...' }
[q-xxx] Verification successful, nullifier: 0x1234...
[q-xxx] ActionProof stored: { action: 'proofboard_post_question', nullifier: '0x1234...', signal: 'cmlxxx:2026-02-07' }
[q-xxx] Question created successfully: cmlyyy
```

### Replay (Same Category, Same Day)
```
[q-xxx] Starting question submission
[q-xxx] Getting World ID proof with action: proofboard_post_question signal: cmlxxx:2026-02-07
[q-xxx] Got proof - nullifier: 0x1234... signal: cmlxxx:2026-02-07
[q-xxx] CREATE_QUESTION request: { hasSession: true, wallet: '0x...' }
[q-xxx] Verifying proof for question: { action: 'proofboard_post_question', signal: 'cmlxxx:2026-02-07', nullifier: '0x1234...' }
[q-xxx] Verification successful, nullifier: 0x1234...
[q-xxx] Replay attempt detected: { action: 'proofboard_post_question', nullifier: '0x1234...', signal: 'cmlxxx:2026-02-07' }
```

### Success (Different Category, Same Day)
```
[q-xxx] ActionProof stored: { action: 'proofboard_post_question', nullifier: '0x1234...', signal: 'cmlyyy:2026-02-07' }
                                                                                           ^^^^^^^ Different signal!
```

---

## Error Response Format

### 409 Replay
```json
{
  "error": "replay_or_already_used",
  "message": "Already used for this category today. Please try again tomorrow or choose a different category.",
  "action": "proofboard_post_question",
  "signal": "cmlxxx:2026-02-07"
}
```

### 400 Missing Signal
```json
{
  "error": "missing_signal",
  "message": "Signal must be a non-empty string"
}
```

### 400 Bad Request
```json
{
  "error": "bad_request",
  "message": "Missing required fields",
  "missing": {
    "signal": true
  }
}
```

---

## Action ID Verification

### Current Action IDs (from env)
- `NEXT_PUBLIC_ACTION_POST_QUESTION=proofboard_post_question`
- `NEXT_PUBLIC_ACTION_POST_ANSWER=proofboard_post_answer`
- `NEXT_PUBLIC_ACTION_ACCEPT_ANSWER=proofboard_accept_answer`

### Verification Steps
1. Check `.env.local` file has these variables
2. Go to [developer.worldcoin.org](https://developer.worldcoin.org)
3. Navigate to Your App → Incognito Actions
4. Verify action IDs match EXACTLY (case-sensitive)
5. If mismatch, update `.env.local` to match portal
6. Restart dev server after changes

### Using Centralized Constants (Optional)
Instead of `process.env.NEXT_PUBLIC_ACTION_POST_QUESTION`, you can now use:

```typescript
import { getActionPostQuestion } from '@/lib/worldActions';

const action = getActionPostQuestion(); // Throws clear error if not configured
```

---

## Troubleshooting

### Error: "signal does not exist in type ActionProofCreateInput"
**Cause:** Prisma client not regenerated after schema change
**Fix:** Run `npx prisma generate` and restart TypeScript server

### Error: "Column 'signal' does not exist"
**Cause:** Migration not applied to database
**Fix:** Run `npx prisma migrate deploy` or `npx prisma migrate dev`

### Error: "Unique constraint failed on ActionProof"
**Cause:** Trying to insert duplicate (action, nullifier, signal)
**Expected:** This is correct behavior - replay protection working!
**Fix:** User should see 409 error with clear message

### Error: "missing_signal"
**Cause:** Client not sending signal in request body
**Fix:** Verify client components send `signal` parameter

### Still Getting Replay on First Attempt
**Possible Causes:**
1. Double-click not prevented (check single-flight lock)
2. Signal mismatch between client and server
3. Old ActionProof rows with 'legacy' signal

**Debug:**
1. Check console logs for request ID - should be same on client and server
2. Check signal value in client and server logs - should match exactly
3. Check database: `SELECT * FROM "ActionProof" WHERE signal = 'legacy'`
4. If legacy rows exist, consider clearing them: `DELETE FROM "ActionProof" WHERE signal = 'legacy'`

---

## Database Cleanup (If Needed)

If you have old ActionProof rows with 'legacy' signal causing issues:

```sql
-- View legacy rows
SELECT * FROM "ActionProof" WHERE signal = 'legacy';

-- Delete legacy rows (CAUTION: This removes replay protection for those proofs)
DELETE FROM "ActionProof" WHERE signal = 'legacy';

-- Or update them with a unique signal
UPDATE "ActionProof" 
SET signal = CONCAT('migrated:', id) 
WHERE signal = 'legacy';
```

---

## Build Status

✅ Prisma client regenerated with signal field
✅ TypeScript compilation: PASSED
✅ All routes include signal in ActionProof.create
✅ All routes validate signal parameter
✅ All clients send signal parameter
✅ All clients handle replay_or_already_used error
✅ Migrations applied
✅ Ready for testing

---

## Success Criteria

- [ ] Post question in category A → Success
- [ ] Post second question in category A same day → 409 replay
- [ ] Post question in category B same day → Success (different signal)
- [ ] Post answer to question → Success
- [ ] Post second answer to same question same day → 409 replay
- [ ] Accept answer → Success
- [ ] Try to accept again → 409 replay
- [ ] All console logs show correct (action, nullifier, signal) triplet
- [ ] No "signal does not exist" TypeScript errors
- [ ] No database errors about missing signal column
