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

export async function createProduct(body: Partial<Product> & { initialStock?: number }): Promise<Product> {
  const { data } = await apiClient.post<Product>("/api/products", body);
  return data;
}

export async function updateProduct(id: number, body: Partial<Product>): Promise<Product> {
  const { data } = await apiClient.put<Product>(`/api/products/${id}`, body);
  return data;
}

export async function deleteProduct(id: number) {
  const { data } = await apiClient.delete(`/api/products/${id}`);
  return data;
}
