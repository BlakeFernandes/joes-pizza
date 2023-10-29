/*
  Warnings:

  - You are about to alter the column `wallet` on the `User` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "wallet" SET DEFAULT 100,
ALTER COLUMN "wallet" SET DATA TYPE INTEGER;
