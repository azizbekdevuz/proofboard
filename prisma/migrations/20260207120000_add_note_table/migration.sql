-- CreateEnum (NoteType enum for Note.type)
DO $$ BEGIN
  CREATE TYPE "NoteType" AS ENUM ('QUESTION', 'ANSWER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable: Note (current app schema; init migration had Question/Answer instead)
CREATE TABLE IF NOT EXISTS "Note" (
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

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
