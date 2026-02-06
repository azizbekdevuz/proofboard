# Critical Bug Fix: Verification Architecture Overhaul

## Problem Summary

**Bug**: World ID verification succeeded but question creation failed, wasting verification attempts and causing users to hit `max_verifications_reached` limits.

**Root Cause**: The verification flow was split into two separate operations:
1. `/api/verify` - verified proof and stored nullifier
2. `/api/questions` - created the question

If step 2 failed (DB error, validation, etc), the nullifier was already consumed in step 1, wasting the user's verification attempt.

## Solution: Atomic Verification + Write

Moved verification into action routes and wrapped everything in a Prisma transaction:

```typescript
// NEW FLOW (atomic)
await db.$transaction(async (tx) => {
  // 1. Store nullifier (anti-replay)
  await tx.actionProof.create({ data: { action, nullifier } });
  
  // 2. Perform the action (create question/answer/accept)
  const result = await tx.question.create({ ... });
  
  return result;
});
```

**Benefits**:
- ✅ No wasted verification attempts
- ✅ Nullifier only stored if action succeeds
- ✅ Replay protection is atomic with the action
- ✅ Clear error codes (409 for replay, 400 for validation, 500 for server errors)

## Changes Made

### 1. `/api/verify` (src/app/api/verify/route.ts)
- **REMOVED**: Nullifier storage logic
- **NOW**: Validation-only endpoint (can be deprecated or kept for future use)
- Returns proof validation result without side effects

### 2. Action Routes (questions/answers/accept)
- **ADDED**: Server-side `verifyCloudProof` call
- **ADDED**: Atomic transaction for nullifier storage + action
- **ADDED**: Detailed logging for debugging
- **ADDED**: Structured error responses with specific codes

Files changed:
- `src/app/api/questions/route.ts`
- `src/app/api/answers/route.ts`
- `src/app/api/accept/route.ts`

### 3. Client Helper (src/components/verify.ts)
- **ADDED**: `getWorldIDProof()` - gets proof from MiniKit without server verification
- **DEPRECATED**: `verifyAndConsume()` - kept for backward compatibility but not used
- Proof is now sent directly to action routes

### 4. Client Components
- **UPDATED**: `ComposeQuestion`, `ComposeAnswer`, `QuestionCard`
- Now call `getWorldIDProof()` instead of `verifyAndConsume()`
- Send `signal` parameter to action routes (must match proof generation)
- Handle 409 replay errors specifically

Files changed:
- `src/components/ComposeQuestion/index.tsx`
- `src/components/ComposeAnswer/index.tsx`
- `src/components/QuestionCard/index.tsx`

### 5. Documentation (README.md)
- **ADDED**: Architecture section explaining atomic verification
- **UPDATED**: Action limit recommendations (10+ per day, not 1 per user)
- **ADDED**: Error code reference

## Verification Steps

### Test 1: Create Question
1. Open app in World App
2. Navigate to a category
3. Click "Post Question"
4. Enter text and submit
5. Complete World ID verification
6. ✅ Question should be created successfully
7. ✅ Console should show: "Verification successful, nullifier: xxx" → "Question created successfully: xxx"

### Test 2: Replay Protection
1. Try to post a question
2. During verification, cancel or let it fail
3. Try again immediately
4. ✅ Should get a fresh proof (not replay error)
5. Complete verification
6. ✅ Question should be created
7. Try to use the same proof again (if possible)
8. ✅ Should get 409 error: "This proof has already been used"

### Test 3: Validation Failure (No Wasted Attempts)
1. Post a question with 301+ characters (if client validation is bypassed)
2. ✅ Should get 400 error: "Question must be 300 characters or less"
3. ✅ Nullifier should NOT be stored
4. ✅ User can try again immediately without hitting limits

### Test 4: Create Answer
1. Open a question
2. Click "Add Answer"
3. Enter text and submit
4. Complete World ID verification
5. ✅ Answer should be created successfully

### Test 5: Accept Answer
1. As question owner, click "Accept" on an answer
2. Complete World ID verification
3. ✅ Answer should be marked as accepted
4. ✅ UI should update to show accepted state

## Error Response Format

All action routes now return structured JSON errors:

```json
{
  "error": "error_code",
  "message": "Human-readable message",
  "missing": { "field": true },  // For 400 bad_request
  "code": "world_id_error_code"  // For verification failures
}
```

**Error Codes**:
- `401 unauthorized` - No session or wallet address
- `400 bad_request` - Missing fields or validation failed
- `400 verification_failed` - World ID verification failed
- `403 forbidden` - Not authorized (e.g., not question owner)
- `404 not_found` - Resource not found
- `409 replay` - Proof already used (anti-replay)
- `500 server_error` - Database or server error

## Action Limits Configuration

**CRITICAL**: Update action limits in World Dev Portal:

| Action | Recommended Limit | Reason |
|--------|------------------|--------|
| `proofboard_post_question` | 10 per day | Users need to ask multiple questions |
| `proofboard_post_answer` | 20 per day | Users should be able to answer many questions |
| `proofboard_accept_answer` | 10 per day | Question owners may accept multiple answers per day |

**Default "1 per user" is too restrictive** for a Q&A system and will cause user frustration.

## Testing Checklist

- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] No linter errors
- [ ] Create question works end-to-end
- [ ] Create answer works end-to-end
- [ ] Accept answer works end-to-end
- [ ] Replay protection works (409 error on duplicate proof)
- [ ] Validation errors don't waste verification attempts
- [ ] Server errors don't waste verification attempts
- [ ] Console logs show clear flow: verify → store nullifier → create resource
- [ ] Error messages are user-friendly and actionable

## Deployment Notes

1. **Update environment variables** in production:
   - Ensure all `NEXT_PUBLIC_ACTION_*` variables are set
   - Ensure `APP_ID` is configured

2. **Update action limits** in World Dev Portal:
   - Navigate to Incognito Actions
   - Set limits to 10+ per day for all actions

3. **Monitor logs** for:
   - Verification failures (check World ID error codes)
   - Replay attempts (should be rare after fix)
   - Transaction failures (should be caught and logged)

4. **Database migration** (if needed):
   - The `ActionProof` table schema is unchanged
   - Existing nullifiers remain valid
   - No data migration needed

## Rollback Plan

If issues occur:
1. Revert to previous commit before this fix
2. Users may experience the original bug (wasted attempts)
3. Increase action limits in Dev Portal as temporary mitigation
4. Investigate and re-apply fix with corrections

## Success Metrics

- ✅ Zero "verification succeeded but action failed" errors
- ✅ Replay errors (409) only occur on actual replay attempts
- ✅ Users can post multiple questions/answers without hitting limits
- ✅ Clear error messages guide users to resolution
- ✅ No wasted verification attempts in logs
