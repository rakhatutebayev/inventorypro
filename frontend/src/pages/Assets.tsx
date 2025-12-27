import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { assetsService } from '../services/assets';
import { printService } from '../services/print';
import { Asset, LocationType } from '../types';
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


  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
  };

  const handlePrint = async (assetId: number, size: '30x20' | '40x30') => {
    await printService.downloadLabel(assetId, size);
    setIsPrintModalOpen(false);
  };

  const getLocationName = (type: LocationType, id: number) => {
    // Location names will be loaded from API if needed
    if (type === LocationType.employee) {
      return `Employee #${id}`;
    } else {
      return `Warehouse #${id}`;
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {assets.map((asset) => (
              <li
                key={asset.id}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleAssetClick(asset)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-gray-900 truncate">
                        {asset.inventory_number}
                      </div>
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        {asset.device_type_code}
                      </div>
                    </div>

                    <div className="text-sm text-gray-700 truncate mt-0.5">
                      {asset.vendor} {asset.model}
                    </div>

                    <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      <span className="font-mono">S/N: {asset.serial_number}</span>
                      <span>
                        Location: <span className="text-gray-700">{getLocationName(asset.location_type, asset.location_id)}</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-gray-400 text-lg leading-none select-none">›</div>
                </div>
              </li>
            ))}
          </ul>
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
                  onClick={() => handlePrint(selectedAsset.id, '30x20')}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  30x20 mm
                </button>
                <button
                  onClick={() => handlePrint(selectedAsset.id, '40x30')}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  40x30 mm
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
