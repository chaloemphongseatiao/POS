import { prisma } from "../../lib/prisma";
import { fetchFollowerIds, fetchLineProfile, getLineChannelToken } from "../../lib/line";
import { createError } from "../../middleware/errorHandler";

export async function upsertFollower(lineUserId: string, displayName: string | null) {
  return prisma.lineFollower.upsert({
    where: { lineUserId },
    update: { displayName, isActive: true, unfollowedAt: null },
    create: { lineUserId, displayName, isActive: true },
  });
}

export async function findFollower(lineUserId: string) {
  return prisma.lineFollower.findUnique({ where: { lineUserId } });
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

export async function syncFollowersFromLine() {
  const token = await getLineChannelToken();
  if (!token) throw createError("ยังไม่ได้ตั้งค่า Channel Access Token", 400);

  let ids: string[];
  try {
    ids = await fetchFollowerIds(token);
  } catch (err) {
    throw createError(err instanceof Error ? err.message : "ดึงรายชื่อผู้ติดตามไม่สำเร็จ", 502);
  }

  let added = 0;
  for (const lineUserId of ids) {
    const existing = await findFollower(lineUserId);
    const profile = await fetchLineProfile(lineUserId, token);
    await upsertFollower(lineUserId, profile?.displayName ?? existing?.displayName ?? null);
    if (!existing) added += 1;
  }

  return { total: ids.length, added };
}
