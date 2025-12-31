// User and Auth Types
export enum UserRole {
  ADMIN = "admin",
  WAREHOUSE_STAFF = "warehouse_staff",
  PRODUCTION_STAFF = "production_staff",
  DISTRIBUTION_COORDINATOR = "distribution_coordinator",
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  remember_me?: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Item Types
export enum ItemCategory {
  RAW_MATERIAL = "raw_material",
  IN_HOUSE_PRODUCT = "in_house_product",
  PURCHASED_ITEM = "purchased_item",
  ASSEMBLED_KIT = "assembled_kit",
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  category: ItemCategory;
  unit_of_measure: string;
  current_stock_level: number;
  minimum_stock_level?: number;
  sku?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ItemCreate {
  name: string;
  description?: string;
  category: ItemCategory;
  unit_of_measure: string;
  minimum_stock_level?: number;
  sku?: string;
  notes?: string;
}

// Quick Entry Types
export interface QuickProductionEntry {
  produced_item_id: string;
  quantity_produced: number;
  production_date?: string;
  notes?: string;
}

export interface QuickPurchaseItem {
  item_id: string;
  quantity: number;
  unit_cost?: number;
}

export interface QuickPurchaseEntry {
  items: QuickPurchaseItem[];
  supplier_name?: string;
  purchase_date?: string;
  notes?: string;
}

export enum DistributionType {
  WEEKLY_PACKAGE = "weekly_package",
  CRISIS_AID = "crisis_aid",
  SCHOOL_DELIVERY = "school_delivery",
  BOARDING_HOME = "boarding_home",
  LARGE_AID_DROP = "large_aid_drop",
  OTHER = "other",
}

export interface QuickDistributionItem {
  item_id: string;
  quantity: number;
}

export interface QuickDistributionEntry {
  distribution_type: DistributionType;
  items: QuickDistributionItem[];
  recipient_info?: string;
  distribution_date?: string;
  notes?: string;
}

// Dashboard Types
export interface DashboardStats {
  total_items: number;
  low_stock_items: number;
  productions_this_week: number;
  distributions_this_week: number;
  recent_activity: RecentActivity[];
}

export interface RecentActivity {
  type: string;
  item_name: string;
  quantity: number;
  movement_type: string;
  timestamp: string;
  user_name?: string;
  recipient_info?: string;
  notes?: string;
}

// Reports Types
export interface ActivitySummary {
  period: string;
  date_from: string;
  date_to: string;
  total_productions: number;
  total_purchases: number;
  total_distributions: number;
  total_assemblies: number;
  total_items_distributed: number;
  unique_users: number;
}

export interface UserActivity {
  user_name: string;
  productions_count: number;
  purchases_count: number;
  distributions_count: number;
  assemblies_count: number;
  total_entries: number;
}

export interface ProductionSummary {
  id: string;
  date: string;
  item_name: string;
  quantity: number;
  user_name: string;
  notes?: string;
}

export interface PurchaseSummary {
  id: string;
  date: string;
  supplier_name?: string;
  items: any[];
  total_cost?: number;
  user_name: string;
  notes?: string;
}

export interface DistributionSummary {
  id: string;
  date: string;
  distribution_type: string;
  items: any[];
  recipient_info?: string;
  user_name: string;
  notes?: string;
}

export interface AssemblySummary {
  id: string;
  date: string;
  kit_name: string;
  quantity_assembled: number;
  components: any[];
  user_name: string;
  notes?: string;
}

export interface ComprehensiveReport {
  summary: ActivitySummary;
  user_activities: UserActivity[];
  productions: ProductionSummary[];
  purchases: PurchaseSummary[];
  distributions: DistributionSummary[];
  assemblies: AssemblySummary[];
}
