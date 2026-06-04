import type { ISODateTimeString, MoneyCents } from "@/lib/types/primitives";

export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock" | "inactive";

export type ProductCategory =
  | "fengshui_object"
  | "five_element_accessory"
  | "aroma_energy"
  | "office_layout"
  | "wealth_product"
  | "course_bundle"
  | "other";

export type ProductRecord = {
  id: string;
  sku: string;
  title: string;
  category: ProductCategory;
  description: string;
  imageUrl?: string | null;
  stockQuantity: number;
  lowStockThreshold: number;
  costPriceCents: MoneyCents;
  sellingPriceCents: MoneyCents;
  memberDiscountRate: number;
  bonusCredits: number;
  referralCommissionRate: number;
  shippingFeeCents: MoneyCents;
  status: InventoryStatus;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type StockMovement = {
  id: string;
  productId: string;
  sku: string;
  type: "stock_in" | "stock_out" | "adjustment" | "order_deduction" | "return";
  quantity: number;
  reason: string;
  orderId?: string | null;
  createdBy?: string | null;
  createdAt: ISODateTimeString;
};

