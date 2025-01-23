-- Create ENUM types
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "CalendarType" AS ENUM ('PRIMARY', 'SECONDARY', 'EXAM', 'ACTIVITY');
CREATE TYPE "Visibility" AS ENUM ('ALL', 'STAFF', 'STUDENTS', 'PARENTS');
CREATE TYPE "Priority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "EventType" AS ENUM ('ACADEMIC', 'HOLIDAY', 'EXAM', 'ACTIVITY', 'OTHER');

-- Create tables
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

CREATE TABLE "Program" (
	"id" TEXT NOT NULL,
	"name" TEXT NOT NULL,
	"description" TEXT,
	"status" "Status" NOT NULL DEFAULT 'ACTIVE',
	"calendarId" TEXT NOT NULL,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" TIMESTAMP(3) NOT NULL,
	CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Term" (
	"id" TEXT NOT NULL,
	"name" TEXT NOT NULL,
	"calendarId" TEXT NOT NULL,
	"startDate" TIMESTAMP(3) NOT NULL,
	"endDate" TIMESTAMP(3) NOT NULL,
	"status" "Status" NOT NULL DEFAULT 'ACTIVE',
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" TIMESTAMP(3) NOT NULL,
	CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "Event" ADD CONSTRAINT "Event_calendarId_fkey" 
	FOREIGN KEY ("calendarId") REFERENCES "Calendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Program" ADD CONSTRAINT "Program_calendarId_fkey" 
	FOREIGN KEY ("calendarId") REFERENCES "Calendar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Term" ADD CONSTRAINT "Term_calendarId_fkey" 
	FOREIGN KEY ("calendarId") REFERENCES "Calendar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add unique constraints
ALTER TABLE "Calendar" ADD CONSTRAINT "Calendar_name_type_key" UNIQUE ("name", "type");
ALTER TABLE "Program" ADD CONSTRAINT "Program_name_key" UNIQUE ("name");
ALTER TABLE "Term" ADD CONSTRAINT "Term_name_calendarId_key" UNIQUE ("name", "calendarId");
ALTER TABLE "Event" ADD CONSTRAINT "Event_title_calendarId_key" UNIQUE ("title", "calendarId");

-- Create indexes
CREATE INDEX "Calendar_type_idx" ON "Calendar"("type");
CREATE INDEX "Calendar_status_idx" ON "Calendar"("status");
CREATE INDEX "Calendar_isDefault_idx" ON "Calendar"("isDefault");
CREATE INDEX "Event_calendarId_idx" ON "Event"("calendarId");
CREATE INDEX "Event_eventType_idx" ON "Event"("eventType");
CREATE INDEX "Event_status_idx" ON "Event"("status");
CREATE INDEX "Event_startDate_endDate_idx" ON "Event"("startDate", "endDate");