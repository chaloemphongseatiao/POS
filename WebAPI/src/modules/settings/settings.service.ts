import { prisma } from "../../lib/prisma";

export async function getSettings() {
  const settings = await prisma.setting.findMany();
  return Object.fromEntries(settings.map((s) => [s.key, s.value]));
}

const PUBLIC_SETTING_KEYS = ["store_name", "store_logo"];

export async function getPublicSettings() {
  const settings = await prisma.setting.findMany({
    where: { key: { in: PUBLIC_SETTING_KEYS } },
  });
  return Object.fromEntries(settings.map((s) => [s.key, s.value]));
}

export async function upsertSetting(key: string, value: string) {
  return prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
