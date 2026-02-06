# Quick Fix Summary - 409 Replay Prevention

## What Changed (4 Files)

### Client Components (3 files)
1. **ComposeQuestion** - Added single-flight lock + request ID + date signal
2. **ComposeAnswer** - Added single-flight lock + request ID + date signal  
3. **QuestionCard** - Added single-flight lock + request ID for accept

### Server Route (1 file)
4. **api/questions** - Added request ID logging

## Key Features Added

### 1. Single-Flight Lock
```typescript
const isSubmittingRef = useRef(false);

if (isSubmittingRef.current) {
  console.warn('Submit already in progress, ignoring duplicate click');
  return;
}

isSubmittingRef.current = true; // Lock immediately
```

**Result:** Double-clicks are blocked at the source.

### 2. Request ID Tracking
```typescript
const requestId = `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
headers: { 'x-rid': requestId }
```

**Result:** Same request ID appears in client and server logs.

### 3. Date-Based Signals
```typescript
// Post question/answer
const signal = `${categoryId}:${YYYY-MM-DD}`;

// Accept answer
const signal = questionId;
```

**Result:** Multiple actions per day are allowed.

### 4. Proof Logging
```typescript
console.log(`[${requestId}] Got proof - nullifier:`, proof.nullifier_hash, 'signal:', signal);
```

**Result:** Can verify each request uses unique proof.

## Testing Checklist

- [ ] Click submit button 3 times rapidly → only 1 request sent
- [ ] Check console for `[q-xxx]` request ID on both client and server
- [ ] Post 2 questions in same category → both succeed
- [ ] Each request shows different nullifier in logs
- [ ] No 409 errors on first submission

## Action Required

1. **Verify .env.local has these action IDs:**
   ```env
   NEXT_PUBLIC_ACTION_POST_QUESTION=proofboard_post_question
   NEXT_PUBLIC_ACTION_POST_ANSWER=proofboard_post_answer
   NEXT_PUBLIC_ACTION_ACCEPT_ANSWER=proofboard_accept_answer
   ```

2. **Verify World Dev Portal has matching action IDs**
   - Go to developer.worldcoin.org → Your App → Incognito Actions
   - Check action IDs match EXACTLY (case-sensitive)

3. **Restart dev server** after any .env.local changes

4. **Test in World App** (not browser simulator)

## Expected Logs

**Client (success):**
```
[q-xxx] Starting question submission
[q-xxx] Getting World ID proof with action: proofboard_post_question signal: cmlxxx:2026-02-07
[q-xxx] Got proof - nullifier: 0x1234... signal: cmlxxx:2026-02-07
[q-xxx] Question created successfully: cmlyyy
```

**Server (success):**
```
[q-xxx] CREATE_QUESTION request: { hasSession: true, wallet: '0x...' }
[q-xxx] Verifying proof for question: { action: '...', nullifier: '0x1234...' }
[q-xxx] Verification successful, nullifier: 0x1234...
[q-xxx] Nullifier stored: 0x1234...
[q-xxx] Question created successfully: cmlyyy
```

**Client (double-click blocked):**
```
[q-xxx] Starting question submission
Submit already in progress, ignoring duplicate click  ← 2nd click
Submit already in progress, ignoring duplicate click  ← 3rd click
[q-xxx] Got proof - nullifier: 0x1234...
[q-xxx] Question created successfully: cmlyyy
```

## If Still Getting 409

1. Check if same `[q-xxx]` appears twice in server logs
2. Check if same nullifier appears in multiple requests
3. Verify action IDs match between .env.local and portal
4. Clear browser cache and restart dev server
5. Check `ACTION_IDS_VERIFICATION.md` for detailed troubleshooting

## Build Status

✅ TypeScript: PASSED  
✅ Linter: NO ERRORS  
✅ Ready to test

## Documentation

- `ANTI_REPLAY_FIX_COMPLETE.md` - Full implementation details
- `ACTION_IDS_VERIFICATION.md` - Action ID verification checklist
- `BUGFIX_VERIFICATION_ARCHITECTURE.md` - Original architecture fix
- `API_ERROR_REFERENCE.md` - Complete error response catalog
