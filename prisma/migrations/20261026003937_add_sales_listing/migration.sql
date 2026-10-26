-- CreateTable
CREATE TABLE "sale_transaction" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "cashReceived" DECIMAL(12,2) NOT NULL,
    "changeAmount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sale_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_item" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT,
    "productNameSnapshot" TEXT NOT NULL,
    "unitPriceSnapshot" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "sale_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sale_transaction_receiptNumber_key" ON "sale_transaction"("receiptNumber");

-- CreateIndex
CREATE INDEX "sale_transaction_createdAt_idx" ON "sale_transaction"("createdAt");

-- CreateIndex
CREATE INDEX "sale_transaction_receiptNumber_idx" ON "sale_transaction"("receiptNumber");

-- CreateIndex
CREATE INDEX "sale_item_saleId_idx" ON "sale_item"("saleId");

-- CreateIndex
CREATE INDEX "sale_item_productId_idx" ON "sale_item"("productId");

-- AddForeignKey
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sale_transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
