export enum LocationType {
  employee = "employee",
  warehouse = "warehouse",
}

export enum UserRole {
  admin = "admin",
  user = "user",
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Company {
  id: number;
  code: string;
  name: string;
}

export interface DeviceType {
  id: number;
  code: string;
  name: string;
}

export interface Warehouse {
  id: number;
  name: string;
  address?: string;
}

export interface Employee {
  id: number;
  name: string;
  phone: string;
  position?: string;
  status: "working" | "terminated";
}

export interface AssetMini {
  id: number;
  inventory_number: string;
  vendor: string;
  model: string;
  serial_number: string;
}

export interface EmployeeAssignedAsset {
  assigned_at: string;
  asset: AssetMini;
}

export interface EmployeeAssetHistoryEvent {
  id: number;
  moved_at: string;
  action: "assigned" | "unassigned";
  from_type: LocationType;
  from_id: number;
  to_type: LocationType;
  to_id: number;
  asset: AssetMini;
}

export interface Vendor {
  id: number;
  name: string;
}

export interface Asset {
  id: number;
  company_code: string;
  device_type_code: string;
  inventory_number: string;
  serial_number: string;
  vendor_id: number;
  vendor: string;
  model: string;
  location_type: LocationType;
  location_id: number;
  created_at: string;
  updated_at: string;
}

export interface Movement {
  id: number;
  asset_id: number;
  from_type: LocationType;
  from_id: number;
  to_type: LocationType;
  to_id: number;
  moved_at: string;
}

export interface InventorySession {
  id: number;
  started_at: string;
  completed_at?: string;
  description?: string;
  device_type_codes?: string[];
}

export interface InventoryResult {
  id: number;
  session_id: number;
  asset_id: number;
  found: boolean;
  actual_location_type?: LocationType;
  actual_location_id?: number;
  confirmed_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}


