import { Request, Response, NextFunction } from "express";
import * as svc from "./products.service";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, categoryId, lowStock, all, page, limit } = req.query;
    res.json(
      await svc.listProducts({
        search: search as string,
        categoryId: categoryId ? Number(categoryId) : undefined,
        lowStock: lowStock === "true",
        activeOnly: all !== "true",
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      })
    );
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getProductById(Number(req.params.id))); } catch (err) { next(err); }
}

export async function getByBarcode(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getProductByBarcode(String(req.params.barcode))); } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try { res.status(201).json(await svc.createProduct(req.body)); } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.updateProduct(Number(req.params.id), req.body)); } catch (err) { next(err); }
}

export async function importMany(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.importProducts(req.body?.rows)); } catch (err) { next(err); }
}

export async function hardDelete(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.deleteProduct(Number(req.params.id))); } catch (err) { next(err); }
}
