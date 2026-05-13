export type ProductCategory = "food" | "medicine" | "supplement";
export type ExpiryStatus = "expired" | "expiring_soon" | "normal";

export interface Product {
  id: number;
  name: string;
  category: ProductCategory;
  expiryDate: Date;
  imageUrl: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  status: ExpiryStatus;
}

export interface ProductFormData {
  name: string;
  category: ProductCategory;
  expiryDate: string;
  imageUrl?: string;
  notes?: string;
}

export const categoryLabels: Record<ProductCategory, string> = {
  food: "食品",
  medicine: "药品",
  supplement: "补品",
};

export const categoryColors: Record<ProductCategory, string> = {
  food: "bg-amber-500",
  medicine: "bg-sky-500",
  supplement: "bg-emerald-500",
};

export const categoryBgColors: Record<ProductCategory, string> = {
  food: "bg-amber-50 text-amber-700 border-amber-200",
  medicine: "bg-sky-50 text-sky-700 border-sky-200",
  supplement: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export const statusLabels: Record<ExpiryStatus, string> = {
  expired: "已过期",
  expiring_soon: "即将到期",
  normal: "正常",
};

export const statusColors: Record<ExpiryStatus, string> = {
  expired: "bg-red-50 text-red-700 border-red-200",
  expiring_soon: "bg-orange-50 text-orange-700 border-orange-200",
  normal: "bg-green-50 text-green-700 border-green-200",
};

export const statusDotColors: Record<ExpiryStatus, string> = {
  expired: "bg-red-500",
  expiring_soon: "bg-orange-500",
  normal: "bg-green-500",
};
