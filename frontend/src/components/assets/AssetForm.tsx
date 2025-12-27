import { useEffect, useMemo, useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsService } from '../../services/assets';
import { referencesService } from '../../services/references';
import { Asset, LocationType } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';

interface AssetFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  asset?: Asset | null;
}

export default function AssetForm({ onSuccess, onCancel, asset }: AssetFormProps) {
  const isEdit = !!asset;

  const [formData, setFormData] = useState({
    company_code: '',
    device_type_code: '',
    serial_number: '',
    vendor_id: '',
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

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => referencesService.getVendors(),
  });

  const createMutation = useMutation({
    mutationFn: (data: {
      company_code: string;
      device_type_code: string;
      serial_number: string;
      vendor_id: number;
      model: string;
      location_type: LocationType;
      location_id: number;
    }) => assetsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      onSuccess?.();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; payload: Partial<Pick<Asset, 'serial_number' | 'vendor_id' | 'model'>> }) =>
      assetsService.update(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      onSuccess?.();
    },
  });

  // Prefill when editing
  useEffect(() => {
    if (!asset) return;
    setFormData({
      company_code: asset.company_code,
      device_type_code: asset.device_type_code,
      serial_number: asset.serial_number,
      vendor_id: String(asset.vendor_id),
      model: asset.model,
      location_type: asset.location_type,
      location_id: String(asset.location_id),
    });
  }, [asset]);

  const companyName = useMemo(() => {
    const c = companies.find((x) => x.code === formData.company_code);
    return c ? `${c.name} (${c.code})` : formData.company_code;
  }, [companies, formData.company_code]);

  const deviceTypeName = useMemo(() => {
    const dt = deviceTypes.find((x) => x.code === formData.device_type_code);
    return dt ? `${dt.name} (${dt.code})` : formData.device_type_code;
  }, [deviceTypes, formData.device_type_code]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isEdit && asset) {
      updateMutation.mutate({
        id: asset.id,
        payload: {
          serial_number: formData.serial_number,
          vendor_id: Number(formData.vendor_id),
          model: formData.model,
        },
      });
      return;
    }

    if (formData.location_id && formData.vendor_id) {
      createMutation.mutate({
        ...formData,
        location_id: Number(formData.location_id),
        vendor_id: Number(formData.vendor_id),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Company *
        </label>
        {isEdit ? (
          <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700">
            {companyName || '—'}
          </div>
        ) : (
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
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Device Type *
        </label>
        {isEdit ? (
          <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700">
            {deviceTypeName || '—'}
          </div>
        ) : (
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
        )}
      </div>

      <Input
        label="Serial Number *"
        required
        value={formData.serial_number}
        onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Vendor *
        </label>
        <select
          required
          value={formData.vendor_id}
          onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Select vendor...</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <div className="text-xs text-gray-500 mt-1">
          Vendor list is managed in <span className="font-medium">References → Vendors</span>.
        </div>
      </div>

      <Input
        label="Model *"
        required
        value={formData.model}
        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
      />

      {isEdit ? (
        <div className="bg-gray-50 border border-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm">
          Location changes should be done via <span className="font-medium">Move</span> to keep movement history.
        </div>
      ) : (
        <>
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
        </>
      )}

      {(createMutation.isError || updateMutation.isError) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {(createMutation.error as any)?.response?.data?.detail ||
            (updateMutation.error as any)?.response?.data?.detail ||
            (isEdit ? 'Failed to update asset' : 'Failed to create asset')}
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
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {isEdit
            ? updateMutation.isPending
              ? 'Updating...'
              : 'Update Asset'
            : createMutation.isPending
              ? 'Creating...'
              : 'Create Asset'}
        </Button>
      </div>
    </form>
  );
}

