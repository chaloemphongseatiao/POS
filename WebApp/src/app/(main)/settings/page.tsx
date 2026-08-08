"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings, upsertSetting } from "@/lib/api/settings";
import { listUsers, createUser, updateUser, toggleUser } from "@/lib/api/users";
import { listCategories, createCategory, updateCategory, deleteCategory } from "@/lib/api/categories";
import { listLineFollowers } from "@/lib/api/line";
import { User, Category, UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCategoryCounts } from "@/lib/hooks/useCategoryCounts";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, CheckCircle2, AlertCircle, AlertTriangle, ImagePlus, X, Loader2, Copy, Check } from "lucide-react";

function UsersTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ username: "", password: "", displayName: "", role: "CASHIER" as UserRole });

  const { data: users = [], isLoading: isUsersLoading } = useQuery({ queryKey: ["users"], queryFn: listUsers });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> & { password?: string } }) =>
      updateUser(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); setShowForm(false); setEditUser(null); },
  });

  const toggleMutation = useMutation({
    mutationFn: toggleUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (editUser) {
      updateMutation.mutate({ id: editUser.id, data: { displayName: form.displayName, role: form.role, password: form.password || undefined } });
    } else {
      createMutation.mutate(form);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>ผู้ใช้งาน</CardTitle>
        <Button size="sm" onClick={() => { setEditUser(null); setForm({ username: "", password: "", displayName: "", role: "CASHIER" }); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" />เพิ่ม
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-white/50">
              <th className="text-left py-2 font-medium text-slate-500">ชื่อ</th>
              <th className="text-left py-2 font-medium text-slate-500">Username</th>
              <th className="text-left py-2 font-medium text-slate-500">บทบาท</th>
              <th className="text-center py-2 font-medium text-slate-500">สถานะ</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/40">
            {isUsersLoading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">กำลังโหลด...</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="glass-row-hover transition-colors">
                <td className="py-2.5 font-medium">{u.displayName}</td>
                <td className="py-2.5 text-gray-500">{u.username}</td>
                <td className="py-2.5">
                  <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                    {u.role === "ADMIN" ? "Admin" : "Cashier"}
                  </Badge>
                </td>
                <td className="py-2.5 text-center">
                  <Badge variant={u.isActive ? "success" : "secondary"}>
                    {u.isActive ? "ใช้งาน" : "ปิด"}
                  </Badge>
                </td>
                <td className="py-2.5">
                  <div className="flex gap-1 justify-end">
                    <Button aria-label={`แก้ไขผู้ใช้ ${u.displayName}`} size="icon" variant="ghost" onClick={() => {
                      setEditUser(u);
                      setForm({ username: u.username, password: "", displayName: u.displayName, role: u.role });
                      setShowForm(true);
                    }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button aria-label={`${u.isActive ? "ปิด" : "เปิด"}ผู้ใช้ ${u.displayName}`} size="icon" variant="ghost" onClick={() => toggleMutation.mutate(u.id)}>
                      {u.isActive ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>{editUser ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้ใหม่"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSave} className="space-y-3">
              {!editUser && (
                <div>
                  <label className="text-sm font-medium">Username *</label>
                  <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                </div>
              )}
              <div>
                <label className="text-sm font-medium">ชื่อที่แสดง *</label>
                <Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium">รหัสผ่าน {editUser ? "(เว้นว่างถ้าไม่เปลี่ยน)" : "*"}</label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editUser} />
              </div>
              <div>
                <label htmlFor="user-role" className="text-sm font-medium">บทบาท</label>
                <select
                  id="user-role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  className="flex h-10 w-full rounded-xl border border-white/75 bg-white/55 px-3.5 py-2 text-sm shadow-sm shadow-brand-200/20 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40"
                >
                  <option value="CASHIER">Cashier (แคชเชียร์)</option>
                  <option value="ADMIN">Admin (ผู้ดูแล)</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">ยกเลิก</Button>
                <Button type="submit" className="flex-1">บันทึก</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function CategoriesTab() {
  const qc = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const { counts } = useCategoryCounts();

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); setNewName(""); setShowAddDialog(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateCategory(id, name),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); setEditCat(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>หมวดหมู่สินค้า</CardTitle>
        <Button size="sm" onClick={() => { setNewName(""); setShowAddDialog(true); }}>
          <Plus className="w-4 h-4 mr-1" />เพิ่มหมวดหมู่
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {isCategoriesLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">กำลังโหลด...</span>
          </div>
        ) : categories.map((c) => {
          const count = counts.get(c.id) ?? { total: 0, activeCount: 0 };
          return (
            <div key={c.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/50 border border-white/70">
              {editCat?.id === c.id ? (
                <>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 h-8" autoFocus />
                  <Button size="sm" onClick={() => updateMutation.mutate({ id: c.id, name: editName })}>บันทึก</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditCat(null)}>ยกเลิก</Button>
                </>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.name}</p>
                    <p className="text-xs text-slate-400">{count.total} รายการ</p>
                  </div>
                  <Badge variant={count.activeCount > 0 ? "success" : "secondary"}>
                    {count.activeCount > 0 ? "Active" : "Inactive"}
                  </Badge>
                  <Button aria-label={`แก้ไขหมวดหมู่ ${c.name}`} size="icon" variant="ghost" onClick={() => { setEditCat(c); setEditName(c.name); }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    aria-label={`ลบหมวดหมู่ ${c.name}`}
                    size="icon"
                    variant="ghost"
                    className="text-red-400 hover:text-red-600"
                    onClick={() => setDeleteTarget(c)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>
          );
        })}

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>เพิ่มหมวดหมู่ใหม่</DialogTitle></DialogHeader>
            <form
              onSubmit={(e) => { e.preventDefault(); if (newName) createMutation.mutate(newName); }}
              className="space-y-3"
            >
              <div>
                <label className="text-sm font-medium">ชื่อหมวดหมู่ *</label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} required autoFocus />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">ยกเลิก</Button>
                <Button type="submit" className="flex-1" disabled={!newName || createMutation.isPending}>
                  {createMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                ยืนยันการลบหมวดหมู่
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 text-sm text-gray-600">
              <p>ต้องการลบหมวดหมู่</p>
              <p className="mt-1 font-semibold text-gray-900">"{deleteTarget?.name}"</p>
              <p className="mt-3 text-xs text-gray-400">หากมีสินค้าอยู่ในหมวดหมู่นี้ อาจไม่สามารถลบได้</p>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>
                ยกเลิก
              </Button>
              <Button
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (deleteTarget) deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
                }}
              >
                {deleteMutation.isPending ? "กำลังลบ..." : "ยืนยันลบ"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function StoreTab() {
  const qc = useQueryClient();
  const { data: settings = {}, isLoading: isSettingsLoading } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storeLogo, setStoreLogo] = useState("");
  const [logoError, setLogoError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStoreName(settings.store_name ?? "");
    setStoreAddress(settings.store_address ?? "");
    setStoreLogo(settings.store_logo ?? "");
  }, [settings.store_name, settings.store_address, settings.store_logo]);

  const mutation = useMutation({
    mutationFn: async () => {
      await upsertSetting("store_name", storeName);
      await upsertSetting("store_address", storeAddress);
      await upsertSetting("store_logo", storeLogo);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoError("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setLogoError("รองรับไฟล์ PNG, JPEG และ WebP เท่านั้น");
      event.target.value = "";
      return;
    }
    if (file.size > 1024 * 1024) {
      setLogoError("ไฟล์โลโก้ต้องมีขนาดไม่เกิน 1 MB");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setStoreLogo(String(reader.result));
    reader.onerror = () => setLogoError("อ่านไฟล์ไม่สำเร็จ");
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setStoreLogo("");
    setLogoError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (isSettingsLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>ข้อมูลร้านค้า</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">กำลังโหลด...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>ข้อมูลร้านค้า</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">โลโก้ร้านค้า</label>
          <div className="mt-2 flex items-center gap-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed bg-gray-50">
              {storeLogo ? (
                <img src={storeLogo} alt="ตัวอย่างโลโก้ร้านค้า" className="h-full w-full object-contain p-2" />
              ) : (
                <ImagePlus className="h-8 w-8 text-gray-300" />
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleLogoChange}
                className="block rounded-xl text-sm text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:opacity-90"
              />
              <p className="text-xs text-gray-500">PNG, JPEG หรือ WebP ขนาดไม่เกิน 1 MB</p>
              {storeLogo && (
                <Button type="button" size="sm" variant="outline" onClick={removeLogo}>
                  <X className="mr-1 h-3.5 w-3.5" /> ลบโลโก้
                </Button>
              )}
            </div>
          </div>
          {logoError && <p className="mt-2 text-sm text-red-600">{logoError}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">ชื่อร้าน</label>
          <Input
            value={storeName}
            placeholder="ชื่อร้าน"
            onChange={(e) => setStoreName(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">ที่อยู่</label>
          <Input
            value={storeAddress}
            placeholder="ที่อยู่ร้าน"
            onChange={(e) => setStoreAddress(e.target.value)}
            className="mt-1"
          />
        </div>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
      </CardContent>
    </Card>
  );
}

function extractApiError(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string } } })?.response?.data;
  if (data?.message) return data.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function LineTab() {
  const qc = useQueryClient();
  const { data: settings = {}, isLoading: isSettingsLoading } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const { data: followers = [], isLoading: isFollowersLoading } = useQuery({ queryKey: ["line-followers"], queryFn: listLineFollowers });
  const [token, setToken] = useState("");
  const [secret, setSecret] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [testDetail, setTestDetail] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const recipients = (userId ?? settings.line_user_id ?? "")
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  function addRecipient(lineUserId: string) {
    if (recipients.includes(lineUserId)) return;
    setUserId([...recipients, lineUserId].join(", "));
  }

  const webhookUrl = `${process.env.NEXT_PUBLIC_API_URL || ""}/api/line/webhook`;

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (token) await upsertSetting("line_channel_token", token);
      if (secret) await upsertSetting("line_channel_secret", secret);
      if (userId !== null) await upsertSetting("line_user_id", userId);
    },
    onMutate: () => setSaveError(null),
    onSuccess: () => { setUserId(null); qc.invalidateQueries({ queryKey: ["settings"] }); },
    onError: (err: unknown) => setSaveError(extractApiError(err, "บันทึกไม่สำเร็จ")),
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings/line-test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("pos_token")}`,
        },
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message || body?.error || `ส่งไม่สำเร็จ (HTTP ${res.status})`);
      return body as { ok: boolean; results: { userId: string; ok: boolean; error?: string }[] };
    },
    onMutate: () => setTestDetail(null),
    onSuccess: (data) => {
      const failed = (data?.results ?? []).filter((r) => !r.ok);
      if (failed.length > 0) {
        setTestResult("error");
        setTestDetail(failed.map((r) => `${r.userId} → ${r.error}`).join("\n"));
      } else {
        setTestResult("success");
        setTestDetail(`ส่งสำเร็จ ${data?.results?.length ?? 0} ปลายทาง`);
      }
      setTimeout(() => { setTestResult(null); setTestDetail(null); }, 10000);
    },
    onError: (err: unknown) => {
      setTestResult("error");
      setTestDetail(err instanceof Error ? err.message : String(err));
      setTimeout(() => { setTestResult(null); setTestDetail(null); }, 10000);
    },
  });

  const hasConfig = !!(settings.line_channel_token && settings.line_user_id);

  if (isSettingsLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>LINE แจ้งเตือน</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">กำลังโหลด...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>LINE แจ้งเตือน</span>
          {hasConfig && <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full">เชื่อมต่อแล้ว</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* วิธีตั้งค่า */}
        <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 text-sm text-brand-800 space-y-1.5">
          <p className="font-semibold">วิธีขอ Channel Access Token / Secret:</p>
          <ol className="list-decimal list-inside space-y-1 text-brand-700">
            <li>ไปที่ <span className="font-mono">developers.line.biz</span> → สร้าง Provider + Channel (Messaging API)</li>
            <li>แท็บ <strong>Messaging API</strong> → เลื่อนลงไปที่ Channel access token → <strong>Issue</strong></li>
            <li>แท็บ <strong>Basic settings</strong> → คัดลอก <strong>Channel secret</strong></li>
          </ol>
          <p className="font-semibold mt-2">วิธีเก็บ User ID ของลูกค้าอัตโนมัติ:</p>
          <ol className="list-decimal list-inside space-y-1 text-brand-700">
            <li>วาง Channel Secret ด้านล่าง แล้วบันทึก</li>
            <li>คัดลอก Webhook URL ด้านล่าง ไปวางที่แท็บ <strong>Messaging API</strong> → Webhook URL → เปิด <strong>Use webhook</strong></li>
            <li>เมื่อมีคน add friend บอท ระบบจะเก็บ User ID ให้อัตโนมัติในรายชื่อด้านล่าง</li>
          </ol>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Channel Access Token</label>
            <Input
              type="password"
              placeholder={settings.line_channel_token ? "••••••••••••••••" : "วาง token ที่นี่..."}
              onChange={(e) => setToken(e.target.value)}
              className="mt-1 font-mono text-xs"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Channel Secret</label>
            <Input
              type="password"
              placeholder={settings.line_channel_secret ? "••••••••••••••••" : "วาง channel secret ที่นี่..."}
              onChange={(e) => setSecret(e.target.value)}
              className="mt-1 font-mono text-xs"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Webhook URL</label>
            <div className="mt-1 flex gap-2">
              <Input readOnly value={webhookUrl} className="font-mono text-xs bg-gray-50" />
              <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(webhookUrl, "webhook")}>
                {copiedField === "webhook" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">User ID (ผู้รับแจ้งเตือน)</label>
            <textarea
              placeholder="U1234567890abcdef..., U0987654321fedcba..."
              value={userId ?? settings.line_user_id ?? ""}
              onChange={(e) => setUserId(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-white/70 bg-white/60 px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <p className="mt-1 text-xs text-gray-500">
              ใส่ได้หลายคน คั่นด้วยเครื่องหมายจุลภาค (,) หรือขึ้นบรรทัดใหม่ — กด “เพิ่ม” ที่รายชื่อผู้ติดตามด้านล่างได้
            </p>
            {recipients.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">ผู้รับปัจจุบัน: {recipients.length} คน</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || (!token && !secret && userId === null)}
            className="flex-1"
          >
            {saveMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
          {hasConfig && (
            <Button
              variant="outline"
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
            >
              {testMutation.isPending ? "กำลังส่ง..." : "ทดสอบส่ง"}
            </Button>
          )}
        </div>

        {saveError && (
          <div className="flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="break-all">{saveError}</span>
          </div>
        )}

        {testResult === "success" && (
          <div className="flex items-start gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              ส่งข้อความทดสอบสำเร็จ! ตรวจสอบ LINE ของคุณ
              {testDetail && <span className="block text-xs opacity-80">{testDetail}</span>}
            </span>
          </div>
        )}
        {testResult === "error" && (
          <div className="flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              ส่งไม่สำเร็จ — ตรวจสอบ Token และ User ID อีกครั้ง
              {testDetail && (
                <span className="block mt-1 whitespace-pre-wrap break-all font-mono text-xs opacity-80">{testDetail}</span>
              )}
            </span>
          </div>
        )}

        <div className="pt-2 border-t border-white/60">
          <p className="text-sm font-medium mb-2">รายชื่อผู้ติดตาม (Followers)</p>
          {isFollowersLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">กำลังโหลด...</span>
            </div>
          ) : followers.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              ยังไม่มีผู้ติดตาม — ตั้งค่า Webhook URL ด้านบนก่อน แล้วให้ลูกค้า add friend บอท
            </p>
          ) : (
            <div className="space-y-2">
              {followers.map((f) => (
                <div key={f.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/50 border border-white/70">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{f.displayName || "(ไม่มีชื่อ)"}</p>
                    <p className="text-xs text-gray-400 font-mono truncate">{f.lineUserId}</p>
                  </div>
                  <Badge variant={f.isActive ? "success" : "secondary"}>
                    {f.isActive ? "ติดตามอยู่" : "เลิกติดตาม"}
                  </Badge>
                  {recipients.includes(f.lineUserId) ? (
                    <Badge variant="success">รับแจ้งเตือน</Badge>
                  ) : (
                    <Button type="button" size="sm" variant="outline" onClick={() => addRecipient(f.lineUserId)}>
                      เพิ่ม
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(f.lineUserId, `follower-${f.id}`)}
                  >
                    {copiedField === `follower-${f.id}` ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function OverviewTab() {
  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr] lg:items-start">
      <StoreTab />
      <CategoriesTab />
    </div>
  );
}

const TABS = ["ภาพรวม", "ผู้ใช้งาน", "LINE แจ้งเตือน"];

export default function SettingsPage() {
  const [tab, setTab] = useState(0);
  return (
    <div className="page-shell">
      <div>
        <h1 className="page-title">ตั้งค่าร้านค้า</h1>
        <p className="page-description">Store Settings</p>
      </div>
      <div className="glass inline-flex gap-1 rounded-2xl p-1.5" role="tablist" aria-label="หมวดการตั้งค่า">
        {TABS.map((t, i) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === i}
            onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
              tab === i
                ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25"
                : "text-slate-600 hover:bg-white/60"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 0 && <OverviewTab />}
      {tab === 1 && <UsersTab />}
      {tab === 2 && <LineTab />}
    </div>
  );
}
