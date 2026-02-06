# Anti-Replay Fix Implementation - COMPLETE

## Problem: 409 Replay Errors on Same Nullifier

Users were getting 409 replay errors even on first submission, indicating double-submission or proof reuse.

## Root Causes Identified

1. **No single-flight lock** - Users could double-click submit button
2. **No request tracking** - Server couldn't tell if same request fired twice
3. **Proof might be cached** - React state could reuse proof objects
4. **Signal strategy unclear** - Using categoryId/questionId alone allowed conflicts
5. **Action IDs not verified** - Might not match World Dev Portal

## Solutions Implemented

### 1. Single-Flight Lock (Client-Side)

Added `useRef` lock to prevent multiple simultaneous submissions:

```typescript
const isSubmittingRef = useRef(false);

const handleSubmit = async () => {
  // Single-flight lock check
  if (isSubmittingRef.current) {
    console.warn('Submit already in progress, ignoring duplicate click');
    return;
  }

  // Set lock IMMEDIATELY
  isSubmittingRef.current = true;
  setIsSubmitting(true);
  
  try {
    // ... submission logic
  } finally {
    // Release lock
    isSubmittingRef.current = false;
    setIsSubmitting(false);
  }
};
```

**Files Modified:**
- `src/components/ComposeQuestion/index.tsx`
- `src/components/ComposeAnswer/index.tsx`
- `src/components/QuestionCard/index.tsx`

### 2. Request ID Tracking

Added unique request ID (`x-rid` header) for server-side tracking:

**Client:**
```typescript
const requestId = `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
console.log(`[${requestId}] Starting question submission`);

const res = await fetch('/api/questions', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'x-rid': requestId,
  },
  // ...
});
```

**Server:**
```typescript
const requestId = req.headers.get('x-rid') || 'unknown';
console.log(`[${requestId}] CREATE_QUESTION request:`, { ... });
```

This allows tracking the same request through client and server logs.

### 3. Fresh Proof Generation

Ensured proof is generated inside submit handler (never cached):

```typescript
// Get FRESH proof from MiniKit (never reuse proofs)
const proof = await getWorldIDProof(action, signal);

// Log proof details before sending
console.log(`[${requestId}] Got proof - nullifier:`, proof.nullifier_hash, 'signal:', signal);
```

Proof is generated on-demand and logged immediately before sending to server.

### 4. Improved Signal Strategy

Changed signal to include date for per-day uniqueness:

**Post Question:**
```typescript
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const signal = `${categoryId}:${today}`;
```

**Post Answer:**
```typescript
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const signal = `${questionId}:${today}`;
```

**Accept Answer:**
```typescript
const signal = questionId; // One accept per question
```

This allows:
- Multiple questions per category per day
- Multiple answers per question per day
- One accept per question (permanent)

### 5. Action ID Verification

Created `ACTION_IDS_VERIFICATION.md` with checklist to verify action IDs match World Dev Portal.

**Expected Action IDs:**
- `proofboard_post_question`
- `proofboard_post_answer`
- `proofboard_accept_answer`

**User must verify** these match the portal exactly (case-sensitive).

### 6. Enhanced Logging

Added comprehensive logging at every step:

**Client Console:**
```
[q-1707312345-abc123] Starting question submission
[q-1707312345-abc123] Getting World ID proof with action: proofboard_post_question signal: cmlxxx:2026-02-07
[q-1707312345-abc123] Got proof - nullifier: 0x1234... signal: cmlxxx:2026-02-07
[q-1707312345-abc123] Question created successfully: cmlyyy
```

**Server Console:**
```
[q-1707312345-abc123] CREATE_QUESTION request: { hasSession: true, wallet: '0x...' }
[q-1707312345-abc123] CREATE_QUESTION body: { hasCategoryId: true, hasText: true, ... }
[q-1707312345-abc123] Verifying proof for question: { action: '...', signal: '...', nullifier: '0x1234...' }
[q-1707312345-abc123] Verification successful, nullifier: 0x1234...
[q-1707312345-abc123] Nullifier stored: 0x1234...
[q-1707312345-abc123] Question created successfully: cmlyyy
```

## Files Modified (4 files)

1. **src/components/ComposeQuestion/index.tsx**
   - Added `useRef` for single-flight lock
   - Added request ID generation and logging
   - Changed signal to `${categoryId}:${YYYY-MM-DD}`
   - Added proof nullifier logging before request

2. **src/components/ComposeAnswer/index.tsx**
   - Added `useRef` for single-flight lock
   - Added request ID generation and logging
   - Changed signal to `${questionId}:${YYYY-MM-DD}`
   - Added proof nullifier logging before request

3. **src/components/QuestionCard/index.tsx**
   - Added `useRef` for single-flight lock in accept flow
   - Added request ID generation and logging
   - Signal remains `questionId` (one accept per question)
   - Added proof nullifier logging before request

4. **src/app/api/questions/route.ts**
   - Added request ID extraction from `x-rid` header
   - Added request ID to all console logs
   - Added nullifier to verification log

## Verification Steps

### Test 1: Single-Flight Lock
1. Click "Post Question" button rapidly 3 times
2. ✅ Should see only ONE request in console
3. ✅ Should see "Submit already in progress" warnings for duplicate clicks
4. ✅ Button should be disabled during submission

### Test 2: Request ID Tracking
1. Post a question
2. ✅ Check client console for `[q-xxx]` request ID
3. ✅ Check server logs for same `[q-xxx]` request ID
4. ✅ All logs for that request should have same ID

### Test 3: Fresh Proof Generation
1. Post a question
2. ✅ Check console for "Got proof - nullifier: 0x..." log
3. ✅ Nullifier should be different each time
4. ✅ No "proof already used" errors on first attempt

### Test 4: Signal Strategy
1. Post 2 questions in same category on same day
2. ✅ Both should succeed (signal includes date)
3. ✅ Check logs: signal should be `categoryId:2026-02-07`
4. ✅ Different nullifiers for each question

### Test 5: No Replay on Success
1. Post a question successfully
2. ✅ Check server log: "Question created successfully"
3. ✅ Try to post another question
4. ✅ Should succeed (new proof, new nullifier)

### Test 6: Replay Detection Still Works
1. If you somehow get the same nullifier twice (very unlikely)
2. ✅ Should get 409 error: "This proof has already been used"
3. ✅ Server log should show "Replay attempt detected"

## Expected Console Output (Success)

**Client:**
```
[q-1707312345-abc123] Starting question submission
[q-1707312345-abc123] Getting World ID proof with action: proofboard_post_question signal: cmlxxx:2026-02-07
[q-1707312345-abc123] Got proof - nullifier: 0x1234567890abcdef signal: cmlxxx:2026-02-07
[q-1707312345-abc123] Question created successfully: cmlyyy
```

**Server:**
```
[q-1707312345-abc123] CREATE_QUESTION request: { hasSession: true, wallet: '0x...' }
[q-1707312345-abc123] CREATE_QUESTION body: { hasCategoryId: true, hasText: true, textLength: 25, hasProof: true, hasSignal: true }
[q-1707312345-abc123] Verifying proof for question: { action: 'proofboard_post_question', signal: 'cmlxxx:2026-02-07', hasNullifier: true, nullifier: '0x1234567890abcdef' }
[q-1707312345-abc123] Verification successful, nullifier: 0x1234567890abcdef
[q-1707312345-abc123] Nullifier stored: 0x1234567890abcdef
[q-1707312345-abc123] Question created successfully: cmlyyy
```

## Expected Console Output (Double-Click Prevention)

**Client:**
```
[q-1707312345-abc123] Starting question submission
[q-1707312345-abc123] Getting World ID proof with action: proofboard_post_question signal: cmlxxx:2026-02-07
Submit already in progress, ignoring duplicate click  ← Second click blocked
Submit already in progress, ignoring duplicate click  ← Third click blocked
[q-1707312345-abc123] Got proof - nullifier: 0x1234567890abcdef signal: cmlxxx:2026-02-07
[q-1707312345-abc123] Question created successfully: cmlyyy
```

**Server (only ONE request):**
```
[q-1707312345-abc123] CREATE_QUESTION request: { hasSession: true, wallet: '0x...' }
[q-1707312345-abc123] CREATE_QUESTION body: { ... }
[q-1707312345-abc123] Verifying proof for question: { ... }
[q-1707312345-abc123] Verification successful, nullifier: 0x1234567890abcdef
[q-1707312345-abc123] Nullifier stored: 0x1234567890abcdef
[q-1707312345-abc123] Question created successfully: cmlyyy
```

## Troubleshooting

### Still Getting 409 Replay?

1. **Check if request ID is same:**
   - If same `[q-xxx]` appears twice in server logs → network retry or proxy issue
   - If different `[q-xxx]` → user clicked twice before lock engaged (shouldn't happen)

2. **Check nullifier:**
   - If same nullifier in two requests → proof was cached (shouldn't happen with fresh generation)
   - If different nullifiers → not a replay, something else is wrong

3. **Check signal:**
   - If signal doesn't include date → old code still running
   - Restart dev server and clear browser cache

4. **Check action IDs:**
   - If `invalid_proof` error → action ID mismatch with portal
   - See `ACTION_IDS_VERIFICATION.md`

### Button Not Disabled?

- Check `isSubmitting` state is connected to button `disabled` prop
- Check `isSubmittingRef.current = true` is set BEFORE any async calls

### Request ID Not Showing?

- Check `x-rid` header is being sent in fetch request
- Check server is extracting it: `req.headers.get('x-rid')`
- Restart dev server if changes not applied

## Action Required

1. **Verify Action IDs** (see `ACTION_IDS_VERIFICATION.md`)
   - Check .env.local has correct action IDs
   - Check World Dev Portal has matching action IDs
   - Restart dev server after .env.local changes

2. **Test in World App**
   - Post a question (check logs)
   - Post an answer (check logs)
   - Accept an answer (check logs)
   - Try double-clicking (should be blocked)

3. **Monitor Logs**
   - Look for `[q-xxx]`, `[a-xxx]`, `[acc-xxx]` request IDs
   - Verify only ONE request per click
   - Verify different nullifiers for different requests

## Build Status

✅ TypeScript compilation: PASSED (`npx tsc --noEmit`)
✅ No linter errors
✅ All imports resolved
✅ Single-flight locks implemented
✅ Request ID tracking added
✅ Signal strategy updated
✅ Logging enhanced
✅ Ready for testing

## Success Criteria

- [ ] No 409 replay errors on first submission
- [ ] Double-clicking submit button doesn't send duplicate requests
- [ ] Each request has unique request ID in logs
- [ ] Each proof has unique nullifier
- [ ] Signal includes date for per-day uniqueness
- [ ] Server logs show only ONE request per user action
- [ ] Action IDs verified to match World Dev Portal
