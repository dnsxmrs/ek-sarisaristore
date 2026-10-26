-- CreateTable
CREATE TABLE "customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt_record" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "photoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debt_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt_payment" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "debtRecordId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debt_payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_name_idx" ON "customer"("name");

-- CreateIndex
CREATE INDEX "customer_phone_idx" ON "customer"("phone");

-- CreateIndex
CREATE INDEX "debt_record_customerId_idx" ON "debt_record"("customerId");

-- CreateIndex
CREATE INDEX "debt_record_status_idx" ON "debt_record"("status");

-- CreateIndex
CREATE INDEX "debt_payment_customerId_idx" ON "debt_payment"("customerId");

-- CreateIndex
CREATE INDEX "debt_payment_debtRecordId_idx" ON "debt_payment"("debtRecordId");

-- AddForeignKey
ALTER TABLE "debt_record" ADD CONSTRAINT "debt_record_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payment" ADD CONSTRAINT "debt_payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payment" ADD CONSTRAINT "debt_payment_debtRecordId_fkey" FOREIGN KEY ("debtRecordId") REFERENCES "debt_record"("id") ON DELETE SET NULL ON UPDATE CASCADE;
