import api from './api';
import { Asset } from '../types';

export const assetsService = {
  async getAll(params?: {
    skip?: number;
    limit?: number;
    device_type_code?: string;
    location_type?: string;
    location_id?: number;
    search?: string;
  }): Promise<Asset[]> {
    const response = await api.get<Asset[]>('/assets', { params });
    return response.data;
  },

  async getById(id: number): Promise<Asset> {
    const response = await api.get<Asset>(`/assets/${id}`);
    return response.data;
  },

  async scan(inventoryNumber: string): Promise<Asset> {
    const normalized = encodeURIComponent((inventoryNumber || '').trim());
    const response = await api.get<Asset>(`/assets/scan/${normalized}`);
    return response.data;
  },

  async create(data: {
    company_code: string;
    device_type_code: string;
    serial_number: string;
    vendor_id: number;
    model: string;
    location_type: string;
    location_id: number;
  }): Promise<Asset> {
    const response = await api.post<Asset>('/assets', data);
    return response.data;
  },

  async update(id: number, data: Partial<Asset>): Promise<Asset> {
    const response = await api.put<Asset>(`/assets/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/assets/${id}`);
  },
};


