/*
  Warnings:

  - You are about to alter the column `balance` on the `Bank` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.

*/
-- AlterTable
ALTER TABLE "Bank" ADD COLUMN     "profit" BIGINT NOT NULL DEFAULT 0,
ALTER COLUMN "balance" SET DEFAULT 1000,
ALTER COLUMN "balance" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Shop" ALTER COLUMN "amountOwned" SET DATA TYPE BIGINT,
ALTER COLUMN "profit" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "wallet" SET DATA TYPE BIGINT,
ALTER COLUMN "level" SET DATA TYPE BIGINT;
