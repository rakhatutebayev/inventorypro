import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsService } from '../services/assets';
import { movementsService } from '../services/movements';
import { referencesService } from '../services/references';
import { LocationType } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';

export default function Movements() {
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [toType, setToType] = useState<LocationType>(LocationType.employee);
  const [toId, setToId] = useState<number | ''>('');
  const [searchAsset, setSearchAsset] = useState('');

  const queryClient = useQueryClient();

  // Fetch assets for selection
  const { data: assets = [] } = useQuery({
    queryKey: ['assets', searchAsset],
    queryFn: () => assetsService.getAll({ search: searchAsset, limit: 20 }),
  });

  // Fetch warehouses and employees for destination selection
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => referencesService.getWarehouses(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => referencesService.getEmployees(),
  });

  // Fetch selected asset details
  const { data: selectedAsset } = useQuery({
    queryKey: ['asset', selectedAssetId],
    queryFn: () => assetsService.getById(selectedAssetId!),
    enabled: !!selectedAssetId,
  });

  // Fetch movement history
  const { data: movements = [] } = useQuery({
    queryKey: ['movements', selectedAssetId],
    queryFn: () => movementsService.getByAssetId(selectedAssetId!),
    enabled: !!selectedAssetId,
  });

  const moveMutation = useMutation({
    mutationFn: (data: { asset_id: number; to_type: LocationType; to_id: number }) =>
      movementsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset', selectedAssetId] });
      queryClient.invalidateQueries({ queryKey: ['movements', selectedAssetId] });
      setIsMoveModalOpen(false);
      setToId('');
    },
  });

  const handleMoveClick = (assetId: number) => {
    setSelectedAssetId(assetId);
    setIsMoveModalOpen(true);
  };

  const handleMove = () => {
    if (selectedAssetId && toId) {
      moveMutation.mutate({
        asset_id: selectedAssetId,
        to_type: toType,
        to_id: Number(toId),
      });
    }
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
      <h1 className="text-2xl font-bold mb-6">Movements</h1>

      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search asset by inventory number, serial, vendor, model..."
          value={searchAsset}
          onChange={(e) => setSearchAsset(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {assets.map((asset) => (
          <Card key={asset.id}>
            <div className="space-y-2">
              <div className="font-semibold text-lg">{asset.inventory_number}</div>
              <div className="text-gray-600">
                {asset.vendor} {asset.model}
              </div>
              <div className="text-sm text-gray-500">
                Current: {getLocationName(asset.location_type, asset.location_id)}
              </div>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => handleMoveClick(asset.id)}
              >
                Move Asset
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {selectedAsset && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">
            Movement History: {selectedAsset.inventory_number}
          </h2>
          <div className="space-y-2">
            {movements.length === 0 ? (
              <p className="text-gray-500">No movements recorded</p>
            ) : (
              movements.map((movement) => (
                <Card key={movement.id}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        From: {getLocationName(movement.from_type, movement.from_id)}
                      </div>
                      <div className="text-gray-600">
                        To: {getLocationName(movement.to_type, movement.to_id)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(movement.moved_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Move To
              </label>
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
              onClick={handleMove}
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
    </div>
  );
}
