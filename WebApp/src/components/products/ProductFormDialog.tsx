"use client";

import { useEffect } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Product, Category } from "@/lib/types";
import { Combobox } from "@/components/ui/combobox";
import { ImageOff } from "lucide-react";

interface FormData {
  barcode: string;
  name: string;
  description: string;
  costPrice?: number;
  sellPrice: number;
  unit: string;
  imageUrl: string;
  lowStockAt: number;
  categoryId: number;
  initialStock: number;
}

export type { FormData as ProductFormData };

interface Props {
  open: boolean;
  product: Product | null;
  categories: Category[];
  onSave: (data: FormData) => void;
  onClose: () => void;
  loading: boolean;
}

export default function ProductFormDialog({ open, product, categories, onSave, onClose, loading }: Props) {
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>();

  const imageUrl = useWatch({ control, name: "imageUrl", defaultValue: "" });

  useEffect(() => {
    if (product) {
      reset({
        barcode: product.barcode || "",
        name: product.name,
        description: product.description || "",
        costPrice: product.costPrice != null ? parseFloat(product.costPrice) : undefined,
        sellPrice: parseFloat(product.sellPrice),
        unit: product.unit,
        imageUrl: product.imageUrl || "",
        lowStockAt: product.lowStockAt,
        categoryId: product.category.id,
      });
    } else {
      reset({ unit: "ชิ้น", lowStockAt: 5, initialStock: 0, imageUrl: "" });
    }
  }, [product, reset]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSave)} className="space-y-3">
          {/* Image preview */}
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 rounded-2xl border border-white/70 bg-white/40 backdrop-blur-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="preview"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <ImageOff className="w-8 h-8 text-brand-300/60" />
              )}
            </div>
            <div className="flex-1 space-y-2 pt-1">
              <div>
                <label className="text-sm font-medium">URL รูปภาพ</label>
                <Input {...register("imageUrl")} placeholder="https://..." className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">ชื่อสินค้า *</label>
                <Input {...register("name", { required: true })}
                  className={`mt-1 ${errors.name ? "border-red-400" : ""}`} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Barcode</label>
              <Input {...register("barcode")} placeholder="8850..." />
            </div>
            <div>
              <label className="text-sm font-medium">หมวดหมู่ *</label>
              <Controller
                name="categoryId"
                control={control}
                rules={{ required: true, validate: (v) => v > 0 }}
                render={({ field }) => (
                  <Combobox
                    options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
                    value={field.value ? String(field.value) : ""}
                    onChange={(v) => field.onChange(v ? Number(v) : 0)}
                    placeholder="-- เลือกหมวดหมู่ --"
                    searchPlaceholder="ค้นหาหมวดหมู่..."
                    className="w-full"
                  />
                )}
              />
            </div>
            <div>
              <label className="text-sm font-medium">ราคาทุน (บาท)</label>
              <Input type="number" step="0.01" min="0" placeholder="ไม่บังคับ"
                {...register("costPrice", { setValueAs: (v) => v === "" ? undefined : Number(v) })} />
            </div>
            <div>
              <label className="text-sm font-medium">ราคาขาย (บาท) *</label>
              <Input type="number" step="0.01"
                {...register("sellPrice", { required: true, valueAsNumber: true })} />
            </div>
            <div>
              <label className="text-sm font-medium">หน่วย</label>
              <Input {...register("unit")} placeholder="ชิ้น, กล่อง, ขวด..." />
            </div>
            <div>
              <label className="text-sm font-medium">แจ้งเตือนเมื่อเหลือ (ชิ้น)</label>
              <Input type="number" {...register("lowStockAt", { valueAsNumber: true })} />
            </div>
            {!product && (
              <div>
                <label className="text-sm font-medium">ยอด Stock เริ่มต้น</label>
                <Input type="number" {...register("initialStock", { valueAsNumber: true })} />
              </div>
            )}
            <div className="col-span-2">
              <label className="text-sm font-medium">คำอธิบาย</label>
              <Input {...register("description")} />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">ยกเลิก</Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
