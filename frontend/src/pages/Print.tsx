import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { assetsService } from '../services/assets';
import { printService } from '../services/print';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

export default function Print() {
  const [inventoryNumber, setInventoryNumber] = useState('');
  const [selectedSize, setSelectedSize] = useState<'30x20' | '40x30'>('30x20');

  const { data: asset, refetch, isLoading } = useQuery({
    queryKey: ['asset', inventoryNumber],
    queryFn: () => assetsService.scan(inventoryNumber),
    enabled: false, // Manual trigger
  });

  const handleSearch = () => {
    if (inventoryNumber) {
      refetch();
    }
  };

  const handlePrint = async () => {
    if (asset) {
      await printService.downloadLabel(asset.id, selectedSize);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Print Labels</h1>

      <div className="max-w-md mx-auto space-y-4">
        <Input
          label="Inventory Number"
          placeholder="Scan or enter inventory number"
          value={inventoryNumber}
          onChange={(e) => setInventoryNumber(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />

        <Button onClick={handleSearch} fullWidth disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </Button>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Label Size
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedSize('30x20')}
              className={`flex-1 px-4 py-2 rounded-md border ${
                selectedSize === '30x20'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              30x20 mm
            </button>
            <button
              onClick={() => setSelectedSize('40x30')}
              className={`flex-1 px-4 py-2 rounded-md border ${
                selectedSize === '40x30'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              40x30 mm
            </button>
          </div>
        </div>

        {asset && (
          <Card>
            <div className="space-y-2">
              <div className="font-semibold text-lg">{asset.inventory_number}</div>
              <div className="text-gray-600">
                {asset.vendor} {asset.model}
              </div>
              <div className="text-sm text-gray-500">
                Serial: {asset.serial_number}
              </div>
              <Button onClick={handlePrint} variant="primary" fullWidth className="mt-4">
                Download PDF Label
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
