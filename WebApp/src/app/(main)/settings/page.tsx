"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings, upsertSetting } from "@/lib/api/settings";
import { listUsers, createUser, updateUser, toggleUser } from "@/lib/api/users";
import { listCategories, createCategory, updateCategory, deleteCategory } from "@/lib/api/categories";
import { User, Category, UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, CheckCircle2, AlertCircle, AlertTriangle, ImagePlus, X } from "lucide-react";

function UsersTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ username: "", password: "", displayName: "", role: "CASHIER" as UserRole });

  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: listUsers });

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
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 font-medium text-gray-500">ชื่อ</th>
              <th className="text-left py-2 font-medium text-gray-500">Username</th>
              <th className="text-left py-2 font-medium text-gray-500">บทบาท</th>
              <th className="text-center py-2 font-medium text-gray-500">สถานะ</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
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
                    <Button size="icon" variant="ghost" onClick={() => {
                      setEditUser(u);
                      setForm({ username: u.username, password: "", displayName: u.displayName, role: u.role });
                      setShowForm(true);
                    }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => toggleMutation.mutate(u.id)}>
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
                <label className="text-sm font-medium">บทบาท</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
  const [newName, setNewName] = useState("");
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: listCategories });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); setNewName(""); },
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
      <CardHeader><CardTitle>หมวดหมู่สินค้า</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="ชื่อหมวดหมู่ใหม่..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && newName && createMutation.mutate(newName)}
          />
          <Button onClick={() => newName && createMutation.mutate(newName)} disabled={!newName}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-2 p-2 border rounded-lg">
              {editCat?.id === c.id ? (
                <>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 h-8" autoFocus />
                  <Button size="sm" onClick={() => updateMutation.mutate({ id: c.id, name: editName })}>บันทึก</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditCat(null)}>ยกเลิก</Button>
                </>
              ) : (
                <>
                  <span className="flex-1">{c.name}</span>
                  <Button size="icon" variant="ghost" onClick={() => { setEditCat(c); setEditName(c.name); }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
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
          ))}
        </div>

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
  const { data: settings = {} } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
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
                className="block text-sm text-gray-500 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:opacity-90"
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

function LineTab() {
  const qc = useQueryClient();
  const { data: settings = {} } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const [token, setToken] = useState("");
  const [userId, setUserId] = useState("");
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await upsertSetting("line_channel_token", token);
      await upsertSetting("line_user_id", userId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
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
      if (!res.ok) throw new Error("ส่งไม่สำเร็จ");
    },
    onSuccess: () => { setTestResult("success"); setTimeout(() => setTestResult(null), 4000); },
    onError: () => { setTestResult("error"); setTimeout(() => setTestResult(null), 4000); },
  });

  const hasConfig = !!(settings.line_channel_token && settings.line_user_id);

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
          <p className="font-semibold">วิธีขอ Channel Access Token:</p>
          <ol className="list-decimal list-inside space-y-1 text-brand-700">
            <li>ไปที่ <span className="font-mono">developers.line.biz</span> → สร้าง Provider + Channel (Messaging API)</li>
            <li>แท็บ <strong>Messaging API</strong> → เลื่อนลงไปที่ Channel access token → <strong>Issue</strong></li>
            <li>แท็บ <strong>Basic settings</strong> → เปิด <strong>LINE Official Account Manager</strong> → ตั้งค่า Reply/Push</li>
          </ol>
          <p className="font-semibold mt-2">วิธีหา User ID:</p>
          <ol className="list-decimal list-inside space-y-1 text-brand-700">
            <li>เพิ่มบอทเป็นเพื่อน แล้วส่งข้อความใดก็ได้</li>
            <li>ดู Webhook event → ใช้ <span className="font-mono">source.userId</span></li>
            <li>หรือใช้ LINE Developers Console → <strong>Basic settings</strong> → Your user ID</li>
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
            <label className="text-sm font-medium">User ID (ผู้รับแจ้งเตือน)</label>
            <Input
              placeholder={settings.line_user_id || "U1234567890abcdef..."}
              defaultValue={settings.line_user_id}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 font-mono text-xs"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || (!token && !userId)}
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

        {testResult === "success" && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            ส่งข้อความทดสอบสำเร็จ! ตรวจสอบ LINE ของคุณ
          </div>
        )}
        {testResult === "error" && (
          <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
            <AlertCircle className="w-4 h-4" />
            ส่งไม่สำเร็จ — ตรวจสอบ Token และ User ID อีกครั้ง
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const TABS = ["ผู้ใช้งาน", "หมวดหมู่", "ข้อมูลร้านค้า", "LINE แจ้งเตือน"];

export default function SettingsPage() {
  const [tab, setTab] = useState(0);
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">ตั้งค่า</h1>
      <div className="flex gap-2 border-b">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === i ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 0 && <UsersTab />}
      {tab === 1 && <CategoriesTab />}
      {tab === 2 && <StoreTab />}
      {tab === 3 && <LineTab />}
    </div>
  );
}
