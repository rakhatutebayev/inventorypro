import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsService } from '../services/assets';
import { printService } from '../services/print';
import { movementsService } from '../services/movements';
import { referencesService } from '../services/references';
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [toType, setToType] = useState<LocationType>(LocationType.employee);
  const [toId, setToId] = useState<number | ''>('');

  const queryClient = useQueryClient();

  const [pendingOpenAssetId, setPendingOpenAssetId] = useState<number | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('assets_open_id');
    if (!raw) return;
    const id = Number(raw);
    if (!Number.isNaN(id)) {
      setPendingOpenAssetId(id);
    }
    sessionStorage.removeItem('assets_open_id');
  }, []);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets', search],
    queryFn: () => assetsService.getAll({ search, limit: 100 }),
  });

  const { data: openAssetById } = useQuery({
    queryKey: ['asset', pendingOpenAssetId],
    queryFn: () => assetsService.getById(pendingOpenAssetId!),
    enabled: !!pendingOpenAssetId,
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => referencesService.getWarehouses(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => referencesService.getEmployees(),
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['movements', selectedAsset?.id],
    queryFn: () => movementsService.getByAssetId(selectedAsset!.id),
    enabled: !!selectedAsset?.id && isHistoryModalOpen,
  });

  useEffect(() => {
    if (!pendingOpenAssetId) return;
    if (!openAssetById) return;
    setSelectedAsset(openAssetById);
    setIsModalOpen(true);
    setPendingOpenAssetId(null);
  }, [openAssetById, pendingOpenAssetId]);


  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
  };

  const handlePrint = async (assetId: number, size: '30x20' | '40x30') => {
    await printService.downloadLabel(assetId, size);
    setIsPrintModalOpen(false);
  };

  const getLocationName = (type: LocationType, id: number) => {
    if (type === LocationType.employee) {
      const emp = employees.find((e) => e.id === id);
      return emp ? `${emp.name} (${emp.phone})` : `Employee #${id}`;
    } else {
      const wh = warehouses.find((w) => w.id === id);
      return wh ? wh.name : `Warehouse #${id}`;
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => assetsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setIsModalOpen(false);
      setIsHistoryModalOpen(false);
      setIsPrintModalOpen(false);
      setIsEditModalOpen(false);
      setIsMoveModalOpen(false);
      setSelectedAsset(null);
    },
  });

  const moveMutation = useMutation({
    mutationFn: (data: { asset_id: number; to_type: LocationType; to_id: number }) =>
      movementsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['movements', selectedAsset?.id] });
      setIsMoveModalOpen(false);
      setToId('');
    },
  });

  const handleDelete = (asset: Asset) => {
    if (!confirm(`Delete asset ${asset.inventory_number}? This cannot be undone.`)) return;
    deleteMutation.mutate(asset.id);
  };

  const formatDateOnly = (isoOrDate: string) => {
    const d = new Date(isoOrDate);
    // dd.mm.yyyy
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
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
          <div className="overflow-x-auto">
            <table className="min-w-max w-full table-auto">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <th className="px-4 py-2 text-left whitespace-nowrap">Inventory</th>
                  <th className="px-4 py-2 text-left whitespace-nowrap">Vendor + Model</th>
                  <th className="px-4 py-2 text-left whitespace-nowrap">Serial</th>
                  <th className="px-4 py-2 text-left whitespace-nowrap">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {assets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleAssetClick(asset)}
                  >
                    <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">
                      {asset.inventory_number}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                      {asset.vendor} {asset.model}
                    </td>
                    <td className="px-4 py-2 text-sm font-mono text-gray-600 whitespace-nowrap">
                      {asset.serial_number}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                      {getLocationName(asset.location_type, asset.location_id)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setIsModalOpen(false);
                  setIsMoveModalOpen(true);
                }}
              >
                Move
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setIsModalOpen(false);
                  setIsHistoryModalOpen(true);
                }}
              >
                View History
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setIsModalOpen(false);
                  setIsEditModalOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => selectedAsset && handleDelete(selectedAsset)}
              >
                Delete
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

      {/* Edit Asset Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Asset ${selectedAsset?.inventory_number || ''}`}
        size="lg"
      >
        <AssetForm
          asset={selectedAsset}
          onSuccess={() => setIsEditModalOpen(false)}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>

      {/* Move Asset Modal */}
      <Modal
        isOpen={isMoveModalOpen}
        onClose={() => {
          setIsMoveModalOpen(false);
          setToId('');
        }}
        title={`Move Asset: ${selectedAsset?.inventory_number || ''}`}
        size="md"
      >
        {selectedAsset && (
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Current Location</div>
              <div className="font-medium">
                {getLocationName(selectedAsset.location_type, selectedAsset.location_id)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Move To</label>
              <select
                value={toType}
                onChange={(e) => {
                  setToType(e.target.value as LocationType);
                  setToId('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={LocationType.employee}>Employee</option>
                <option value={LocationType.warehouse}>Warehouse</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {toType === LocationType.employee ? 'Select Employee' : 'Select Warehouse'}
              </label>
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select...</option>
                {toType === LocationType.employee
                  ? employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.phone})
                      </option>
                    ))
                  : warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name}
                      </option>
                    ))}
              </select>
            </div>

            <Button
              onClick={() =>
                selectedAsset &&
                toId &&
                moveMutation.mutate({
                  asset_id: selectedAsset.id,
                  to_type: toType,
                  to_id: Number(toId),
                })
              }
              variant="primary"
              fullWidth
              disabled={!toId || moveMutation.isPending}
            >
              {moveMutation.isPending ? 'Moving...' : 'Move Asset'}
            </Button>

            {moveMutation.isError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {(moveMutation.error as any)?.response?.data?.detail || 'Failed to move asset'}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Movement History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Movement History: ${selectedAsset?.inventory_number || ''}`}
        size="lg"
      >
        {selectedAsset && (
          <div className="space-y-3">
            {movements.length === 0 ? (
              <div className="text-gray-500">No movements recorded</div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <div className="col-span-3">Date</div>
                    <div className="col-span-4">From</div>
                    <div className="col-span-5">To</div>
                  </div>
                </div>
                <ul className="divide-y divide-gray-200">
                  {movements.map((m) => (
                    <li key={m.id} className="px-4 py-2">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-3 text-sm text-gray-700 whitespace-nowrap">
                          {formatDateOnly(m.moved_at)}
                        </div>
                        <div className="col-span-4 text-sm text-gray-700 truncate" title={getLocationName(m.from_type, m.from_id)}>
                          {getLocationName(m.from_type, m.from_id)}
                        </div>
                        <div className="col-span-5 text-sm text-gray-700 truncate" title={getLocationName(m.to_type, m.to_id)}>
                          {getLocationName(m.to_type, m.to_id)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
