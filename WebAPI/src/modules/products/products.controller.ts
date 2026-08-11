import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import * as svc from "./products.service";
import { parseDataImage } from "./productImage";
import { isAllowedImageContentType, uploadProductImage } from "../../lib/blob";
import { createError } from "../../middleware/errorHandler";
import { numericParam } from "../../middleware/validate";
import { isAdmin } from "../../lib/permissions";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, categoryId, lowStock, all, missingCost, page, limit } = req.query;
    res.json(
      await svc.listProducts({
        search: search as string,
        categoryId: categoryId ? Number(categoryId) : undefined,
        lowStock: lowStock === "true",
        activeOnly: all !== "true",
        includeCost: isAdmin(req),
        missingCost: missingCost === "true",
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      })
    );
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getProductById(numericParam(req, "id"), isAdmin(req))); } catch (err) { next(err); }
}

export async function getByBarcode(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getProductByBarcode(String(req.params.barcode), isAdmin(req))); } catch (err) { next(err); }
}

export async function getImage(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await svc.getProductImage(numericParam(req, "id"));
    if (!product.imageUrl.startsWith("data:")) {
      res.redirect(302, product.imageUrl);
      return;
    }

    const image = parseDataImage(product.imageUrl);
    if (!image) {
      res.status(415).json({ message: "รูปสินค้าไม่ถูกต้อง" });
      return;
    }

    const etag = `"${crypto.createHash("sha256").update(image.data).digest("base64url")}"`;
    res.set({
      "Content-Type": image.contentType,
      "Content-Length": String(image.data.length),
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      ETag: etag,
    });
    if (req.headers["if-none-match"] === etag) {
      res.status(304).end();
      return;
    }
    res.send(image.data);
  } catch (err) { next(err); }
}

export async function uploadImage(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file;
    if (!file) throw createError("กรุณาเลือกไฟล์รูปภาพ", 400);
    if (!isAllowedImageContentType(file.mimetype))
      throw createError("รองรับเฉพาะไฟล์ PNG, JPEG, WEBP", 415);

    const url = await uploadProductImage(file.buffer, file.mimetype);
    res.json({ url });
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try { res.status(201).json(await svc.createProduct(req.body, req.user!.id)); } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.updateProduct(numericParam(req, "id"), req.body)); } catch (err) { next(err); }
}

export async function importMany(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.importProducts(req.body?.rows, req.user!.id)); } catch (err) { next(err); }
}

export async function hardDelete(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.deleteProduct(numericParam(req, "id"))); } catch (err) { next(err); }
}
