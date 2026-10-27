-- CreateTable
CREATE TABLE "product_price_history" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_price_history_productId_idx" ON "product_price_history"("productId");

-- CreateIndex
CREATE INDEX "product_price_history_createdAt_idx" ON "product_price_history"("createdAt");

-- AddForeignKey
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
