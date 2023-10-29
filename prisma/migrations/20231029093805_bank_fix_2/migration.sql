/*
  Warnings:

  - Changed the type of `bankId` on the `Bank` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Bank" DROP COLUMN "bankId",
ADD COLUMN     "bankId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Bank_bankId_ownerId_key" ON "Bank"("bankId", "ownerId");
