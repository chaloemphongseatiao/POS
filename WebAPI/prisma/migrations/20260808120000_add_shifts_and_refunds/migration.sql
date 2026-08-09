-- CreateTable
CREATE TABLE "Shift" (
    "id" SERIAL NOT NULL,
    "openingCash" DECIMAL(65,30) NOT NULL,
    "closingCash" DECIMAL(65,30),
    "expectedCash" DECIMAL(65,30),
    "diffCash" DECIMAL(65,30),
    "note" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "openedById" INTEGER NOT NULL,
    "closedById" INTEGER,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" SERIAL NOT NULL,
    "refundNumber" TEXT NOT NULL,
    "totalAmt" DECIMAL(65,30) NOT NULL,
    "totalCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "reason" TEXT,
    "restock" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "shiftId" INTEGER,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundItem" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "costPrice" DECIMAL(65,30) NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "refundId" INTEGER NOT NULL,
    "orderItemId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "RefundItem_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "shiftId" INTEGER;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "refundedQty" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Refund_refundNumber_key" ON "Refund"("refundNumber");

-- CreateIndex
CREATE INDEX "Refund_orderId_idx" ON "Refund"("orderId");

-- CreateIndex
CREATE INDEX "Refund_createdAt_idx" ON "Refund"("createdAt");

-- CreateIndex
CREATE INDEX "Shift_openedAt_idx" ON "Shift"("openedAt");

-- CreateIndex
CREATE INDEX "Order_shiftId_idx" ON "Order"("shiftId");

-- Only one shift may be open at a time. Prisma cannot express a partial unique
-- index, so it is created here and enforced by the database rather than by a
-- read-then-write check that two registers could race through.
CREATE UNIQUE INDEX "Shift_single_open_idx" ON "Shift"((1)) WHERE "closedAt" IS NULL;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundItem" ADD CONSTRAINT "RefundItem_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "Refund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundItem" ADD CONSTRAINT "RefundItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundItem" ADD CONSTRAINT "RefundItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
