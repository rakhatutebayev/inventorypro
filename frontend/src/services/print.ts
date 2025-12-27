import api from './api';

export const printService = {
  async generateLabel(assetId: number, size: '20x30' | '30x40' = '20x30'): Promise<Blob> {
    const response = await api.get(`/print/label/${assetId}/${size}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async downloadLabel(assetId: number, size: '20x30' | '30x40' = '20x30'): Promise<void> {
    const blob = await this.generateLabel(assetId, size);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `label_${assetId}_${size}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};


