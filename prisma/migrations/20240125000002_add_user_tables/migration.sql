-- Create User type enum
CREATE TYPE "UserType" AS ENUM ('ADMIN', 'COORDINATOR', 'TEACHER', 'STUDENT', 'PARENT');

-- Create User table
CREATE TABLE "User" (
	"id" TEXT NOT NULL,
	"name" TEXT,
	"email" TEXT,
	"emailVerified" TIMESTAMP(3),
	"image" TEXT,
	"password" TEXT,
	"status" "Status" NOT NULL DEFAULT 'ACTIVE',
	"userType" "UserType",
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" TIMESTAMP(3) NOT NULL,
	"deleted" TIMESTAMP(3),
	"dataRetentionDate" TIMESTAMP(3),
	CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
	CONSTRAINT "User_email_key" UNIQUE ("email")
);

-- Update UserRole foreign key
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" 
	FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;