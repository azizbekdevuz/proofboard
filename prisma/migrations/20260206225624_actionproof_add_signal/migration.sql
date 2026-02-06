/*
  Warnings:

  - A unique constraint covering the columns `[action,nullifier,signal]` on the table `ActionProof` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `signal` to the `ActionProof` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ActionProof_action_nullifier_key";

-- AlterTable
ALTER TABLE "ActionProof"
ADD COLUMN "signal" TEXT NOT NULL DEFAULT 'legacy';

-- CreateIndex
CREATE UNIQUE INDEX "ActionProof_action_nullifier_signal_key" ON "ActionProof"("action", "nullifier", "signal");
