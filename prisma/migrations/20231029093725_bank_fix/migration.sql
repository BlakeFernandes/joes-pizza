/*
  Warnings:

  - You are about to drop the column `name` on the `Bank` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `Bank` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bankId,ownerId]` on the table `Bank` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bankId` to the `Bank` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Bank_name_ownerId_key";

-- AlterTable
ALTER TABLE "Bank" DROP COLUMN "name",
DROP COLUMN "size",
ADD COLUMN     "bankId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Bank_bankId_ownerId_key" ON "Bank"("bankId", "ownerId");
