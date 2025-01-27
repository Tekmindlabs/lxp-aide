-- Create profile tables
CREATE TABLE "StudentProfile" (
	"id" TEXT NOT NULL,
	"userId" TEXT NOT NULL,
	"dateOfBirth" TIMESTAMP(3),
	"classId" TEXT,
	"parentId" TEXT,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" TIMESTAMP(3) NOT NULL,
	CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id"),
	CONSTRAINT "StudentProfile_userId_key" UNIQUE ("userId"),
	CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "TeacherProfile" (
	"id" TEXT NOT NULL,
	"userId" TEXT NOT NULL,
	"specialization" TEXT,
	"availability" TEXT,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" TIMESTAMP(3) NOT NULL,
	CONSTRAINT "TeacherProfile_pkey" PRIMARY KEY ("id"),
	CONSTRAINT "TeacherProfile_userId_key" UNIQUE ("userId"),
	CONSTRAINT "TeacherProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "CoordinatorProfile" (
	"id" TEXT NOT NULL,
	"userId" TEXT NOT NULL,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" TIMESTAMP(3) NOT NULL,
	CONSTRAINT "CoordinatorProfile_pkey" PRIMARY KEY ("id"),
	CONSTRAINT "CoordinatorProfile_userId_key" UNIQUE ("userId"),
	CONSTRAINT "CoordinatorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "ParentProfile" (
	"id" TEXT NOT NULL,
	"userId" TEXT NOT NULL,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" TIMESTAMP(3) NOT NULL,
	CONSTRAINT "ParentProfile_pkey" PRIMARY KEY ("id"),
	CONSTRAINT "ParentProfile_userId_key" UNIQUE ("userId"),
	CONSTRAINT "ParentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Add foreign key constraints for relationships between profiles
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_parentId_fkey" 
	FOREIGN KEY ("parentId") REFERENCES "ParentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add coordinatorId column to Program table first
ALTER TABLE "Program" ADD COLUMN "coordinatorId" TEXT;

-- Then add the foreign key constraint
ALTER TABLE "Program" ADD CONSTRAINT "Program_coordinatorId_fkey" 
	FOREIGN KEY ("coordinatorId") REFERENCES "CoordinatorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;