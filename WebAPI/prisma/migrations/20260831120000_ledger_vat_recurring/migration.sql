-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN     "hasVat" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurringId" INTEGER,
ADD COLUMN     "vatRate" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "RecurringEntry" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "hasVat" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "frequency" TEXT NOT NULL,
    "dayOf" INTEGER NOT NULL DEFAULT 1,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "RecurringEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_recurringId_entryDate_key" ON "LedgerEntry"("recurringId", "entryDate");

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_recurringId_fkey" FOREIGN KEY ("recurringId") REFERENCES "RecurringEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringEntry" ADD CONSTRAINT "RecurringEntry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LedgerCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
