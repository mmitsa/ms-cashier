export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  salePrice?: number;
  image?: string;
  images?: string[];
  categoryId?: string;
  categoryName?: string;
  hasVariants?: boolean;
  variants?: ProductVariant[];
  isActive?: boolean;
  sku?: string;
};

export type ProductVariant = {
  id: string;
  name: string;
  price: number;
  sku?: string;
  isActive?: boolean;
};

export type Category = {
  id: string;
  name: string;
  image?: string;
  productCount?: number;
};

export type Banner = {
  id: string;
  title?: string;
  subtitle?: string;
  image: string;
  link?: string;
  sortOrder?: number;
};

export type OrderItem = {
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
};

export type CreateOrderRequest = {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress?: string;
  notes?: string;
  paymentMethod: string;
  items: OrderItem[];
};

export type Order = {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
};
