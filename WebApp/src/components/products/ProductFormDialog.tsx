"use client";

import { useEffect } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Product, Category } from "@/lib/types";
import { Combobox } from "@/components/ui/combobox";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface FormData {
  barcode: string;
  name: string;
  description: string;
  sellPrice: number;
  unit: string;
  imageUrl: string;
  categoryId: number;
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
        sellPrice: parseFloat(product.sellPrice),
        unit: product.unit,
        imageUrl: product.imageUrl || "",
        categoryId: product.category.id,
      });
    } else {
      reset({ unit: "ชิ้น", imageUrl: "" });
    }
  }, [product, reset]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
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
            <div className="flex-1 space-y-2.5 pt-1">
              <div>
                <label htmlFor="pf-imageUrl" className="text-sm font-medium">URL รูปภาพ</label>
                <Input id="pf-imageUrl" {...register("imageUrl")} placeholder="https://..." className="mt-1" />
              </div>
              <div>
                <label htmlFor="pf-name" className="text-sm font-medium">ชื่อสินค้า *</label>
                <Input
                  id="pf-name"
                  {...register("name", { required: true })}
                  aria-invalid={!!errors.name}
                  className={cn("mt-1", errors.name && "border-red-400 focus-visible:ring-red-400/40")}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">กรุณากรอกชื่อสินค้า</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-3.5">
            <div>
              <label htmlFor="pf-barcode" className="text-sm font-medium">Barcode</label>
              <Input id="pf-barcode" {...register("barcode")} placeholder="8850..." className="mt-1" />
            </div>
            <div>
              <label htmlFor="pf-categoryId" className="text-sm font-medium">หมวดหมู่ *</label>
              <Controller
                name="categoryId"
                control={control}
                rules={{ required: true, validate: (v) => v > 0 }}
                render={({ field }) => (
                  <Combobox
                    id="pf-categoryId"
                    options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
                    value={field.value ? String(field.value) : ""}
                    onChange={(v) => field.onChange(v ? Number(v) : 0)}
                    placeholder="-- เลือกหมวดหมู่ --"
                    searchPlaceholder="ค้นหาหมวดหมู่..."
                    className={cn("mt-1 w-full", errors.categoryId && "border-red-400")}
                  />
                )}
              />
              {errors.categoryId && <p className="mt-1 text-xs text-red-500">กรุณาเลือกหมวดหมู่</p>}
            </div>
            <div>
              <label htmlFor="pf-sellPrice" className="text-sm font-medium">ราคาขาย (บาท) *</label>
              <Input
                id="pf-sellPrice"
                type="number"
                step="0.01"
                {...register("sellPrice", { required: true, valueAsNumber: true })}
                aria-invalid={!!errors.sellPrice}
                className={cn("mt-1", errors.sellPrice && "border-red-400 focus-visible:ring-red-400/40")}
              />
              {errors.sellPrice && <p className="mt-1 text-xs text-red-500">กรุณากรอกราคาขาย</p>}
            </div>
            <div>
              <label htmlFor="pf-unit" className="text-sm font-medium">หน่วย</label>
              <Input id="pf-unit" {...register("unit")} placeholder="ชิ้น, กล่อง, ขวด..." className="mt-1" />
            </div>
            <div className="col-span-2">
              <label htmlFor="pf-description" className="text-sm font-medium">คำอธิบาย</label>
              <Input id="pf-description" {...register("description")} className="mt-1" />
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
