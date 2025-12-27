import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { assetsService } from '../services/assets';
import { referencesService } from '../services/references';
import { printService } from '../services/print';
import { Asset, LocationType } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import AssetForm from '../components/assets/AssetForm';

export default function Assets() {
  const [search, setSearch] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets', search],
    queryFn: () => assetsService.getAll({ search, limit: 100 }),
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => referencesService.getWarehouses(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => referencesService.getEmployees(),
  });

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
  };

  const handlePrint = async (assetId: number, size: '20x30' | '30x40') => {
    await printService.downloadLabel(assetId, size);
    setIsPrintModalOpen(false);
  };

  const getLocationName = (type: LocationType, id: number) => {
    if (type === LocationType.employee) {
      const employee = employees.find((e) => e.id === id);
      return employee ? employee.name : `Employee #${id}`;
    } else {
      const warehouse = warehouses.find((w) => w.id === id);
      return warehouse ? warehouse.name : `Warehouse #${id}`;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Assets</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>Add Asset</Button>
      </div>

      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search by inventory number, serial, vendor, model..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : assets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No assets found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <Card key={asset.id} onClick={() => handleAssetClick(asset)}>
              <div className="space-y-2">
                <div className="font-semibold text-lg">{asset.inventory_number}</div>
                <div className="text-gray-600">
                  {asset.vendor} {asset.model}
                </div>
                <div className="text-sm text-gray-500">
                  Serial: {asset.serial_number}
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Location: </span>
                  <span className="font-medium">
                    {getLocationName(asset.location_type, asset.location_id)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Asset Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedAsset?.inventory_number}
        size="md"
      >
        {selectedAsset && (
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Vendor & Model</div>
              <div className="font-semibold">
                {selectedAsset.vendor} {selectedAsset.model}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Serial Number</div>
              <div>{selectedAsset.serial_number}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Inventory Number</div>
              <div className="font-mono">{selectedAsset.inventory_number}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Location</div>
              <div>
                {getLocationName(selectedAsset.location_type, selectedAsset.location_id)}
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setIsModalOpen(false);
                  setIsPrintModalOpen(true);
                }}
              >
                Print Label
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Print Label Modal */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Print Label"
        size="sm"
      >
        {selectedAsset && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label Size
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrint(selectedAsset.id, '20x30')}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  20x30 mm
                </button>
                <button
                  onClick={() => handlePrint(selectedAsset.id, '30x40')}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  30x40 mm
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Asset Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Asset"
        size="lg"
      >
        <AssetForm
          onSuccess={() => setIsCreateModalOpen(false)}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
