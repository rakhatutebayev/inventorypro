import { getApi } from './api';
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
    const api = await getApi();
    const response = await api.get<Asset[]>('/assets', { params });
    return response.data;
  },

  async getById(id: number): Promise<Asset> {
    const api = await getApi();
    const response = await api.get<Asset>(`/assets/${id}`);
    return response.data;
  },

  async scan(inventoryNumber: string): Promise<Asset> {
    const api = await getApi();
    const response = await api.get<Asset>(`/assets/scan/${inventoryNumber}`);
    return response.data;
  },
};

