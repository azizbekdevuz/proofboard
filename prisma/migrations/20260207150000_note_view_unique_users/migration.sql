-- CreateTable: track unique viewers per question (viewsCount = distinct users)
CREATE TABLE "NoteView" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteView_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NoteView_noteId_userId_key" ON "NoteView"("noteId", "userId");

ALTER TABLE "NoteView" ADD CONSTRAINT "NoteView_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NoteView" ADD CONSTRAINT "NoteView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
