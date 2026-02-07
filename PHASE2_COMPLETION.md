# PHASE 2 COMPLETION: Schema Refactor to Unified Note Model

## ✅ Status: COMPLETE

All API routes have been updated to use the new unified Note model while maintaining backward compatibility with the frontend.

---

## Changes Summary

### 1. Schema Changes ✅
**File**: `prisma/schema.prisma`

- ✅ Created `Note` model (unified Question + Answer)
- ✅ Created `NoteLike` model (engagement tracking)
- ✅ Created `NoteView` model (view tracking with day buckets)
- ✅ Created `NoteType` enum (QUESTION | ANSWER)
- ✅ Added soft delete support (`deletedAt`)
- ✅ Added engagement counts (`likeCount`, `viewCount`)
- ✅ Updated `User` relations (notes, likes, views)
- ✅ Updated `Category` relations (notes instead of questions)
- ✅ Added performance indexes

### 2. Action IDs ✅
**File**: `src/lib/worldActions.ts`

- ✅ Added `getActionLikeNote()` for like toggle
- ✅ Added `getActionViewNote()` for view recording
- ✅ Added `getActionCreateNote()` for future unification
- ✅ Kept existing actions for backward compatibility
- ✅ Added comprehensive documentation

### 3. Seed Script ✅
**File**: `prisma/seed.ts`

- ✅ Updated to seed categories
- ✅ Added sample Note creation (1 question + 1 answer)
- ✅ Uses new Note model with type field

### 4. API Routes Updated ✅

#### `/api/categories` ✅
- Changed `_count: { select: { questions: true } }` → `_count: { select: { notes: true } }`

#### `/api/questions` (GET) ✅
- Queries `Note` table with `type: 'QUESTION'`
- Filters out soft-deleted notes (`deletedAt: null`)
- Includes `children` (answers) instead of `answers` relation
- Transforms response to match old API shape for backward compatibility

#### `/api/questions` (POST) ✅
- Creates `Note` with `type: 'QUESTION'`
- Maintains atomic verify+write transaction pattern
- Transforms response to match old API shape

#### `/api/answers` (GET) ✅
- Queries `Note` table with `type: 'ANSWER'` and `parentId: questionId`
- Filters out soft-deleted notes
- Transforms response to match old API shape

#### `/api/answers` (POST) ✅
- Validates parent question exists and is of type `QUESTION`
- Creates `Note` with `type: 'ANSWER'` and `parentId: questionId`
- Inherits `categoryId` from parent question
- Maintains atomic verify+write transaction pattern
- Transforms response to match old API shape
- Added `INVALID_PARENT` error handling

#### `/api/accept` ✅
- Validates question is of type `QUESTION`
- Validates answer is of type `ANSWER` and belongs to question
- Updates `acceptedAnswerId` field (renamed from `acceptedId`)
- Maintains atomic verify+write transaction pattern
- Transforms response to match old API shape
- Added `INVALID_ANSWER` error handling

#### `/api/my/questions` ✅
- Queries `Note` table with `type: 'QUESTION'` and `userId`
- Filters out soft-deleted notes
- Uses `_count: { children }` instead of `_count: { answers }`
- Transforms response to match old API shape

#### `/api/my/answers` ✅
- Queries `Note` table with `type: 'ANSWER'` and `userId`
- Filters out soft-deleted notes
- Includes `parent` (question) instead of `question` relation
- Transforms response to match old API shape

---

## Backward Compatibility Strategy

All API routes maintain the old response shapes by transforming the new Note model data:

### Old Shape (Question)
```json
{
  "id": "...",
  "categoryId": "...",
  "userId": "...",
  "text": "...",
  "createdAt": "...",
  "acceptedId": "...",
  "answers": [...],
  "_count": { "answers": 5 }
}
```

### New Internal Model (Note)
```json
{
  "id": "...",
  "type": "QUESTION",
  "parentId": null,
  "categoryId": "...",
  "userId": "...",
  "text": "...",
  "likeCount": 0,
  "viewCount": 0,
  "acceptedAnswerId": "...",
  "createdAt": "...",
  "updatedAt": "...",
  "deletedAt": null,
  "children": [...]
}
```

### Transformation Applied
```typescript
{
  id: note.id,
  categoryId: note.categoryId,
  userId: note.userId,
  text: note.text,
  createdAt: note.createdAt,
  acceptedId: note.acceptedAnswerId, // Renamed field
  answers: note.children.map(...),   // Renamed relation
  _count: { answers: note._count.children }
}
```

This ensures the frontend continues to work without changes while we use the new unified model internally.

---

## Database Migration Status

Based on terminal history, the migration has been successfully applied:
- ✅ `npx prisma migrate dev --name unified_note_model` (completed)
- ✅ `npx prisma generate` (completed)
- ✅ `npx prisma db seed` (completed)

The database now has:
- ✅ `Note` table with `type`, `parentId`, `likeCount`, `viewCount`, `acceptedAnswerId`, `deletedAt`
- ✅ `NoteLike` table with unique constraint on `[noteId, userId]`
- ✅ `NoteView` table with unique constraint on `[noteId, userId, dayBucket]`
- ❌ `Question` table (removed)
- ❌ `Answer` table (removed)

---

## Error Handling Improvements

### New Error Types
1. **INVALID_PARENT** (answers route)
   - Returns 404 when parent question not found or invalid
   - Prevents creating answers to non-existent questions

2. **INVALID_ANSWER** (accept route)
   - Returns 400 when answer is invalid or doesn't belong to question
   - Prevents accepting wrong answers

### Existing Error Types (Maintained)
- `REPLAY_DETECTED` → 409 (replay protection)
- `unauthorized` → 401 (no session)
- `bad_request` → 400 (missing fields)
- `verification_failed` → 400 (World ID verification failed)
- `not_found` → 404 (resource not found)
- `forbidden` → 403 (ownership check failed)
- `server_error` → 500 (unexpected errors)

---

## Soft Delete Implementation

All queries now filter out soft-deleted notes:
```typescript
where: {
  deletedAt: null, // Exclude soft-deleted
  // ... other conditions
}
```

Benefits:
- Referential integrity maintained
- Can implement "undelete" functionality later
- Accepted answers remain visible even if deleted (can be handled in UI)
- Activity history preserved

---

## Performance Optimizations

### Indexes Added
```prisma
@@index([categoryId, type, deletedAt])  // Category board queries
@@index([parentId, deletedAt])          // Answer queries
@@index([userId, type, deletedAt])      // My activity queries
@@index([type, createdAt])              // General note queries
@@index([noteId, userId])               // Like lookups
@@index([noteId, dayBucket])            // View lookups
@@index([action, signal])               // ActionProof lookups
```

These indexes optimize:
- Category board loading (questions + answers)
- My activity page (user's questions and answers)
- Like/view count queries (future)
- Replay detection (ActionProof lookups)

---

## Testing Checklist

### Manual Testing (Required)
- [ ] Category list loads with note counts
- [ ] Category board shows questions and answers
- [ ] Post new question works
- [ ] Post new answer works
- [ ] Accept answer works (owner only)
- [ ] My Questions page shows user's questions
- [ ] My Answers page shows user's answers
- [ ] Soft-deleted notes are hidden
- [ ] Error messages display correctly

### API Testing (curl/Postman)
```bash
# Get categories
GET /api/categories

# Get questions for category
GET /api/questions?categoryId=xxx

# Get answers for question
GET /api/answers?questionId=xxx

# Get my questions
GET /api/my/questions

# Get my answers
GET /api/my/answers
```

---

## Known Issues / Limitations

1. **Frontend Not Updated Yet**
   - Frontend still uses old TypeScript interfaces (Question, Answer)
   - Frontend doesn't display likeCount or viewCount yet
   - Frontend doesn't have edit/delete UI yet
   - **Solution**: Phase 3+ will update frontend components

2. **No Edit/Delete Endpoints Yet**
   - PATCH `/api/notes/:id` not implemented
   - DELETE `/api/notes/:id` not implemented
   - **Solution**: Phase 3 will add these

3. **No Like/View Endpoints Yet**
   - POST `/api/notes/:id/like` not implemented
   - POST `/api/notes/:id/view` not implemented
   - **Solution**: Phase 4-5 will add these

4. **Accepted Answer Deletion**
   - If accepted answer is soft-deleted, `acceptedAnswerId` still points to it
   - **Solution**: Handle in UI (show "deleted" state) or add cleanup logic

---

## Next Steps (Phase 3)

1. **Create `/api/notes` CRUD endpoints**
   - POST `/api/notes` (unified create for questions + answers)
   - GET `/api/notes/:id` (single note detail)
   - PATCH `/api/notes/:id` (edit note - owner only, no verify needed)
   - DELETE `/api/notes/:id` (soft delete - owner only, no verify needed)

2. **Update Accept Route** (if needed)
   - Already updated in Phase 2 ✅

3. **Add Validation**
   - Prevent editing/deleting notes after certain time
   - Prevent deleting question with accepted answer (or handle gracefully)

4. **Documentation**
   - Update API_ERROR_REFERENCE.md
   - Update README.md with new endpoints

---

## Files Changed

### Schema & Config
- ✅ `prisma/schema.prisma` - New Note model + relations
- ✅ `prisma/seed.ts` - Updated seed script
- ✅ `src/lib/worldActions.ts` - New action getters

### API Routes
- ✅ `src/app/api/categories/route.ts` - Use notes count
- ✅ `src/app/api/questions/route.ts` - Query/create Note (type=QUESTION)
- ✅ `src/app/api/answers/route.ts` - Query/create Note (type=ANSWER)
- ✅ `src/app/api/accept/route.ts` - Update acceptedAnswerId
- ✅ `src/app/api/my/questions/route.ts` - Query user's questions
- ✅ `src/app/api/my/answers/route.ts` - Query user's answers

### Documentation
- ✅ `PHASE1_AUDIT_REPORT.md` - Audit results
- ✅ `PHASE2_SCHEMA_MIGRATION.md` - Migration guide
- ✅ `PHASE2_COMPLETION.md` - This file

---

## Migration Commands (For Reference)

```bash
# 1. Create and apply migration
npx prisma migrate dev --name unified_note_model

# 2. Generate Prisma client
npx prisma generate

# 3. Seed database
npx prisma db seed

# 4. Verify in Prisma Studio
npx prisma studio

# 5. Restart dev server
pnpm dev
```

---

## PHASE 2 COMPLETE ✅

The schema refactor is complete and all API routes have been updated to use the unified Note model while maintaining backward compatibility.

**Ready for Phase 3**: Implement like toggle, view recording, and edit/delete functionality.
