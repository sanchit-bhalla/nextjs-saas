-- CreateEnum
CREATE TYPE "public"."Provider" AS ENUM ('google', 'credentials');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "provider" "public"."Provider" NOT NULL DEFAULT 'credentials',
ALTER COLUMN "password" DROP NOT NULL;
