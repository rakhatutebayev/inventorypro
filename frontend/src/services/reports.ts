import api from './api';

export interface ReportRow {
  device_type: string;
  vendor_model: string;
  serial: string;
  inventory: string;
  location: string;
  phone: string;
}

export interface ReportData {
  rows: ReportRow[];
}

export const reportsService = {
  async getData(params?: {
    device_type_code?: string;
    employee_id?: number;
    warehouse_id?: number;
  }): Promise<ReportData> {
    const response = await api.get<ReportData>('/reports/data', { params });
    return response.data;
  },

  async export(params?: {
    format?: 'excel' | 'pdf';
    device_type_code?: string;
    employee_id?: number;
    warehouse_id?: number;
  }): Promise<Blob> {
    const response = await api.get('/reports/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  async downloadReport(params?: {
    format?: 'excel' | 'pdf';
    device_type_code?: string;
    employee_id?: number;
    warehouse_id?: number;
  }): Promise<void> {
    const format = params?.format || 'excel';
    const blob = await this.export(params);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `assets_report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};


