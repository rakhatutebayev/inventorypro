import api from './api';
import { Company, DeviceType, Warehouse, Employee, Vendor } from '../types';

export const referencesService = {
  // Companies
  async getCompanies(): Promise<Company[]> {
    const response = await api.get<Company[]>('/references/companies');
    return response.data;
  },

  async createCompany(data: { code: string; name: string }): Promise<Company> {
    const response = await api.post<Company>('/references/companies', data);
    return response.data;
  },

  async updateCompany(id: number, data: { code: string; name: string }): Promise<Company> {
    const response = await api.put<Company>(`/references/companies/${id}`, data);
    return response.data;
  },

  async deleteCompany(id: number): Promise<void> {
    await api.delete(`/references/companies/${id}`);
  },

  // Device Types
  async getDeviceTypes(): Promise<DeviceType[]> {
    const response = await api.get<DeviceType[]>('/references/device-types');
    return response.data;
  },

  async createDeviceType(data: { code: string; name: string }): Promise<DeviceType> {
    const response = await api.post<DeviceType>('/references/device-types', data);
    return response.data;
  },

  async updateDeviceType(id: number, data: { code: string; name: string }): Promise<DeviceType> {
    const response = await api.put<DeviceType>(`/references/device-types/${id}`, data);
    return response.data;
  },

  async deleteDeviceType(id: number): Promise<void> {
    await api.delete(`/references/device-types/${id}`);
  },

  // Warehouses
  async getWarehouses(): Promise<Warehouse[]> {
    const response = await api.get<Warehouse[]>('/references/warehouses');
    return response.data;
  },

  async createWarehouse(data: { name: string; address?: string }): Promise<Warehouse> {
    const response = await api.post<Warehouse>('/references/warehouses', data);
    return response.data;
  },

  async updateWarehouse(id: number, data: { name: string; address?: string }): Promise<Warehouse> {
    const response = await api.put<Warehouse>(`/references/warehouses/${id}`, data);
    return response.data;
  },

  async deleteWarehouse(id: number): Promise<void> {
    await api.delete(`/references/warehouses/${id}`);
  },

  // Employees
  async getEmployees(): Promise<Employee[]> {
    const response = await api.get<Employee[]>('/references/employees');
    return response.data;
  },

  async createEmployee(data: { name: string; phone: string; position?: string; status?: 'working' | 'terminated' }): Promise<Employee> {
    const response = await api.post<Employee>('/references/employees', data);
    return response.data;
  },

  async updateEmployee(id: number, data: { name: string; phone: string; position?: string; status?: 'working' | 'terminated' }): Promise<Employee> {
    const response = await api.put<Employee>(`/references/employees/${id}`, data);
    return response.data;
  },

  async deleteEmployee(id: number): Promise<void> {
    await api.delete(`/references/employees/${id}`);
  },

  // Vendors
  async getVendors(): Promise<Vendor[]> {
    const response = await api.get<Vendor[]>('/references/vendors');
    return response.data;
  },
  async createVendor(data: { name: string }): Promise<Vendor> {
    const response = await api.post<Vendor>('/references/vendors', data);
    return response.data;
  },
  async updateVendor(id: number, data: { name: string }): Promise<Vendor> {
    const response = await api.put<Vendor>(`/references/vendors/${id}`, data);
    return response.data;
  },
  async deleteVendor(id: number): Promise<void> {
    await api.delete(`/references/vendors/${id}`);
  },
};


