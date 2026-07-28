import { prisma } from "../../lib/prisma";

export async function upsertFollower(lineUserId: string, displayName: string | null) {
  return prisma.lineFollower.upsert({
    where: { lineUserId },
    update: { displayName, isActive: true, unfollowedAt: null },
    create: { lineUserId, displayName, isActive: true },
  });
}

export async function markUnfollowed(lineUserId: string) {
  return prisma.lineFollower.updateMany({
    where: { lineUserId },
    data: { isActive: false, unfollowedAt: new Date() },
  });
}

export async function listFollowers() {
  return prisma.lineFollower.findMany({ orderBy: { followedAt: "desc" } });
}
