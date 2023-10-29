-- CreateTable
CREATE TABLE "Bank" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "size" INTEGER NOT NULL DEFAULT 0,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "wallet" DOUBLE PRECISION NOT NULL DEFAULT 100,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shop" (
    "id" SERIAL NOT NULL,
    "shopId" INTEGER NOT NULL,
    "amountOwned" INTEGER NOT NULL,
    "ownerId" TEXT NOT NULL,
    "profit" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bank_name_ownerId_key" ON "Bank"("name", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_shopId_ownerId_key" ON "Shop"("shopId", "ownerId");

-- AddForeignKey
ALTER TABLE "Bank" ADD CONSTRAINT "Bank_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
