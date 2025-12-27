import api from './api';
import { Movement } from '../types';

export const movementsService = {
  async create(data: {
    asset_id: number;
    to_type: string;
    to_id: number;
  }): Promise<Movement> {
    const response = await api.post<Movement>('/move', data);
    return response.data;
  },

  async getByAssetId(assetId: number): Promise<Movement[]> {
    const response = await api.get<Movement[]>(`/move/${assetId}`);
    return response.data;
  },
};


