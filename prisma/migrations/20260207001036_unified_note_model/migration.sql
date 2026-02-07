/*
  Warnings:

  - You are about to drop the `Answer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Question` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('QUESTION', 'ANSWER');

-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_userId_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_userId_fkey";

-- DropTable
DROP TABLE "Answer";

-- DropTable
DROP TABLE "Question";

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "type" "NoteType" NOT NULL,
    "parentId" TEXT,
    "categoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "acceptedAnswerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteLike" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteView" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayBucket" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Note_categoryId_type_deletedAt_idx" ON "Note"("categoryId", "type", "deletedAt");

-- CreateIndex
CREATE INDEX "Note_parentId_deletedAt_idx" ON "Note"("parentId", "deletedAt");

-- CreateIndex
CREATE INDEX "Note_userId_type_deletedAt_idx" ON "Note"("userId", "type", "deletedAt");

-- CreateIndex
CREATE INDEX "Note_type_createdAt_idx" ON "Note"("type", "createdAt");

-- CreateIndex
CREATE INDEX "NoteLike_userId_idx" ON "NoteLike"("userId");

-- CreateIndex
CREATE INDEX "NoteLike_noteId_idx" ON "NoteLike"("noteId");

-- CreateIndex
CREATE UNIQUE INDEX "NoteLike_noteId_userId_key" ON "NoteLike"("noteId", "userId");

-- CreateIndex
CREATE INDEX "NoteView_userId_idx" ON "NoteView"("userId");

-- CreateIndex
CREATE INDEX "NoteView_noteId_dayBucket_idx" ON "NoteView"("noteId", "dayBucket");

-- CreateIndex
CREATE UNIQUE INDEX "NoteView_noteId_userId_dayBucket_key" ON "NoteView"("noteId", "userId", "dayBucket");

-- CreateIndex
CREATE INDEX "ActionProof_action_signal_idx" ON "ActionProof"("action", "signal");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Note"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "NoteLike" ADD CONSTRAINT "NoteLike_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteLike" ADD CONSTRAINT "NoteLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteView" ADD CONSTRAINT "NoteView_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteView" ADD CONSTRAINT "NoteView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
