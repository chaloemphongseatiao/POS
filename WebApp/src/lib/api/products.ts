import apiClient from "./client";
import { Product } from "@/lib/types";

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

export async function listProducts(params?: {
  search?: string;
  categoryId?: number;
  all?: boolean;
  page?: number;
  limit?: number;
}): Promise<ProductListResponse> {
  const { data } = await apiClient.get<ProductListResponse>("/api/products", { params });
  return data;
}

export async function getProduct(id: number): Promise<Product> {
  const { data } = await apiClient.get<Product>(`/api/products/${id}`);
  return data;
}

export async function getProductByBarcode(barcode: string): Promise<Product> {
  const { data } = await apiClient.get<Product>(`/api/products/barcode/${barcode}`);
  return data;
}

/**
 * What the API accepts when writing a product. Distinct from `Product`, whose
 * money fields come back as strings while writes send numbers.
 */
export interface ProductWritePayload {
  barcode?: string;
  name?: string;
  description?: string;
  costPrice?: number;
  sellPrice?: number;
  unit?: string;
  imageUrl?: string;
  lowStockAt?: number;
  categoryId?: number;
  isActive?: boolean;
  initialStock?: number;
}

export async function createProduct(body: ProductWritePayload): Promise<Product> {
  const { data } = await apiClient.post<Product>("/api/products", body);
  return data;
}

export async function updateProduct(id: number, body: ProductWritePayload): Promise<Product> {
  const { data } = await apiClient.put<Product>(`/api/products/${id}`, body);
  return data;
}

export async function uploadProductImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await apiClient.post<{ url: string }>("/api/products/upload-image", formData, {
    headers: { "Content-Type": undefined },
  });
  return data.url;
}

export async function deleteProduct(id: number) {
  const { data } = await apiClient.delete(`/api/products/${id}`);
  return data;
}

export interface ProductImportRow {
  row: number;
  barcode?: string;
  name: string;
  description?: string;
  costPrice: number;
  sellPrice: number;
  unit: string;
  imageUrl?: string;
  lowStockAt: number;
  category: string;
  stock: number;
  isActive: boolean;
}

export interface ProductImportResult {
  total: number;
  created: number;
  updated: number;
}

export async function importProducts(rows: ProductImportRow[]): Promise<ProductImportResult> {
  const { data } = await apiClient.post<ProductImportResult>("/api/products/import", { rows });
  return data;
}
