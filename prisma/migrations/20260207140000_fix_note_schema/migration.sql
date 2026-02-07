-- Fix: Note table may have been created with wrong schema (e.g. categoryId) elsewhere.
-- Drop and recreate so our app's columns (category, referenceId, viewsCount, etc.) exist.
DROP TABLE IF EXISTS "Note" CASCADE;

CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" "NoteType" NOT NULL,
    "referenceId" TEXT NOT NULL DEFAULT '',
    "text" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "answersNum" INTEGER NOT NULL DEFAULT 0,
    "acceptedAnswerId" TEXT NOT NULL DEFAULT '',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
