import api from './api';
import { InventorySession, InventoryResult, Asset } from '../types';

export const inventoryService = {
  async createSession(data: { description?: string; device_type_codes?: string[] }): Promise<InventorySession> {
    const response = await api.post<InventorySession>('/inventory/sessions', data);
    return response.data;
  },

  async getSessions(): Promise<InventorySession[]> {
    const response = await api.get<InventorySession[]>('/inventory/sessions');
    return response.data;
  },

  async getSession(id: number): Promise<InventorySession> {
    const response = await api.get<InventorySession>(`/inventory/sessions/${id}`);
    return response.data;
  },

  async completeSession(id: number): Promise<InventorySession> {
    const response = await api.put<InventorySession>(`/inventory/sessions/${id}/complete`);
    return response.data;
  },

  async addResult(sessionId: number, data: {
    asset_id: number;
    found: boolean;
    actual_location_type?: string;
    actual_location_id?: number;
  }): Promise<InventoryResult> {
    const response = await api.post<InventoryResult>(`/inventory/sessions/${sessionId}/results`, data);
    return response.data;
  },

  async getResults(sessionId: number): Promise<InventoryResult[]> {
    const response = await api.get<InventoryResult[]>(`/inventory/sessions/${sessionId}/results`);
    return response.data;
  },

  async getProgress(sessionId: number): Promise<{ session_id: number; checked: number; total: number; remaining: number }> {
    const response = await api.get<{ session_id: number; checked: number; total: number; remaining: number }>(
      `/inventory/sessions/${sessionId}/progress`
    );
    return response.data;
  },

  async getRemaining(sessionId: number): Promise<Asset[]> {
    const response = await api.get<Asset[]>(`/inventory/sessions/${sessionId}/remaining`);
    return response.data;
  },

  async getChecked(sessionId: number): Promise<Array<{ id: number; found: boolean; confirmed_at: string; asset: Asset }>> {
    const response = await api.get<Array<{ id: number; found: boolean; confirmed_at: string; asset: Asset }>>(
      `/inventory/sessions/${sessionId}/checked`
    );
    return response.data;
  },
};


