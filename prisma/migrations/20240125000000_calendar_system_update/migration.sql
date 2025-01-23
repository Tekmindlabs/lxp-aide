-- Drop existing constraints and tables
DROP TABLE IF EXISTS "Event";
DROP TABLE IF EXISTS "Calendar";

-- Create new Calendar table with enhanced fields
CREATE TYPE "CalendarType" AS ENUM ('PRIMARY', 'SECONDARY', 'EXAM', 'ACTIVITY');
CREATE TYPE "Visibility" AS ENUM ('ALL', 'STAFF', 'STUDENTS', 'PARENTS');

CREATE TABLE "Calendar" (
	"id" TEXT NOT NULL,
	"name" TEXT NOT NULL,
	"description" TEXT,
	"startDate" TIMESTAMP(3) NOT NULL,
	"endDate" TIMESTAMP(3) NOT NULL,
	"type" "CalendarType" NOT NULL DEFAULT 'PRIMARY',
	"status" "Status" NOT NULL DEFAULT 'ACTIVE',
	"isDefault" BOOLEAN NOT NULL DEFAULT false,
	"visibility" "Visibility" NOT NULL DEFAULT 'ALL',
	"metadata" JSONB,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" TIMESTAMP(3) NOT NULL,

	CONSTRAINT "Calendar_pkey" PRIMARY KEY ("id")
);

-- Create new Event table with enhanced fields
CREATE TABLE "Event" (
	"id" TEXT NOT NULL,
	"title" TEXT NOT NULL,
	"description" TEXT,
	"eventType" "EventType" NOT NULL,
	"startDate" TIMESTAMP(3) NOT NULL,
	"endDate" TIMESTAMP(3) NOT NULL,
	"calendarId" TEXT NOT NULL,
	"status" "Status" NOT NULL DEFAULT 'ACTIVE',
	"priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
	"visibility" "Visibility" NOT NULL DEFAULT 'ALL',
	"recurrence" JSONB,
	"metadata" JSONB,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" TIMESTAMP(3) NOT NULL,

	CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "Event" ADD CONSTRAINT "Event_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "Calendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update Program table to use new Calendar relation
ALTER TABLE "Program" DROP CONSTRAINT IF EXISTS "Program_academicYearId_fkey";
ALTER TABLE "Program" DROP COLUMN IF EXISTS "academicYearId";
ALTER TABLE "Program" ADD COLUMN "calendarId" TEXT NOT NULL;
ALTER TABLE "Program" ADD CONSTRAINT "Program_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "Calendar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Update Term table to use new Calendar relation
ALTER TABLE "Term" DROP CONSTRAINT IF EXISTS "Term_academicYearId_fkey";
ALTER TABLE "Term" DROP COLUMN IF EXISTS "academicYearId";
ALTER TABLE "Term" ADD COLUMN "calendarId" TEXT NOT NULL;
ALTER TABLE "Term" ADD CONSTRAINT "Term_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "Calendar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX "Calendar_type_idx" ON "Calendar"("type");
CREATE INDEX "Calendar_status_idx" ON "Calendar"("status");
CREATE INDEX "Calendar_isDefault_idx" ON "Calendar"("isDefault");
CREATE INDEX "Event_calendarId_idx" ON "Event"("calendarId");
CREATE INDEX "Event_eventType_idx" ON "Event"("eventType");
CREATE INDEX "Event_status_idx" ON "Event"("status");
CREATE INDEX "Event_startDate_endDate_idx" ON "Event"("startDate", "endDate");