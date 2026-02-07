# PHASE 2: Schema Migration - Question/Answer → Note

## Migration Strategy: DESTRUCTIVE RESET

**Chosen Approach**: Destructive reset (drop old tables, create new)
**Rationale**: Fastest for hackathon, clean slate, no data migration complexity
**Trade-off**: Loses existing data (acceptable for hackathon/development)

---

## Schema Changes Summary

### Removed Models
- ❌ `Question` model
- ❌ `Answer` model

### Added Models
- ✅ `Note` model (unified Question + Answer)
- ✅ `NoteLike` model (like tracking)
- ✅ `NoteView` model (view tracking with day buckets)
- ✅ `NoteType` enum (QUESTION | ANSWER)

### Updated Models
- ✅ `User`: Now has `notes[]`, `likes[]`, `views[]` relations
- ✅ `Category`: Now has `notes[]` relation
- ✅ `ActionProof`: Added index on `[action, signal]`

---

## New Note Model Structure

```prisma
Note {
  // Identity
  id: String (cuid)
  type: NoteType (QUESTION | ANSWER)
  
  // Hierarchy
  parentId: String? (for ANSWER → points to QUESTION)
  categoryId: String (required)
  
  // Content
  userId: String
  text: String (max 300 chars)
  
  // Engagement
  likeCount: Int (default 0)
  viewCount: Int (default 0)
  
  // Accept logic (for QUESTION type)
  acceptedAnswerId: String? (points to ANSWER note)
  
  // Timestamps
  createdAt: DateTime
  updatedAt: DateTime (auto-updated)
  deletedAt: DateTime? (soft delete)
  
  // Relations
  category, user, parent, children[], likes[], views[]
}
```

### Type Semantics
- **QUESTION**: `parentId = null`, has `categoryId`, can have `acceptedAnswerId`
- **ANSWER**: `parentId = questionId`, has `categoryId` (inherited or stored), cannot have `acceptedAnswerId`

---

## NoteLike Model

```prisma
NoteLike {
  id: String
  noteId: String
  userId: String
  createdAt: DateTime
  
  @@unique([noteId, userId]) // One like per user per note
}
```

**Purpose**: Track who liked which notes
**Count**: `Note.likeCount` updated atomically on like/unlike

---

## NoteView Model

```prisma
NoteView {
  id: String
  noteId: String
  userId: String
  dayBucket: String (YYYY-MM-DD)
  createdAt: DateTime
  
  @@unique([noteId, userId, dayBucket]) // One view per user per note per day
}
```

**Purpose**: Track real views (human-only, anti-spam)
**Count**: `Note.viewCount` incremented on first view of day bucket

---

## Migration Commands

### Step 1: Backup (if needed)
```bash
# Export existing data (optional)
npx prisma db pull
# Backup current database (if production)
```

### Step 2: Reset Database
```bash
# WARNING: This will delete ALL data
npx prisma migrate reset --force

# This command will:
# 1. Drop the database
# 2. Create a new database
# 3. Apply all migrations
# 4. Run seed script
```

### Step 3: Create New Migration
```bash
# Create migration for new schema
npx prisma migrate dev --name unified_note_model

# This will:
# 1. Generate SQL migration
# 2. Apply to database
# 3. Regenerate Prisma Client
```

### Step 4: Generate Prisma Client
```bash
# Regenerate client with new types
npx prisma generate
```

### Step 5: Seed Database
```bash
# Seed categories
npx prisma db seed
```

---

## Updated Seed Script

**File**: `prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed categories
  const categories = [
    { name: 'Tech' },
    { name: 'Life' },
    { name: 'Science' },
    { name: 'Art' },
    { name: 'Business' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  console.log('✅ Seeded categories');

  // Optional: Seed sample notes for testing
  const techCategory = await prisma.category.findUnique({
    where: { name: 'Tech' },
  });

  if (techCategory) {
    // Create a test user
    const testUser = await prisma.user.upsert({
      where: { wallet: '0x0000000000000000000000000000000000000000' },
      update: {},
      create: {
        wallet: '0x0000000000000000000000000000000000000000',
        username: 'Test User',
      },
    });

    // Create a sample question
    const question = await prisma.note.create({
      data: {
        type: 'QUESTION',
        categoryId: techCategory.id,
        userId: testUser.id,
        text: 'What is the best way to learn Web3 development?',
      },
    });

    // Create a sample answer
    await prisma.note.create({
      data: {
        type: 'ANSWER',
        parentId: question.id,
        categoryId: techCategory.id,
        userId: testUser.id,
        text: 'Start with Solidity tutorials and build small projects. Practice is key!',
      },
    });

    console.log('✅ Seeded sample notes');
  }

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## Verification Steps

### 1. Check Schema
```bash
npx prisma studio
```
- Verify `Note` table exists
- Verify `NoteLike` table exists
- Verify `NoteView` table exists
- Verify `Question` and `Answer` tables are gone

### 2. Check Types
```typescript
// In any TypeScript file
import { Note, NoteType, NoteLike, NoteView } from '@prisma/client';

// These should have no errors
const note: Note = { ... };
const type: NoteType = 'QUESTION';
```

### 3. Check Indexes
```sql
-- In PostgreSQL
\d "Note"
-- Should show indexes on:
-- - categoryId, type, deletedAt
-- - parentId, deletedAt
-- - userId, type, deletedAt
-- - type, createdAt
```

---

## Data Mapping (Old → New)

### Question → Note (type=QUESTION)
```typescript
{
  id: question.id,
  type: 'QUESTION',
  parentId: null,
  categoryId: question.categoryId,
  userId: question.userId,
  text: question.text,
  likeCount: 0,
  viewCount: 0,
  acceptedAnswerId: question.acceptedId, // Maps directly
  createdAt: question.createdAt,
  updatedAt: question.createdAt, // Set to createdAt initially
  deletedAt: null,
}
```

### Answer → Note (type=ANSWER)
```typescript
{
  id: answer.id,
  type: 'ANSWER',
  parentId: answer.questionId, // Maps to parentId
  categoryId: answer.question.categoryId, // Derived from parent
  userId: answer.userId,
  text: answer.text,
  likeCount: 0,
  viewCount: 0,
  acceptedAnswerId: null, // Answers don't have this
  createdAt: answer.createdAt,
  updatedAt: answer.createdAt,
  deletedAt: null,
}
```

---

## Breaking Changes

### API Response Shapes
**Before**:
```json
{
  "id": "question123",
  "categoryId": "cat1",
  "userId": "user1",
  "text": "Question text",
  "createdAt": "2026-02-07T...",
  "acceptedId": "answer456",
  "answers": [...]
}
```

**After**:
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
  "children": [...] // Renamed from "answers"
}
```

### TypeScript Interface Changes
**Before**:
```typescript
interface Question {
  id: string;
  categoryId: string;
  userId: string;
  text: string;
  createdAt: string;
  acceptedId: string | null;
  answers: Answer[];
}

interface Answer {
  id: string;
  questionId: string;
  userId: string;
  text: string;
  createdAt: string;
}
```

**After**:
```typescript
interface Note {
  id: string;
  type: 'QUESTION' | 'ANSWER';
  parentId: string | null;
  categoryId: string;
  userId: string;
  text: string;
  likeCount: number;
  viewCount: number;
  acceptedAnswerId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  children?: Note[]; // For questions
  parent?: Note; // For answers
}
```

---

## Rollback Plan

If migration fails or issues arise:

```bash
# 1. Revert schema changes
git checkout HEAD -- prisma/schema.prisma

# 2. Delete new migration
rm -rf prisma/migrations/YYYYMMDDHHMMSS_unified_note_model

# 3. Reset database to previous state
npx prisma migrate reset

# 4. Regenerate client
npx prisma generate

# 5. Restart dev server
npm run dev
```

---

## Post-Migration Checklist

- [ ] `npx prisma migrate dev` completed successfully
- [ ] `npx prisma generate` completed successfully
- [ ] `npx prisma db seed` completed successfully
- [ ] Prisma Studio shows new tables (Note, NoteLike, NoteView)
- [ ] Old tables (Question, Answer) are gone
- [ ] TypeScript compilation passes (`npx tsc --noEmit`)
- [ ] Dev server starts without errors
- [ ] Sample data visible in Prisma Studio

---

## Next Steps (Phase 3)

After schema migration is complete:
1. Update API routes to use Note model
2. Create `/api/notes` CRUD endpoints
3. Update `/api/accept` to work with Note
4. Implement like toggle endpoint
5. Implement view recording endpoint
6. Update My Activity endpoints

---

## PHASE 2 STATUS: READY TO EXECUTE

Run these commands in order:
```bash
# 1. Generate migration
npx prisma migrate dev --name unified_note_model

# 2. Generate Prisma client
npx prisma generate

# 3. Seed database
npx prisma db seed

# 4. Verify in Prisma Studio
npx prisma studio
```
