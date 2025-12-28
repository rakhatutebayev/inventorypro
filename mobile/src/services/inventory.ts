import { getApi } from './api';
import { InventorySession, InventoryResult } from '../types';

export const inventoryService = {
  async createSession(data: { description?: string }): Promise<InventorySession> {
    const api = await getApi();
    const response = await api.post<InventorySession>('/inventory/sessions', data);
    return response.data;
  },

  async getSessions(): Promise<InventorySession[]> {
    const api = await getApi();
    const response = await api.get<InventorySession[]>('/inventory/sessions');
    return response.data;
  },

  async completeSession(id: number): Promise<InventorySession> {
    const api = await getApi();
    const response = await api.put<InventorySession>(`/inventory/sessions/${id}/complete`);
    return response.data;
  },

  async addResult(sessionId: number, data: {
    asset_id: number;
    found: boolean;
    actual_location_type?: string;
    actual_location_id?: number;
  }): Promise<InventoryResult> {
    const api = await getApi();
    const response = await api.post<InventoryResult>(`/inventory/sessions/${sessionId}/results`, data);
    return response.data;
  },
};

