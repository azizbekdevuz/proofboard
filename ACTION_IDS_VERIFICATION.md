# Action IDs Verification Checklist

## Current Action IDs in Code

Based on README.md, the action IDs should be:

```env
NEXT_PUBLIC_ACTION_POST_QUESTION=proofboard_post_question
NEXT_PUBLIC_ACTION_POST_ANSWER=proofboard_post_answer
NEXT_PUBLIC_ACTION_ACCEPT_ANSWER=proofboard_accept_answer
```

## ⚠️ CRITICAL: Verify These Match World Dev Portal

**You MUST verify these action IDs match EXACTLY what's configured in the World Dev Portal:**

1. Go to [developer.worldcoin.org](https://developer.worldcoin.org)
2. Navigate to your app → Incognito Actions
3. Check the "Action ID" for each action

### Expected Action IDs in Portal:
- ✅ `proofboard_post_question` (for posting questions)
- ✅ `proofboard_post_answer` (for posting answers)
- ✅ `proofboard_accept_answer` (for accepting answers)

### If They Don't Match:

**Option 1: Update .env.local** (if portal uses different IDs)
```env
# Example if portal uses different naming:
NEXT_PUBLIC_ACTION_POST_QUESTION=proof-board-post-question
NEXT_PUBLIC_ACTION_POST_ANSWER=proof-board-post-answer
NEXT_PUBLIC_ACTION_ACCEPT_ANSWER=proof-board-accept-answer
```

**Option 2: Update Portal** (if you want to use the IDs in code)
- Edit each action in the portal
- Change the Action ID to match the code
- Save changes

## Common Naming Variations

The portal might use:
- `proofboard_post_question` (underscore) ✅ Recommended
- `proof-board-post-question` (hyphen with prefix)
- `post_question` (no prefix)
- `proofboard-post-question` (mixed)

**The IDs MUST match EXACTLY** (case-sensitive, including hyphens/underscores).

## How to Check Current .env.local

Run this command to see your current action IDs:
```bash
grep ACTION .env.local
```

If the file doesn't exist, create it:
```bash
cp .env.example .env.local  # If .env.example exists
# OR create manually with the IDs from README
```

## Verification Test

After ensuring IDs match:

1. **Test in World App**:
   - Try to post a question
   - Check browser console for action ID being sent
   - Check server logs for action ID being verified

2. **Expected Console Output**:
   ```
   [q-xxx] Getting World ID proof with action: proofboard_post_question signal: cmlxxx:2026-02-07
   [q-xxx] Got proof - nullifier: 0x1234... signal: cmlxxx:2026-02-07
   ```

3. **Expected Server Log**:
   ```
   [q-xxx] CREATE_QUESTION request: { hasSession: true, wallet: '0x...' }
   [q-xxx] Verifying proof for question: { action: 'proofboard_post_question', signal: 'cmlxxx:2026-02-07', nullifier: '0x1234...' }
   ```

4. **If You See `invalid_proof` Error**:
   - Action ID mismatch between code and portal
   - Check both .env.local and portal
   - Ensure they match EXACTLY

## Action Limits Configuration

While verifying action IDs, also check the limits:

| Action | Recommended Limit | Current Limit |
|--------|------------------|---------------|
| `proofboard_post_question` | 10 per day | ❓ Check portal |
| `proofboard_post_answer` | 20 per day | ❓ Check portal |
| `proofboard_accept_answer` | 10 per day | ❓ Check portal |

**If limits are set to "1 per user"**, users will hit `max_verifications_reached` after the first action. Increase to at least 10 per day.

## Troubleshooting

### Error: `malformed_request`
- Action ID doesn't exist in portal
- Create the action in portal with the exact ID from .env.local

### Error: `invalid_proof`
- Action ID exists but doesn't match
- Signal mismatch (less likely with new signal strategy)
- Check both client and server logs for the action ID being used

### Error: `max_verifications_reached`
- Action limit is too low (likely 1 per user)
- Increase limit in portal to 10+ per day

### Error: `credential_unavailable`
- User doesn't have World ID verification
- App will automatically fall back to Device verification
- If both fail, user needs to verify in World App settings

## Final Checklist

Before testing:
- [ ] .env.local file exists with all NEXT_PUBLIC_ACTION_* variables
- [ ] Action IDs in .env.local match portal EXACTLY
- [ ] Action limits in portal are set to 10+ per day
- [ ] Dev server restarted after .env.local changes
- [ ] Browser cache cleared (or use incognito mode)
- [ ] Testing in World App (not browser simulator)

## After Verification

Once action IDs are confirmed to match, document them here:

```
✅ Verified on: [DATE]
✅ Portal Action IDs:
   - proofboard_post_question
   - proofboard_post_answer  
   - proofboard_accept_answer
✅ .env.local matches portal: YES
✅ Action limits configured: 10+ per day
```
