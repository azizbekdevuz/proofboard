# PHASE 3 COMPLETION: Like, View, Edit, Delete Endpoints

## ✅ Status: COMPLETE

All engagement and note management endpoints have been implemented with proper World ID verification, anti-abuse measures, and ownership checks.

---

## New Endpoints Summary

### 1. Like Toggle ✅
**POST `/api/notes/:id/like`**

**Strategy**: Asymmetric verification (verify on like, no verify on unlike)
- **Like** (first time): Requires World ID proof → Creates NoteLike → Increments likeCount
- **Unlike**: No proof needed → Deletes NoteLike → Decrements likeCount

**Rationale**: Unliking reduces abuse, so no verification needed. This prevents users from burning verification attempts when changing their mind.

**Request**:
```json
{
  "proof": { /* World ID proof */ },
  "signal": "noteId"  // Must match the note being liked
}
```

**Response**:
```json
{
  "liked": true,      // or false for unlike
  "likeCount": 5
}
```

**Anti-Abuse**:
- World ID action: `proofboard_like_note`
- Signal: `${noteId}` (one like per human per note)
- ActionProof stored with (action, nullifier, signal)
- Replay returns 409 with `already_liked` error

**Error Codes**:
- `401` - Unauthorized (no session)
- `404` - Note not found or deleted
- `409` - Already liked (replay detected)
- `400` - Verification failed or bad request
- `500` - Server error

---

### 2. View Recording ✅
**POST `/api/notes/:id/view`**

**Strategy**: One view per human per note per day (day bucket)
- **Signal**: `${noteId}:${YYYY-MM-DD}`
- **Day Bucket**: Prevents refresh spam while allowing daily re-views
- **Idempotent**: Returns success if already viewed today (doesn't increment)

**Request**:
```json
{
  "proof": { /* World ID proof */ },
  "signal": "noteId:2026-02-07"  // Must match noteId and be valid date
}
```

**Response**:
```json
{
  "viewed": true,
  "viewCount": 42,
  "message": "Already viewed today"  // Optional, if already viewed
}
```

**Anti-Abuse**:
- World ID action: `proofboard_view_note`
- Signal: `${noteId}:${YYYY-MM-DD}` (one view per human per note per day)
- NoteView table with unique constraint on `[noteId, userId, dayBucket]`
- ActionProof stored with (action, nullifier, signal)

**Error Codes**:
- `401` - Unauthorized (no session)
- `404` - Note not found or deleted
- `400` - Bad signal format or verification failed
- `500` - Server error

---

### 3. Get Single Note ✅
**GET `/api/notes/:id`**

**Purpose**: Fetch a single note with all related data (user, category, parent, children, counts)

**Response**:
```json
{
  "id": "note123",
  "type": "QUESTION",
  "parentId": null,
  "categoryId": "cat1",
  "userId": "user1",
  "text": "Question text",
  "likeCount": 5,
  "viewCount": 42,
  "acceptedAnswerId": "note456",
  "createdAt": "2026-02-07T...",
  "updatedAt": "2026-02-07T...",
  "deletedAt": null,
  "user": { "username": "Alice", "wallet": "0x..." },
  "category": { "id": "cat1", "name": "Tech" },
  "parent": null,  // For answers, contains parent question
  "children": [...],  // For questions, contains answers
  "_count": {
    "children": 3,
    "likes": 5,
    "views": 42
  },
  // Backward compatibility fields
  "acceptedId": "note456",  // For questions
  "answers": [...],  // For questions
  "questionId": "note123"  // For answers
}
```

**Features**:
- Excludes soft-deleted notes (404 if deleted)
- Includes full user, category, parent, children data
- Backward compatible with old API shape
- Includes like and view counts

**Error Codes**:
- `404` - Note not found or deleted

---

### 4. Edit Note ✅
**PATCH `/api/notes/:id`**

**Purpose**: Edit note text (owner only, no World ID needed)

**Authorization**: Wallet auth only (session check + ownership)

**Request**:
```json
{
  "text": "Updated text (max 300 chars)"
}
```

**Response**:
```json
{
  "id": "note123",
  "categoryId": "cat1",
  "userId": "user1",
  "text": "Updated text",
  "createdAt": "2026-02-07T...",
  "updatedAt": "2026-02-07T...",  // Auto-updated
  "user": { ... },
  "category": { ... }
}
```

**Restrictions**:
- Only owner can edit
- Can only edit `text` field (not type, parentId, categoryId)
- Text must be 1-300 characters
- Cannot edit deleted notes

**Error Codes**:
- `401` - Unauthorized (no session)
- `403` - Forbidden (not owner)
- `404` - Note not found or deleted
- `400` - Bad request (missing text, too long)
- `500` - Server error

---

### 5. Soft Delete Note ✅
**DELETE `/api/notes/:id`**

**Purpose**: Soft delete a note (owner only, no World ID needed)

**Authorization**: Wallet auth only (session check + ownership)

**Response**:
```json
{
  "success": true,
  "message": "Note deleted successfully",
  "deletedAt": "2026-02-07T12:34:56.789Z"
}
```

**Behavior**:
- Sets `deletedAt` timestamp (soft delete)
- **If deleting QUESTION with accepted answer**: Clears `acceptedAnswerId`
- **If deleting ANSWER that is accepted**: Clears parent's `acceptedAnswerId`
- Soft-deleted notes are hidden from all queries
- Data is preserved (can implement undelete later)

**Cascade Logic**:
```typescript
// Deleting a question
if (note.type === 'QUESTION' && note.acceptedAnswerId) {
  // Clear acceptedAnswerId before soft delete
  note.acceptedAnswerId = null;
}

// Deleting an answer
if (note.type === 'ANSWER' && parent.acceptedAnswerId === noteId) {
  // Clear parent's acceptedAnswerId
  parent.acceptedAnswerId = null;
}
```

**Error Codes**:
- `401` - Unauthorized (no session)
- `403` - Forbidden (not owner)
- `404` - Note not found
- `410` - Gone (already deleted)
- `500` - Server error

---

## Database Schema (No Changes)

All endpoints use the existing schema from Phase 2:
- ✅ `Note` table with `likeCount`, `viewCount`, `deletedAt`
- ✅ `NoteLike` table with unique constraint `[noteId, userId]`
- ✅ `NoteView` table with unique constraint `[noteId, userId, dayBucket]`
- ✅ `ActionProof` table with unique constraint `[action, nullifier, signal]`

---

## World ID Actions Required

### New Actions (Add to Dev Portal)

1. **proofboard_like_note**
   - **Purpose**: Gate first-time likes on notes
   - **Signal**: `${noteId}`
   - **Recommended Limit**: 50 per day (generous for engagement)
   - **Verification Level**: Device or Orb

2. **proofboard_view_note**
   - **Purpose**: Record real views (anti-spam)
   - **Signal**: `${noteId}:${YYYY-MM-DD}`
   - **Recommended Limit**: 100 per day (users browse many notes)
   - **Verification Level**: Device or Orb

### Environment Variables

Add to `.env.local`:
```env
NEXT_PUBLIC_ACTION_LIKE_NOTE=proofboard_like_note
NEXT_PUBLIC_ACTION_VIEW_NOTE=proofboard_view_note
```

---

## Anti-Abuse Measures

### Like Toggle
- ✅ World ID verification on first like
- ✅ No verification on unlike (reduces abuse)
- ✅ Nullifier stored per note (one like per human per note)
- ✅ Atomic transaction (verify + create like + increment count)
- ✅ Replay protection (409 if already liked)

### View Recording
- ✅ World ID verification required
- ✅ Day bucket prevents refresh spam
- ✅ One view per human per note per day
- ✅ Idempotent (returns success if already viewed)
- ✅ Atomic transaction (verify + create view + increment count)

### Edit/Delete
- ✅ Ownership check (only owner can edit/delete)
- ✅ No World ID needed (wallet auth sufficient)
- ✅ Soft delete preserves data integrity
- ✅ Cascade logic for accepted answers

---

## Atomic Transaction Patterns

### Like (First Time)
```typescript
await db.$transaction(async (tx) => {
  // 1. Store ActionProof (anti-replay)
  await tx.actionProof.create({ data: { action, nullifier, signal } });
  
  // 2. Create like
  await tx.noteLike.create({ data: { noteId, userId } });
  
  // 3. Increment count
  await tx.note.update({
    where: { id: noteId },
    data: { likeCount: { increment: 1 } },
  });
});
```

### Unlike
```typescript
await db.$transaction(async (tx) => {
  // 1. Delete like
  await tx.noteLike.delete({ where: { id: likeId } });
  
  // 2. Decrement count
  await tx.note.update({
    where: { id: noteId },
    data: { likeCount: { decrement: 1 } },
  });
});
```

### View Recording
```typescript
await db.$transaction(async (tx) => {
  // 1. Store ActionProof (anti-replay)
  await tx.actionProof.create({ data: { action, nullifier, signal } });
  
  // 2. Create view record
  await tx.noteView.create({ data: { noteId, userId, dayBucket } });
  
  // 3. Increment count
  await tx.note.update({
    where: { id: noteId },
    data: { viewCount: { increment: 1 } },
  });
});
```

### Soft Delete with Cascade
```typescript
await db.$transaction(async (tx) => {
  // 1. If question with accepted answer, clear it
  if (note.type === 'QUESTION' && note.acceptedAnswerId) {
    await tx.note.update({
      where: { id: noteId },
      data: { deletedAt: now, acceptedAnswerId: null },
    });
  }
  
  // 2. If answer is accepted, clear parent's acceptedAnswerId
  if (note.type === 'ANSWER' && parent.acceptedAnswerId === noteId) {
    await tx.note.update({
      where: { id: parentId },
      data: { acceptedAnswerId: null },
    });
  }
  
  // 3. Soft delete the note
  await tx.note.update({
    where: { id: noteId },
    data: { deletedAt: now },
  });
});
```

---

## Request ID Tracking

All endpoints support `x-rid` header for request tracking:
```typescript
const requestId = req.headers.get('x-rid') || 'unknown';
console.log(`[${requestId}] POST /api/notes/${noteId}/like`);
```

This helps debug issues and track requests across logs.

---

## Error Handling

### Consistent Error Format
```json
{
  "error": "error_code",
  "message": "Human-readable message",
  "details": "Additional context (optional)"
}
```

### New Error Codes

**Like Endpoint**:
- `already_liked` (409) - User already liked this note

**View Endpoint**:
- `bad_request` (400) - Invalid signal format (not noteId:YYYY-MM-DD)

**Edit Endpoint**:
- `too_long` (400) - Text exceeds 300 characters

**Delete Endpoint**:
- `already_deleted` (410) - Note was already deleted

---

## Testing Checklist

### Manual Testing (Required)

#### Like Toggle
- [ ] Like a note (first time) - should require World ID verification
- [ ] Unlike the same note - should work without verification
- [ ] Like again - should require verification again
- [ ] Try to like twice rapidly - should get 409 replay error
- [ ] Check likeCount increments/decrements correctly

#### View Recording
- [ ] View a note (first time today) - should require verification
- [ ] View same note again (same day) - should return success without incrementing
- [ ] Check viewCount increments correctly
- [ ] Try invalid signal format - should get 400 error

#### Edit Note
- [ ] Edit own note - should work
- [ ] Try to edit someone else's note - should get 403 forbidden
- [ ] Try to edit with text > 300 chars - should get 400 too_long
- [ ] Check updatedAt timestamp updates

#### Delete Note
- [ ] Delete own note - should work
- [ ] Try to delete someone else's note - should get 403 forbidden
- [ ] Delete already deleted note - should get 410 gone
- [ ] Delete question with accepted answer - should clear acceptedAnswerId
- [ ] Delete answer that is accepted - should clear parent's acceptedAnswerId
- [ ] Check deleted notes don't appear in queries

#### Get Single Note
- [ ] Get existing note - should return full data
- [ ] Get deleted note - should return 404
- [ ] Check all relations are included (user, category, parent, children)
- [ ] Check counts are correct (children, likes, views)

### API Testing (curl/Postman)

```bash
# Like a note
POST /api/notes/:id/like
Body: { "proof": {...}, "signal": "noteId" }

# Unlike a note
POST /api/notes/:id/like
Body: {} (no proof needed if already liked)

# Record view
POST /api/notes/:id/view
Body: { "proof": {...}, "signal": "noteId:2026-02-07" }

# Get note
GET /api/notes/:id

# Edit note
PATCH /api/notes/:id
Body: { "text": "Updated text" }

# Delete note
DELETE /api/notes/:id
```

---

## Files Created

### API Routes
- ✅ `src/app/api/notes/[id]/like/route.ts` - Like toggle endpoint
- ✅ `src/app/api/notes/[id]/view/route.ts` - View recording endpoint
- ✅ `src/app/api/notes/[id]/route.ts` - GET/PATCH/DELETE single note

### Documentation
- ✅ `PHASE3_COMPLETION.md` - This file
- ✅ `README.md` - Updated with new env vars and API endpoints

---

## Files Modified

### Configuration
- ✅ `README.md` - Added new action IDs and API documentation
- ✅ `src/lib/worldActions.ts` - Already updated in Phase 2

---

## Next Steps (Phase 4+)

### Frontend Integration
1. **Add Like Button Component**
   - Show like count
   - Toggle liked state
   - Handle World ID verification
   - Show loading state

2. **Add View Tracking**
   - Call view endpoint on note open
   - Debounce to prevent spam
   - Handle already-viewed case

3. **Add Edit/Delete UI**
   - Show edit/delete buttons for owned notes
   - Edit modal with text input
   - Delete confirmation dialog
   - Update UI after edit/delete

4. **Update Note Display**
   - Show like count with icon
   - Show view count with icon
   - Show "edited" indicator if updatedAt > createdAt
   - Handle deleted notes gracefully

### Additional Features (Optional)
1. **Unlike Limit** - Prevent rapid like/unlike spam
2. **Edit History** - Track note edits
3. **Undelete** - Allow users to restore deleted notes
4. **Like List** - Show who liked a note
5. **View Analytics** - Show view trends over time

---

## Performance Considerations

### Database Queries
- ✅ Indexes on `[noteId, userId]` for likes
- ✅ Indexes on `[noteId, dayBucket]` for views
- ✅ Indexes on `[action, signal]` for ActionProof
- ✅ Atomic transactions prevent race conditions

### Caching (Future)
- Cache note counts (likeCount, viewCount) in Redis
- Invalidate cache on like/unlike/view
- Reduces database load for popular notes

### Rate Limiting (World Dev Portal)
- Like: 50 per day (generous)
- View: 100 per day (browsing)
- Adjust based on usage patterns

---

## Security Audit

### ✅ Authentication
- All endpoints require wallet auth (session check)
- Edit/delete require ownership check
- Like/view require World ID verification

### ✅ Authorization
- Ownership checks prevent unauthorized edits/deletes
- World ID prevents bot spam on likes/views

### ✅ Input Validation
- Text length validated (max 300 chars)
- Signal format validated (noteId or noteId:YYYY-MM-DD)
- Date format validated (YYYY-MM-DD)

### ✅ Anti-Abuse
- Nullifier storage prevents replay
- Day bucket prevents refresh spam
- Asymmetric verification (like/unlike) reduces friction
- Soft delete preserves data integrity

### ✅ Error Handling
- Structured error responses
- No sensitive data leaked in errors
- Proper HTTP status codes

---

## PHASE 3 COMPLETE ✅

All engagement and note management endpoints are implemented and ready for frontend integration.

**Next**: Integrate these endpoints into the frontend UI components.
