ALTER TABLE "Product" ADD COLUMN "reorderPoint" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "Product" ADD COLUMN "reorderQty" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "Product" ADD COLUMN "expiryDate" TIMESTAMP(3);

CREATE TABLE "Promotion" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "minQty" INTEGER NOT NULL DEFAULT 1,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductPromotion" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "promotionId" INTEGER NOT NULL,

    CONSTRAINT "ProductPromotion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductPromotion_productId_promotionId_key" ON "ProductPromotion"("productId", "promotionId");

ALTER TABLE "ProductPromotion" ADD CONSTRAINT "ProductPromotion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductPromotion" ADD CONSTRAINT "ProductPromotion_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
