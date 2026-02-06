# API Error Response Reference

Complete reference for all error responses from ProofBoard API routes.

## POST /api/questions

### Success (200)
```json
{
  "id": "cmlxxx",
  "text": "What is World ID?",
  "categoryId": "cmlyyy",
  "userId": "user123",
  "createdAt": "2026-02-07T...",
  "user": {
    "username": "alice",
    "wallet": "0x..."
  }
}
```

### 401 Unauthorized - No Session
```json
{
  "error": "unauthorized",
  "message": "Authentication required. Please sign in with World App."
}
```

### 400 Bad Request - Missing Fields
```json
{
  "error": "bad_request",
  "message": "Missing required fields",
  "missing": {
    "categoryId": true,
    "text": false,
    "proof": false
  }
}
```

### 400 Bad Request - Text Too Long
```json
{
  "error": "too_long",
  "message": "Question must be 300 characters or less",
  "length": 350
}
```

### 400 Verification Failed - Invalid Proof
```json
{
  "error": "verification_failed",
  "code": "invalid_proof",
  "message": "World ID verification failed"
}
```

### 400 Invalid Proof - Missing Nullifier
```json
{
  "error": "invalid_proof",
  "message": "Proof missing nullifier hash"
}
```

### 409 Replay - Proof Already Used
```json
{
  "error": "replay",
  "message": "This proof has already been used. Please verify again."
}
```

### 500 Server Error - Action ID Not Configured
```json
{
  "error": "server_error",
  "message": "Action ID not configured"
}
```

### 500 Server Error - Transaction Failed
```json
{
  "error": "server_error",
  "message": "Failed to create question",
  "details": "Database connection timeout"
}
```

---

## POST /api/answers

### Success (200)
```json
{
  "id": "ansxxx",
  "text": "World ID is a privacy-preserving proof of personhood.",
  "questionId": "cmlyyy",
  "userId": "user456",
  "createdAt": "2026-02-07T...",
  "user": {
    "username": "bob",
    "wallet": "0x..."
  }
}
```

### Error Responses
Same as `/api/questions` with these differences:
- Field validation: `questionId` and `text` required (not `categoryId`)
- Error messages say "answer" instead of "question"

---

## POST /api/accept

### Success (200)
```json
{
  "id": "cmlyyy",
  "text": "What is World ID?",
  "acceptedId": "ansxxx",
  "categoryId": "cmlzzz",
  "userId": "user123",
  "createdAt": "2026-02-07T...",
  "user": {
    "username": "alice",
    "wallet": "0x..."
  },
  "answers": [
    {
      "id": "ansxxx",
      "text": "World ID is...",
      "user": { "username": "bob" }
    }
  ]
}
```

### 400 Bad Request - Missing Fields
```json
{
  "error": "bad_request",
  "message": "Missing required fields",
  "missing": {
    "questionId": true,
    "answerId": false,
    "proof": false
  }
}
```

### 403 Forbidden - Not Question Owner
```json
{
  "error": "forbidden",
  "message": "Only the question owner can accept answers"
}
```

### 404 Not Found - Question Doesn't Exist
```json
{
  "error": "not_found",
  "message": "Question not found"
}
```

### Other Errors
Same as `/api/questions`: 401 unauthorized, 409 replay, 500 server_error

---

## Client-Side World ID Errors

These errors come from `getWorldIDProof()` before reaching the server:

### credential_unavailable
```
Error: You need World ID verification to post. Please verify your identity in World App first. Go to World App → Settings → World ID to complete verification.
```

### max_verifications_reached / limit_reached
```
Error: You've reached your limit for this action. Please increase the action limit in World Dev Portal (e.g., 10 per day).
```

### user_cancelled / verification_rejected
```
Error: Verification was cancelled. Please try again.
```

### not_verified / verification_required
```
Error: World ID verification required. Please verify your identity first.
```

### inclusion_proof_pending
```
Error: Your verification is still processing. Please try again in about an hour.
```

### inclusion_proof_failed
```
Error: Verification failed due to a network issue. Please try again.
```

### invalid_network
```
Error: Network configuration mismatch. Please check your app settings.
```

---

## Error Code Summary

| Code | HTTP Status | Meaning | User Action |
|------|-------------|---------|-------------|
| `unauthorized` | 401 | No session | Sign in with World App |
| `bad_request` | 400 | Missing/invalid fields | Check form inputs |
| `too_long` | 400 | Text exceeds 300 chars | Shorten text |
| `verification_failed` | 400 | World ID verification failed | Try again or check World ID status |
| `invalid_proof` | 400 | Proof malformed or missing nullifier | Try verifying again |
| `forbidden` | 403 | Not authorized for action | Check ownership |
| `not_found` | 404 | Resource doesn't exist | Check resource ID |
| `replay` | 409 | Proof already used | Verify again to get new proof |
| `server_error` | 500 | Database or server error | Try again later or contact support |

---

## Testing Error Scenarios

### Test 401 Unauthorized
1. Clear cookies/session
2. Try to post question
3. Should get 401 error

### Test 400 Bad Request
1. Send POST with missing `categoryId`
2. Should get 400 with `missing.categoryId: true`

### Test 400 Too Long
1. Enter 301+ characters
2. Should get 400 with `length: 301`

### Test 409 Replay
1. Post a question successfully
2. Try to reuse the same proof (if possible)
3. Should get 409 replay error

### Test 403 Forbidden
1. Try to accept answer on someone else's question
2. Should get 403 forbidden error

### Test 404 Not Found
1. Try to accept answer with invalid `questionId`
2. Should get 404 not found error

---

## Debugging Tips

### Check Console Logs
Server logs show the full flow:
```
CREATE_QUESTION request: { hasSession: true, wallet: '0x...' }
CREATE_QUESTION body: { hasCategoryId: true, hasText: true, ... }
Verifying proof for question: { action: '...', signal: '...', ... }
Verification successful, nullifier: 0x1234...
Nullifier stored: 0x1234...
Question created successfully: cmlxxx
```

### Common Issues

**"Verification was rejected"**
- Check World ID status in World App
- Ensure user has completed Orb or Device verification
- Check action limits in Dev Portal

**"This proof has already been used"**
- User clicked submit twice (double-click)
- Add client-side button disabling during submission
- This is expected behavior for replay protection

**"Failed to create question"**
- Check database connection
- Check Prisma schema matches database
- Check server logs for detailed error

**"Action ID not configured"**
- Missing `NEXT_PUBLIC_ACTION_POST_QUESTION` in `.env.local`
- Restart dev server after adding env vars
