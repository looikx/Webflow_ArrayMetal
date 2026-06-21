-- Baseline migration: schema already applied to Supabase
-- This file records the initial state. No SQL is run on migrate deploy
-- because the tables were created via Supabase MCP in the prior session.

-- Enums
CREATE TYPE "Finish" AS ENUM ('HDG', 'SS316', 'SS304', 'PLAIN');
CREATE TYPE "ItemSource" AS ENUM ('IMPORTED', 'CREATED', 'GENERATED');
CREATE TYPE "JobType" AS ENUM ('RECALCULATE', 'GENERATE_VARIANTS', 'EXPORT');
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'DONE', 'FAILED', 'CANCELLED');
CREATE TYPE "AuditAction" AS ENUM ('PRICE_UPDATED', 'ITEM_CREATED', 'ITEM_DEACTIVATED', 'RECALCULATE_STARTED', 'RECALCULATE_DONE', 'VARIANTS_GENERATED', 'EXPORT_GENERATED');

-- Tables
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "finish" "Finish" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "art_no_blocks" (
    "id" SERIAL NOT NULL,
    "blockPrefix" TEXT NOT NULL,
    "productFamily" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "lastArtNo" INTEGER NOT NULL,
    "maxArtNo" INTEGER NOT NULL,
    CONSTRAINT "art_no_blocks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "art_no_blocks_blockPrefix_key" ON "art_no_blocks"("blockPrefix");

CREATE TABLE "items" (
    "id" SERIAL NOT NULL,
    "partNumber" TEXT NOT NULL,
    "artNo" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "widthMm" DOUBLE PRECISION,
    "heightMm" DOUBLE PRECISION,
    "thicknessMm" DOUBLE PRECISION NOT NULL,
    "lengthM" DOUBLE PRECISION,
    "radiusMm" DOUBLE PRECISION,
    "gradeCode" TEXT NOT NULL,
    "source" "ItemSource" NOT NULL DEFAULT 'IMPORTED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "items_partNumber_key" ON "items"("partNumber");
CREATE UNIQUE INDEX "items_artNo_key" ON "items"("artNo");
CREATE INDEX "items_categoryId_idx" ON "items"("categoryId");
CREATE INDEX "items_series_idx" ON "items"("series");
CREATE INDEX "items_productType_idx" ON "items"("productType");
CREATE INDEX "items_categoryId_series_productType_idx" ON "items"("categoryId", "series", "productType");

CREATE TABLE "material_prices" (
    "id" SERIAL NOT NULL,
    "categoryId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "material_prices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "material_prices_categoryId_key_key" ON "material_prices"("categoryId", "key");

CREATE TABLE "price_records" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "materialCost" DOUBLE PRECISION NOT NULL,
    "galvCost" DOUBLE PRECISION NOT NULL,
    "labourCost" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "markupPct" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "pricesSnapshot" JSONB NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "price_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "price_records_itemId_isCurrent_idx" ON "price_records"("itemId", "isCurrent");

CREATE TABLE "product_templates" (
    "id" SERIAL NOT NULL,
    "categoryId" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "allowedWidths" DOUBLE PRECISION[],
    "allowedHeights" DOUBLE PRECISION[],
    "allowedThick" DOUBLE PRECISION[],
    "allowedLengths" DOUBLE PRECISION[],
    "allowedRadii" DOUBLE PRECISION[],
    "gradeCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_templates_categoryId_series_productType_key" ON "product_templates"("categoryId", "series", "productType");

CREATE TABLE "job_records" (
    "id" SERIAL NOT NULL,
    "type" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "categoryId" TEXT,
    "payload" JSONB,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "totalItems" INTEGER,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "resultMsg" TEXT,
    "errorMsg" TEXT,
    "downloadUrl" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "job_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "categoryId" TEXT,
    "priceId" INTEGER,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_categoryId_idx" ON "audit_logs"("categoryId");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

ALTER TABLE "items" ADD CONSTRAINT "items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "material_prices" ADD CONSTRAINT "material_prices_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "price_records" ADD CONSTRAINT "price_records_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_templates" ADD CONSTRAINT "product_templates_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "material_prices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
