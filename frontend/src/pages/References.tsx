import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { referencesService } from '../services/references';
import { movementsService } from '../services/movements';
import { AssetMini, LocationType } from '../types';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';

type TabType = 'companies' | 'device-types' | 'warehouses' | 'employees' | 'vendors';

export default function References() {
  const [activeTab, setActiveTab] = useState<TabType>('companies');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const queryClient = useQueryClient();

  // Companies
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => referencesService.getCompanies(),
  });

  // Device Types
  const { data: deviceTypes = [] } = useQuery({
    queryKey: ['device-types'],
    queryFn: () => referencesService.getDeviceTypes(),
  });

  // Warehouses
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => referencesService.getWarehouses(),
  });

  // Employees
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => referencesService.getEmployees(),
  });

  // Vendors
  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => referencesService.getVendors(),
  });

  // Delete mutations
  const deleteCompanyMutation = useMutation({
    mutationFn: (id: number) => referencesService.deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  const deleteDeviceTypeMutation = useMutation({
    mutationFn: (id: number) => referencesService.deleteDeviceType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-types'] });
    },
  });

  const deleteWarehouseMutation = useMutation({
    mutationFn: (id: number) => referencesService.deleteWarehouse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: (id: number) => referencesService.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const deleteVendorMutation = useMutation({
    mutationFn: (id: number) => referencesService.deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
  });

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    switch (activeTab) {
      case 'companies':
        deleteCompanyMutation.mutate(id);
        break;
      case 'device-types':
        deleteDeviceTypeMutation.mutate(id);
        break;
      case 'warehouses':
        deleteWarehouseMutation.mutate(id);
        break;
      case 'employees':
        deleteEmployeeMutation.mutate(id);
        break;
      case 'vendors':
        deleteVendorMutation.mutate(id);
        break;
    }
  };

  const renderCompanies = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
      {companies.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-500">
          No companies found
        </div>
      ) : (
        companies.map((company) => (
          <div
            key={company.id}
            className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
          >
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-900 min-w-[80px]">{company.code}</span>
                <span className="text-gray-700">{company.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleEdit(company)}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(company.id)}
                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderDeviceTypes = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
      {deviceTypes.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-500">
          No device types found
        </div>
      ) : (
        deviceTypes.map((deviceType) => (
          <div
            key={deviceType.id}
            className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
          >
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-900 min-w-[60px]">{deviceType.code}</span>
                <span className="text-gray-700">{deviceType.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleEdit(deviceType)}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(deviceType.id)}
                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderWarehouses = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
      {warehouses.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-500">
          No warehouses found
        </div>
      ) : (
        warehouses.map((warehouse) => (
          <div
            key={warehouse.id}
            className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
          >
            <div className="flex-1">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-gray-900">{warehouse.name}</span>
                {warehouse.address && (
                  <span className="text-sm text-gray-500">{warehouse.address}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleEdit(warehouse)}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(warehouse.id)}
                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderEmployees = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
      {employees.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-500">
          No employees found
        </div>
      ) : (
        employees.map((employee) => (
          <div
            key={employee.id}
            className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
          >
            <div className="flex-1">
              <div className="flex items-center gap-6">
                <span className="font-semibold text-gray-900 min-w-[200px]">{employee.name}</span>
                <span className="text-gray-700 min-w-[100px]">{employee.phone}</span>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    employee.status === 'working'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {employee.status === 'working' ? 'Working' : 'Terminated'}
                </span>
                {employee.position && (
                  <span className="text-sm text-gray-500">{employee.position}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleEdit(employee)}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(employee.id)}
                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderVendors = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
      {vendors.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-500">
          No vendors found
        </div>
      ) : (
        vendors.map((vendor) => (
          <div
            key={vendor.id}
            className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
          >
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-900">{vendor.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleEdit(vendor)}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(vendor.id)}
                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">References</h1>
        <Button onClick={handleAdd}>Add New</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('companies')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'companies'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Companies
        </button>
        <button
          onClick={() => setActiveTab('device-types')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'device-types'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Device Types
        </button>
        <button
          onClick={() => setActiveTab('warehouses')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'warehouses'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Warehouses
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'employees'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Employees
        </button>
        <button
          onClick={() => setActiveTab('vendors')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'vendors'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Vendors
        </button>
      </div>

      {/* Content */}
      {activeTab === 'companies' && renderCompanies()}
      {activeTab === 'device-types' && renderDeviceTypes()}
      {activeTab === 'warehouses' && renderWarehouses()}
      {activeTab === 'employees' && renderEmployees()}
      {activeTab === 'vendors' && renderVendors()}

      {/* Modal */}
      <ReferenceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={activeTab}
        item={editingItem}
      />
    </div>
  );
}

interface ReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: TabType;
  item: any;
}

function ReferenceModal({ isOpen, onClose, type, item }: ReferenceModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({});
  const [terminationBlockMessage, setTerminationBlockMessage] = useState<string | null>(null);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignAsset, setReassignAsset] = useState<AssetMini | null>(null);
  const [reassignToType, setReassignToType] = useState<LocationType>(LocationType.warehouse);
  const [reassignToId, setReassignToId] = useState<number | ''>('');
  const [isAssignedAssetsModalOpen, setIsAssignedAssetsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [openedByTerminationCheck, setOpenedByTerminationCheck] = useState(false);

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => referencesService.getWarehouses(),
    enabled: isOpen,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => referencesService.getEmployees(),
    enabled: isOpen,
  });

  const normalizeEmployeeFormData = (data: any) => {
    if (!data) return data;
    if (typeof data.status === 'undefined' || data.status === null || data.status === '') {
      return { ...data, status: 'working' };
    }
    return data;
  };

  const moveMutation = useMutation({
    mutationFn: (data: { asset_id: number; to_type: LocationType; to_id: number }) => movementsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsReassignModalOpen(false);
      setReassignAsset(null);
      setReassignToId('');
      queryClient.invalidateQueries({ queryKey: ['employee-assigned-assets', item?.id] });
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: (data: { code: string; name: string }) => referencesService.createCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      onClose();
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { code: string; name: string } }) =>
      referencesService.updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      onClose();
    },
  });

  const createDeviceTypeMutation = useMutation({
    mutationFn: (data: { code: string; name: string }) => referencesService.createDeviceType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-types'] });
      onClose();
    },
  });

  const updateDeviceTypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { code: string; name: string } }) =>
      referencesService.updateDeviceType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-types'] });
      onClose();
    },
  });

  const createWarehouseMutation = useMutation({
    mutationFn: (data: { name: string; address?: string }) => referencesService.createWarehouse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      onClose();
    },
  });

  const updateWarehouseMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; address?: string } }) =>
      referencesService.updateWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      onClose();
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: (data: { name: string; phone: string; position?: string; status?: 'working' | 'terminated' }) =>
      referencesService.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      onClose();
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; phone: string; position?: string; status?: 'working' | 'terminated' } }) =>
      referencesService.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setTerminationBlockMessage(null);
      setOpenedByTerminationCheck(false);
      onClose();
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail;
      if (detail?.code === 'EMPLOYEE_HAS_ASSETS') {
        setTerminationBlockMessage(detail.message || 'Employee has assigned assets.');
        setOpenedByTerminationCheck(true);
        setIsAssignedAssetsModalOpen(true);
      }
    },
  });

  const createVendorMutation = useMutation({
    mutationFn: (data: { name: string }) => referencesService.createVendor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      onClose();
    },
  });

  const updateVendorMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string } }) =>
      referencesService.updateVendor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'employees') {
      setTerminationBlockMessage(null);
      setOpenedByTerminationCheck(false);
    }

    if (type === 'companies') {
      if (item) {
        updateCompanyMutation.mutate({ id: item.id, data: formData });
      } else {
        createCompanyMutation.mutate(formData);
      }
    } else if (type === 'device-types') {
      if (item) {
        updateDeviceTypeMutation.mutate({ id: item.id, data: formData });
      } else {
        createDeviceTypeMutation.mutate(formData);
      }
    } else if (type === 'warehouses') {
      if (item) {
        updateWarehouseMutation.mutate({ id: item.id, data: formData });
      } else {
        createWarehouseMutation.mutate(formData);
      }
    } else if (type === 'employees') {
      if (item) {
        updateEmployeeMutation.mutate({ id: item.id, data: formData });
      } else {
        createEmployeeMutation.mutate(formData);
      }
    } else if (type === 'vendors') {
      if (item) {
        updateVendorMutation.mutate({ id: item.id, data: formData });
      } else {
        createVendorMutation.mutate(formData);
      }
    }
  };

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setFormData(type === 'employees' ? normalizeEmployeeFormData(item) : item);
      setTerminationBlockMessage(null);
      setOpenedByTerminationCheck(false);
    } else {
      setFormData(type === 'employees' ? { status: 'working' } : {});
      setTerminationBlockMessage(null);
      setOpenedByTerminationCheck(false);
    }
  }, [item, type]);

  // Reset nested modals when closing main modal
  useEffect(() => {
    if (isOpen) return;
    setIsAssignedAssetsModalOpen(false);
    setIsHistoryModalOpen(false);
    setIsReassignModalOpen(false);
    setReassignAsset(null);
    setReassignToId('');
    setOpenedByTerminationCheck(false);
    setTerminationBlockMessage(null);
  }, [isOpen]);

  const formatDateOnly = (isoOrDate: string) => {
    const d = new Date(isoOrDate);
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  };

  const getLocationLabel = (locType: LocationType, id: number) => {
    if (locType === LocationType.employee) {
      const emp = employees.find((e) => e.id === id);
      return emp ? `${emp.name} (${emp.phone})` : `Employee #${id}`;
    }
    const wh = warehouses.find((w) => w.id === id);
    return wh ? wh.name : `Warehouse #${id}`;
  };

  const { data: assignedAssets = [], isLoading: isLoadingAssigned } = useQuery({
    queryKey: ['employee-assigned-assets', item?.id],
    queryFn: () => referencesService.getEmployeeAssignedAssets(item!.id),
    enabled: isOpen && type === 'employees' && !!item?.id && isAssignedAssetsModalOpen,
  });

  const { data: historyEvents = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['employee-asset-history', item?.id],
    queryFn: () => referencesService.getEmployeeAssetHistory(item!.id),
    enabled: isOpen && type === 'employees' && !!item?.id && isHistoryModalOpen,
  });

  const getTitle = () => {
    if (!item) {
      switch (type) {
        case 'companies': return 'Add New Company';
        case 'device-types': return 'Add New Device Type';
        case 'warehouses': return 'Add New Warehouse';
        case 'employees': return 'Add New Employee';
        case 'vendors': return 'Add New Vendor';
        default: return 'Add New';
      }
    } else {
      switch (type) {
        case 'companies': return 'Edit Company';
        case 'device-types': return 'Edit Device Type';
        case 'warehouses': return 'Edit Warehouse';
        case 'employees': return 'Edit Employee';
        case 'vendors': return 'Edit Vendor';
        default: return 'Edit';
      }
    }
  };

  const title = getTitle();

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {type === 'companies' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code (3 uppercase letters)
              </label>
              <Input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                maxLength={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <Input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </>
        )}

        {type === 'device-types' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code (2 digits)
              </label>
              <Input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                maxLength={2}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <Input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </>
        )}

        {type === 'warehouses' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <Input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <Input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </>
        )}

        {type === 'employees' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <Input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <Input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <Input
                type="text"
                value={formData.position || ''}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status || 'working'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="working">Working</option>
                <option value="terminated">Terminated</option>
              </select>
              <div className="text-xs text-gray-500 mt-1">
                If you set to Terminated, employee must have no assigned assets.
              </div>
            </div>

            {item && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setOpenedByTerminationCheck(false);
                    setTerminationBlockMessage(null);
                    setIsAssignedAssetsModalOpen(true);
                  }}
                >
                  Assigned assets
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setIsHistoryModalOpen(true)}
                >
                  History
                </Button>
              </div>
            )}
          </>
        )}

        {type === 'vendors' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <Input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </>
        )}

        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1">
            {item ? 'Update' : 'Create'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
      </Modal>

      <Modal
        isOpen={isReassignModalOpen}
        onClose={() => {
          setIsReassignModalOpen(false);
          setReassignAsset(null);
          setReassignToId('');
        }}
        title={`Move Asset: ${reassignAsset?.inventory_number || ''}`}
        size="md"
      >
        {reassignAsset && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <div className="font-medium text-gray-900">
                {reassignAsset.vendor} {reassignAsset.model}
              </div>
              <div className="font-mono text-xs text-gray-600">{reassignAsset.serial_number}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Move To</label>
              <select
                value={reassignToType}
                onChange={(e) => {
                  setReassignToType(e.target.value as LocationType);
                  setReassignToId('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={LocationType.warehouse}>Warehouse</option>
                <option value={LocationType.employee}>Employee</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {reassignToType === LocationType.employee ? 'Select Employee' : 'Select Warehouse'}
              </label>
              <select
                value={reassignToId}
                onChange={(e) => setReassignToId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select...</option>
                {reassignToType === LocationType.employee
                  ? employees
                      .filter((e) => e.id !== item?.id)
                      .map((emp) => (
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
              variant="primary"
              fullWidth
              disabled={!reassignToId || moveMutation.isPending}
              onClick={() => {
                if (!reassignToId) return;
                moveMutation.mutate({
                  asset_id: reassignAsset.id,
                  to_type: reassignToType,
                  to_id: Number(reassignToId),
                });
              }}
            >
              {moveMutation.isPending ? 'Moving...' : 'Move'}
            </Button>

            {moveMutation.isError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {(moveMutation.error as any)?.response?.data?.detail || 'Failed to move asset'}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Assigned assets modal (also used when termination is blocked) */}
      <Modal
        isOpen={isAssignedAssetsModalOpen}
        onClose={() => {
          setIsAssignedAssetsModalOpen(false);
          setOpenedByTerminationCheck(false);
          setTerminationBlockMessage(null);
        }}
        title={`Assigned assets: ${item?.name || ''}`}
        size="lg"
      >
        {openedByTerminationCheck && (
          <div className="mb-3 border border-yellow-200 bg-yellow-50 text-yellow-900 rounded-md px-4 py-3 text-sm">
            {terminationBlockMessage || 'Employee has assigned assets. Move them before termination.'}
          </div>
        )}

        {isLoadingAssigned ? (
          <div className="text-gray-500">Loading...</div>
        ) : assignedAssets.length === 0 ? (
          <div className="text-green-700 bg-green-50 border border-green-200 rounded-md px-4 py-3 text-sm">
            No assigned assets. You can set status to <span className="font-medium">Terminated</span>.
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="min-w-max w-full table-auto">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <th className="px-4 py-2 text-left whitespace-nowrap">Assigned</th>
                    <th className="px-4 py-2 text-left whitespace-nowrap">Inventory</th>
                    <th className="px-4 py-2 text-left whitespace-nowrap">Vendor + Model</th>
                    <th className="px-4 py-2 text-left whitespace-nowrap">Serial</th>
                    <th className="px-4 py-2 text-left whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assignedAssets.map((row) => (
                    <tr key={row.asset.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                        {formatDateOnly(row.assigned_at)}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {row.asset.inventory_number}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                        {row.asset.vendor} {row.asset.model}
                      </td>
                      <td className="px-4 py-2 text-sm font-mono text-gray-600 whitespace-nowrap">
                        {row.asset.serial_number}
                      </td>
                      <td className="px-4 py-2 text-sm whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                            onClick={() => {
                              sessionStorage.setItem('assets_open_id', String(row.asset.id));
                              window.location.href = '/assets';
                            }}
                          >
                            Open
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                            onClick={() => {
                              setReassignAsset(row.asset);
                              setReassignToType(LocationType.warehouse);
                              setReassignToId('');
                              setIsReassignModalOpen(true);
                            }}
                          >
                            Move
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Asset assignment history modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Asset history: ${item?.name || ''}`}
        size="lg"
      >
        {isLoadingHistory ? (
          <div className="text-gray-500">Loading...</div>
        ) : historyEvents.length === 0 ? (
          <div className="text-gray-500">No history</div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="min-w-max w-full table-auto">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <th className="px-4 py-2 text-left whitespace-nowrap">Date</th>
                    <th className="px-4 py-2 text-left whitespace-nowrap">Action</th>
                    <th className="px-4 py-2 text-left whitespace-nowrap">Inventory</th>
                    <th className="px-4 py-2 text-left whitespace-nowrap">Vendor + Model</th>
                    <th className="px-4 py-2 text-left whitespace-nowrap">Serial</th>
                    <th className="px-4 py-2 text-left whitespace-nowrap">From</th>
                    <th className="px-4 py-2 text-left whitespace-nowrap">To</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {historyEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                        {formatDateOnly(ev.moved_at)}
                      </td>
                      <td className="px-4 py-2 text-sm whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs ${ev.action === 'assigned' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                          {ev.action === 'assigned' ? 'Assigned' : 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {ev.asset.inventory_number}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                        {ev.asset.vendor} {ev.asset.model}
                      </td>
                      <td className="px-4 py-2 text-sm font-mono text-gray-600 whitespace-nowrap">
                        {ev.asset.serial_number}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                        {getLocationLabel(ev.from_type, ev.from_id)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                        {getLocationLabel(ev.to_type, ev.to_id)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

