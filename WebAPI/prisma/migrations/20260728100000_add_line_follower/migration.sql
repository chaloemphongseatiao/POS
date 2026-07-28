-- CreateTable
CREATE TABLE "LineFollower" (
    "id" SERIAL NOT NULL,
    "lineUserId" TEXT NOT NULL,
    "displayName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "followedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unfollowedAt" TIMESTAMP(3),

    CONSTRAINT "LineFollower_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LineFollower_lineUserId_key" ON "LineFollower"("lineUserId");
