-- AlterTable
ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "overdueEscalatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ComplaintAttachment" ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT;
ALTER TABLE "ComplaintAttachment" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ComplaintHistory" ADD COLUMN IF NOT EXISTS "eventType" TEXT NOT NULL DEFAULT 'STATUS';

-- CreateTable
CREATE TABLE IF NOT EXISTS "ComplaintNote" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplaintNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ComplaintNote_complaintId_idx" ON "ComplaintNote"("complaintId");

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "ComplaintNote" ADD CONSTRAINT "ComplaintNote_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
 ALTER TABLE "ComplaintNote" ADD CONSTRAINT "ComplaintNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
