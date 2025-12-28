import { getApi } from './api';
import { Company, DeviceType, Warehouse, Employee } from '../types';

export const referencesService = {
  async getCompanies(): Promise<Company[]> {
    const api = await getApi();
    const response = await api.get<Company[]>('/references/companies');
    return response.data;
  },

  async getDeviceTypes(): Promise<DeviceType[]> {
    const api = await getApi();
    const response = await api.get<DeviceType[]>('/references/device-types');
    return response.data;
  },

  async getWarehouses(): Promise<Warehouse[]> {
    const api = await getApi();
    const response = await api.get<Warehouse[]>('/references/warehouses');
    return response.data;
  },

  async getEmployees(): Promise<Employee[]> {
    const api = await getApi();
    const response = await api.get<Employee[]>('/references/employees');
    return response.data;
  },
};

