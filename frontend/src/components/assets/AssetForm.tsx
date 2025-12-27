import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsService } from '../../services/assets';
import { referencesService } from '../../services/references';
import { LocationType } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';

interface AssetFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AssetForm({ onSuccess, onCancel }: AssetFormProps) {
  const [formData, setFormData] = useState({
    company_code: '',
    device_type_code: '',
    serial_number: '',
    vendor: '',
    model: '',
    location_type: LocationType.warehouse,
    location_id: '',
  });

  const queryClient = useQueryClient();

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => referencesService.getCompanies(),
  });

  const { data: deviceTypes = [] } = useQuery({
    queryKey: ['device-types'],
    queryFn: () => referencesService.getDeviceTypes(),
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => referencesService.getWarehouses(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => referencesService.getEmployees(),
  });

  const createMutation = useMutation({
    mutationFn: (data: {
      company_code: string;
      device_type_code: string;
      serial_number: string;
      vendor: string;
      model: string;
      location_type: LocationType;
      location_id: number;
    }) => assetsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      onSuccess?.();
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formData.location_id) {
      createMutation.mutate({
        ...formData,
        location_id: Number(formData.location_id),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Company *
        </label>
        <select
          required
          value={formData.company_code}
          onChange={(e) => setFormData({ ...formData, company_code: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Select company...</option>
          {companies.map((company) => (
            <option key={company.id} value={company.code}>
              {company.name} ({company.code})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Device Type *
        </label>
        <select
          required
          value={formData.device_type_code}
          onChange={(e) => setFormData({ ...formData, device_type_code: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Select device type...</option>
          {deviceTypes.map((dt) => (
            <option key={dt.id} value={dt.code}>
              {dt.name} ({dt.code})
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Serial Number *"
        required
        value={formData.serial_number}
        onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
      />

      <Input
        label="Vendor *"
        required
        value={formData.vendor}
        onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
      />

      <Input
        label="Model *"
        required
        value={formData.model}
        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location Type *
        </label>
        <select
          required
          value={formData.location_type}
          onChange={(e) => {
            setFormData({
              ...formData,
              location_type: e.target.value as LocationType,
              location_id: '',
            });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value={LocationType.warehouse}>Warehouse</option>
          <option value={LocationType.employee}>Employee</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {formData.location_type === LocationType.employee ? 'Employee *' : 'Warehouse *'}
        </label>
        <select
          required
          value={formData.location_id}
          onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Select...</option>
          {formData.location_type === LocationType.employee
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

      {createMutation.isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {(createMutation.error as any)?.response?.data?.detail || 'Failed to create asset'}
        </div>
      )}

      <div className="flex gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Creating...' : 'Create Asset'}
        </Button>
      </div>
    </form>
  );
}

