import { getApi } from './api';
import { Movement } from '../types';

export const movementsService = {
  async create(data: {
    asset_id: number;
    to_type: string;
    to_id: number;
  }): Promise<Movement> {
    const api = await getApi();
    const response = await api.post<Movement>('/move', data);
    return response.data;
  },
};

