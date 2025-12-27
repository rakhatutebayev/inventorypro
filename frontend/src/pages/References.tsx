import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { referencesService } from '../services/references';
import { Company, DeviceType, Warehouse, Employee } from '../types';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';

type TabType = 'companies' | 'device-types' | 'warehouses' | 'employees';

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
      </div>

      {/* Content */}
      {activeTab === 'companies' && renderCompanies()}
      {activeTab === 'device-types' && renderDeviceTypes()}
      {activeTab === 'warehouses' && renderWarehouses()}
      {activeTab === 'employees' && renderEmployees()}

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
    mutationFn: (data: { name: string; phone: string; position?: string }) =>
      referencesService.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      onClose();
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; phone: string; position?: string } }) =>
      referencesService.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
    }
  };

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({});
    }
  }, [item]);

  const getTitle = () => {
    if (!item) {
      switch (type) {
        case 'companies': return 'Add New Company';
        case 'device-types': return 'Add New Device Type';
        case 'warehouses': return 'Add New Warehouse';
        case 'employees': return 'Add New Employee';
        default: return 'Add New';
      }
    } else {
      switch (type) {
        case 'companies': return 'Edit Company';
        case 'device-types': return 'Edit Device Type';
        case 'warehouses': return 'Edit Warehouse';
        case 'employees': return 'Edit Employee';
        default: return 'Edit';
      }
    }
  };

  const title = getTitle();

  return (
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
  );
}

