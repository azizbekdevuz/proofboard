# PHASE 1: COMPREHENSIVE REPO AUDIT REPORT

## Executive Summary

**Current State**: ProofBoard is a functional World Mini App with Question/Answer models, World ID verification for all actions, and atomic transaction patterns already in place.

**Key Findings**:
- ✅ Atomic verification+write pattern already implemented
- ✅ Signal-based uniqueness working correctly
- ✅ ActionProof with (action, nullifier, signal) unique constraint
- ⚠️ Separate Question/Answer models (needs unification to Note)
- ⚠️ No like/view functionality yet
- ⚠️ No edit/delete functionality yet

---

## 1. Current Action IDs

### Defined in `src/lib/worldActions.ts`
```typescript
- getActionPostQuestion()    → NEXT_PUBLIC_ACTION_POST_QUESTION
- getActionPostAnswer()      → NEXT_PUBLIC_ACTION_POST_ANSWER
- getActionAcceptAnswer()    → NEXT_PUBLIC_ACTION_ACCEPT_ANSWER
```

### Expected Values (from docs)
```
- proofboard_post_question
- proofboard_post_answer
- proofboard_accept_answer
```

### Signal Strategies Currently Used

**Post Question** (`src/app/api/questions/route.ts`):
- Signal: `${categoryId}:${YYYY-MM-DD}` (from client)
- Allows: Multiple questions per category per day
- Purpose: Per-category daily rate limiting

**Post Answer** (`src/app/api/answers/route.ts`):
- Signal: `${questionId}:${YYYY-MM-DD}` (from client)
- Allows: Multiple answers per question per day
- Purpose: Per-question daily rate limiting

**Accept Answer** (`src/app/api/accept/route.ts`):
- Signal: `${questionId}` (from client)
- Allows: One accept per question (permanent)
- Purpose: Prevent multiple accepts on same question

---

## 2. Current Schema (Prisma)

### Models
```prisma
User {
  id, wallet (unique), username, createdAt
  questions: Question[]
  answers: Answer[]
}

Category {
  id, name (unique), createdAt
  questions: Question[]
}

Question {
  id, categoryId, userId, text, createdAt, acceptedId
  → acceptedId points to Answer.id
}

Answer {
  id, questionId, userId, text, createdAt
}

ActionProof {
  id, action, signal, nullifier, createdAt
  @@unique([action, nullifier, signal])
}
```

### Issues for Refactor
1. **Separate models**: Question and Answer should be unified to Note
2. **No soft delete**: Hard deletes would break referential integrity
3. **No like/view tracking**: Need NoteLike and NoteView (or ActionProof-based)
4. **No counts**: Need likeCount, viewCount on notes for fast reads
5. **No updatedAt**: Need for edit tracking

---

## 3. API Routes Analysis

### POST /api/questions (Create Question)
**File**: `src/app/api/questions/route.ts`

**Flow**:
1. Auth check (session.user.walletAddress)
2. Validate: categoryId, text, proof, signal
3. Get action ID from env
4. **verifyCloudProof**(proof, app_id, action, signal)
5. Extract nullifier from proof
6. **Atomic Transaction**:
   ```typescript
   db.$transaction(async (tx) => {
     // Store ActionProof
     await tx.actionProof.create({ data: { action, nullifier, signal } });
     // Upsert user
     const user = await tx.user.upsert({ ... });
     // Create question
     const question = await tx.question.create({ ... });
     return question;
   });
   ```
7. Return 409 on replay (P2002 error)

**Pattern**: ✅ **EXCELLENT** - Atomic verify+write, proper error handling

### POST /api/answers (Create Answer)
**File**: `src/app/api/answers/route.ts`

**Flow**: Same pattern as questions
- verifyCloudProof → ActionProof insert → Answer create
- All in atomic transaction

**Pattern**: ✅ **EXCELLENT** - Consistent with questions

### POST /api/accept (Accept Answer)
**File**: `src/app/api/accept/route.ts`

**Flow**:
1. Auth check
2. Validate: questionId, answerId, proof, signal
3. **Ownership check** (before consuming verification):
   ```typescript
   const q = await db.question.findUnique({ where: { id: questionId }, include: { user: true } });
   if (q.user.wallet !== wallet) return 403;
   ```
4. **Atomic Transaction**:
   ```typescript
   db.$transaction(async (tx) => {
     await tx.actionProof.create({ data: { action, nullifier, signal } });
     const updated = await tx.question.update({
       where: { id: questionId },
       data: { acceptedId: answerId },
     });
     return updated;
   });
   ```

**Pattern**: ✅ **EXCELLENT** - Ownership check before verify, atomic update

### GET /api/questions?categoryId=xxx
**File**: `src/app/api/questions/route.ts`

**Query**:
```typescript
db.question.findMany({
  where: { categoryId },
  include: {
    user: { select: { username, wallet } },
    answers: { include: { user }, orderBy: { createdAt: "asc" } },
    _count: { select: { answers: true } },
  },
  orderBy: { createdAt: "desc" },
});
```

**Returns**: Questions with nested answers (full board data)

### GET /api/my/questions
**File**: `src/app/api/my/questions/route.ts`

**Query**:
```typescript
db.question.findMany({
  where: { userId: user.id },
  include: {
    category: { select: { id, name } },
    _count: { select: { answers: true } },
  },
  orderBy: { createdAt: "desc" },
});
```

### GET /api/my/answers
**File**: `src/app/api/my/answers/route.ts`

**Query**:
```typescript
db.answer.findMany({
  where: { userId: user.id },
  include: {
    question: {
      include: { category: { select: { id, name } } },
      select: { id, text, acceptedId, category },
    },
  },
  orderBy: { createdAt: "desc" },
});
```

---

## 4. Verification Pattern (Reusable)

### Current Atomic Pattern (from all 3 action routes)
```typescript
// 1. Auth check
const session = await auth();
if (!session?.user?.walletAddress) return 401;

// 2. Validate inputs
if (!proof || !signal) return 400;

// 3. Verify proof server-side
const verifyRes = await verifyCloudProof(proof, app_id, action, signal);
if (!verifyRes.success) return 400;

// 4. Extract nullifier
const nullifier = verifyRes.nullifier_hash ?? proof.nullifier_hash;
if (!nullifier) return 400;

// 5. Atomic transaction
try {
  const result = await db.$transaction(async (tx) => {
    // 5a. Store ActionProof (anti-replay)
    await tx.actionProof.create({ data: { action, nullifier, signal } });
    
    // 5b. Perform side effect (create/update)
    const entity = await tx.question.create({ ... });
    
    return entity;
  });
  return 200;
} catch (error) {
  if (error.code === 'P2002') return 409; // Replay
  return 500;
}
```

**This pattern MUST be reused for**:
- Like toggle (with special handling for unlike)
- View recording
- Edit note
- Delete note (soft delete)

---

## 5. Accept Answer Logic

### Current Implementation
```typescript
// In Question model
acceptedId: String? // Points to Answer.id

// In /api/accept route
await tx.question.update({
  where: { id: questionId },
  data: { acceptedId: answerId },
});
```

### Issues for Unified Note Model
- When Question becomes Note (type=QUESTION):
  - acceptedAnswerId: String? // Points to Note.id where type=ANSWER
- When Answer is deleted:
  - Must null out acceptedAnswerId if it matches deleted answer
- When Question is deleted:
  - Must handle or prevent if it has accepted answer

---

## 6. My Activity Endpoints

### Current Behavior
- **GET /api/my/questions**: Returns user's questions with category and answer count
- **GET /api/my/answers**: Returns user's answers with question context and acceptedId

### After Note Refactor
- **GET /api/my/notes?type=QUESTION**: Filter by type=QUESTION
- **GET /api/my/notes?type=ANSWER**: Filter by type=ANSWER
- Or keep separate routes but query unified Note table

---

## 7. Missing Functionality

### A) Like Toggle
**Not Implemented**

**Required**:
- NoteLike table: noteId, userId, createdAt, @@unique([noteId, userId])
- Note.likeCount: Int @default(0)
- POST /api/notes/:id/like (toggle)
- World ID action: `proofboard_like_note`
- Signal strategy: `${noteId}` (allows toggle)

**Challenge**: Verify is for "first-time" actions; toggle needs special handling:
- **Option 1**: Verify only on like (create), no verify on unlike (delete)
- **Option 2**: Verify on both but use different signals (bad UX)
- **Recommended**: Option 1

### B) View Count
**Not Implemented**

**Required**:
- NoteView table: noteId, userId, dayBucket (YYYY-MM-DD), createdAt, @@unique([noteId, userId, dayBucket])
- Note.viewCount: Int @default(0)
- POST /api/notes/:id/view
- World ID action: `proofboard_view_note`
- Signal strategy: `${noteId}:${YYYY-MM-DD}` (one view per human per note per day)

**Alternative**: Use ActionProof table directly (no separate NoteView table)

### C) Edit/Delete
**Not Implemented**

**Required**:
- Note.updatedAt: DateTime @updatedAt
- Note.deletedAt: DateTime? (soft delete)
- PATCH /api/notes/:id (edit)
- DELETE /api/notes/:id (soft delete)
- Authorization: Only owner can edit/delete
- No World ID verify needed (wallet auth sufficient)

---

## 8. Proposed Action IDs (Complete List)

### Existing (Keep)
```
proofboard_post_question  → Unified to: proofboard_create_note
proofboard_post_answer    → Unified to: proofboard_create_note
proofboard_accept_answer  → Keep as: proofboard_accept_answer
```

### New (Add to Dev Portal)
```
proofboard_like_note      → For like toggle (first-time like only)
proofboard_view_note      → For view recording (once per human per note per day)
```

### Recommendation
- **Unify create actions**: Use single `proofboard_create_note` for both questions and answers
- **Signal differentiates**: 
  - Question: `${categoryId}:${YYYY-MM-DD}`
  - Answer: `${parentId}:${YYYY-MM-DD}`
- **Or keep separate** if Dev Portal already configured

---

## 9. Schema Refactor Plan

### New Note Model
```prisma
model Note {
  id              String    @id @default(cuid())
  type            NoteType  // enum: QUESTION, ANSWER
  parentId        String?   // For ANSWER: points to QUESTION note
  categoryId      String    // Required for QUESTION; for ANSWER can be derived
  userId          String
  text            String
  likeCount       Int       @default(0)
  viewCount       Int       @default(0)
  acceptedAnswerId String?  // For QUESTION: points to accepted ANSWER note
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime? // Soft delete
  
  category        Category  @relation(fields: [categoryId], references: [id])
  user            User      @relation(fields: [userId], references: [id])
  parent          Note?     @relation("NoteToNote", fields: [parentId], references: [id])
  children        Note[]    @relation("NoteToNote")
  likes           NoteLike[]
  views           NoteView[]
  
  @@index([categoryId, type, deletedAt])
  @@index([parentId, deletedAt])
  @@index([userId, type, deletedAt])
}

enum NoteType {
  QUESTION
  ANSWER
}

model NoteLike {
  id        String   @id @default(cuid())
  noteId    String
  userId    String
  createdAt DateTime @default(now())
  
  note      Note     @relation(fields: [noteId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])
  
  @@unique([noteId, userId])
  @@index([userId])
}

model NoteView {
  id        String   @id @default(cuid())
  noteId    String
  userId    String
  dayBucket String   // YYYY-MM-DD
  createdAt DateTime @default(now())
  
  note      Note     @relation(fields: [noteId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])
  
  @@unique([noteId, userId, dayBucket])
  @@index([userId])
  @@index([noteId, dayBucket])
}
```

### Migration Strategy
**Option A: Destructive Reset** (Fastest for hackathon)
```sql
-- Drop existing tables
DROP TABLE IF EXISTS "Answer" CASCADE;
DROP TABLE IF EXISTS "Question" CASCADE;
-- Create new Note table with migrations
```

**Option B: Data Migration** (Preserves existing data)
```sql
-- Create Note table
-- Migrate Question rows → Note (type=QUESTION)
-- Migrate Answer rows → Note (type=ANSWER, parentId=questionId)
-- Update foreign keys
-- Drop old tables
```

**Recommendation**: Option A for hackathon (document in README)

---

## 10. Frontend Dependencies

### Components Using Question/Answer
- `src/components/CategoriesList/index.tsx` - Queries categories (no change)
- `src/components/CategoryBoard/index.tsx` - Queries questions with answers
- `src/components/QuestionCard/index.tsx` - Displays question with answers
- `src/components/ComposeQuestion/index.tsx` - Posts question
- `src/components/ComposeAnswer/index.tsx` - Posts answer
- `src/components/MyActivity/index.tsx` - Queries my questions and answers

### Required Changes
- Update API calls to use `/api/notes` routes
- Update TypeScript interfaces (Question/Answer → Note)
- Add like button UI
- Add view count display
- Add edit/delete buttons (owner only)

---

## 11. Reusable Patterns Identified

### 1. Atomic Verify+Write Transaction
```typescript
async function atomicVerifyAndWrite<T>(
  action: string,
  signal: string,
  proof: ISuccessResult,
  app_id: string,
  sideEffect: (tx: PrismaTransaction) => Promise<T>
): Promise<T> {
  // Verify proof
  const verifyRes = await verifyCloudProof(proof, app_id, action, signal);
  if (!verifyRes.success) throw new Error('Verification failed');
  
  // Extract nullifier
  const nullifier = verifyRes.nullifier_hash ?? proof.nullifier_hash;
  if (!nullifier) throw new Error('Missing nullifier');
  
  // Atomic transaction
  return await db.$transaction(async (tx) => {
    // Store ActionProof
    await tx.actionProof.create({ data: { action, nullifier, signal } });
    // Perform side effect
    return await sideEffect(tx);
  });
}
```

### 2. Auth Check Middleware
```typescript
async function requireAuth(req: NextRequest): Promise<string> {
  const session = await auth();
  if (!session?.user?.walletAddress) {
    throw new Error('Unauthorized');
  }
  return session.user.walletAddress;
}
```

### 3. Ownership Check
```typescript
async function requireOwnership(noteId: string, wallet: string): Promise<Note> {
  const note = await db.note.findUnique({
    where: { id: noteId },
    include: { user: true },
  });
  if (!note) throw new Error('Not found');
  if (note.user.wallet !== wallet) throw new Error('Forbidden');
  return note;
}
```

---

## 12. Recommendations for Implementation

### Phase 2: Schema Refactor
1. Create new Note, NoteLike, NoteView models
2. Add NoteType enum
3. Update User relations
4. Create migration (destructive reset for hackathon)
5. Update seed script for categories
6. Run `npx prisma generate`

### Phase 3: Core CRUD
1. Create `/api/notes` route with POST (create), GET (list), PATCH (edit), DELETE (soft delete)
2. Reuse atomic verify+write pattern for create
3. Use wallet auth only for edit/delete (no World ID needed)
4. Update accept route to work with Note model

### Phase 4: Like Toggle
1. Add `proofboard_like_note` action to Dev Portal
2. Create POST `/api/notes/:id/like` route
3. Implement toggle logic:
   - Check if NoteLike exists
   - If exists: delete like, decrement count (no verify)
   - If not exists: verify proof, create like, increment count (with verify)
4. Use atomic transaction for count updates

### Phase 5: View Count
1. Add `proofboard_view_note` action to Dev Portal
2. Create POST `/api/notes/:id/view` route
3. Signal: `${noteId}:${YYYY-MM-DD}`
4. Use atomic verify+write pattern
5. Increment viewCount only on first view of day bucket

### Phase 6: Update My Activity
1. Update `/api/my/notes` to query Note table
2. Filter by type (QUESTION or ANSWER)
3. Include accepted status for answers
4. Exclude soft-deleted notes

### Phase 7: Frontend Updates
1. Update TypeScript interfaces
2. Update API calls
3. Add like button with count
4. Add view count display
5. Add edit/delete buttons (owner only)
6. Handle soft-deleted notes in UI

---

## 13. Action Items Summary

### Immediate (Phase 2)
- [ ] Update `src/lib/worldActions.ts` with new action getters
- [ ] Create new Prisma schema with Note, NoteLike, NoteView
- [ ] Create migration (destructive reset)
- [ ] Update seed script
- [ ] Run `npx prisma generate`

### Short-term (Phases 3-5)
- [ ] Implement `/api/notes` CRUD routes
- [ ] Implement `/api/notes/:id/like` toggle
- [ ] Implement `/api/notes/:id/view` recording
- [ ] Update accept route for Note model
- [ ] Update My Activity routes

### Medium-term (Phases 6-7)
- [ ] Update frontend components
- [ ] Add like/view UI
- [ ] Add edit/delete UI
- [ ] Test all flows in World App

---

## 14. Risk Assessment

### High Risk
- **Schema migration**: Could break existing data
  - **Mitigation**: Destructive reset with clear documentation
- **Frontend breaking changes**: API response shapes change
  - **Mitigation**: Keep response shapes similar, use adapters if needed

### Medium Risk
- **Like toggle complexity**: Verify on like, no verify on unlike
  - **Mitigation**: Clear documentation, test thoroughly
- **Soft delete cascade**: Deleting question affects answers
  - **Mitigation**: Define clear rules, implement consistently

### Low Risk
- **View count spam**: Refresh spam
  - **Mitigation**: Day bucket + World ID prevents abuse
- **Race conditions**: Concurrent likes/views
  - **Mitigation**: Atomic transactions already in place

---

## PHASE 1 AUDIT COMPLETE ✅

**Next Step**: Proceed to PHASE 2 (Schema Refactor) with approval.

**Key Takeaway**: The codebase already has excellent patterns (atomic verify+write, proper error handling). We can reuse these patterns for new features. The main work is schema refactor and implementing like/view/edit/delete functionality.
