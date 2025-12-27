import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsService, ReportRow } from '../services/reports';
import Button from '../components/common/Button';

type SortField = keyof ReportRow;
type SortDirection = 'asc' | 'desc' | null;

export default function Reports() {
  const [showTable, setShowTable] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['report-data'],
    queryFn: () => reportsService.getData(),
    enabled: false, // Загружать только при нажатии кнопки
  });


  const handleGenerateReport = async () => {
    await refetch();
    setShowTable(true);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedRows = useMemo(() => {
    if (!reportData?.rows || !sortField || !sortDirection) {
      return reportData?.rows || [];
    }

    return [...reportData.rows].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [reportData, sortField, sortDirection]);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '⇅';
    if (sortDirection === 'asc') return '↑';
    if (sortDirection === 'desc') return '↓';
    return '⇅';
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <Button onClick={handleGenerateReport} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Generate Report'}
        </Button>
      </div>

      {showTable && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ border: '1px solid #d1d5db' }}>
              <thead>
                <tr className="bg-gray-100">
                  {[
                    { key: 'device_type' as SortField, label: 'Device Type' },
                    { key: 'vendor_model' as SortField, label: 'Vendor+Model' },
                    { key: 'serial' as SortField, label: 'Serial' },
                    { key: 'inventory' as SortField, label: 'Inventory' },
                    { key: 'location' as SortField, label: 'Location' },
                    { key: 'phone' as SortField, label: 'Phone' },
                  ].map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="px-4 py-2 text-left font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-200 select-none border border-gray-300"
                      style={{
                        border: '1px solid #d1d5db',
                        borderBottom: '2px solid #9ca3af',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span>{col.label}</span>
                        <span className="ml-2 text-xs text-gray-500">{getSortIcon(col.key)}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500 border border-gray-300"
                    >
                      No data available
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((row, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50"
                      style={{
                        borderBottom: index < sortedRows.length - 1 ? '1px solid #d1d5db' : 'none',
                      }}
                    >
                      <td className="px-4 py-2 border border-gray-300 text-sm">{row.device_type}</td>
                      <td className="px-4 py-2 border border-gray-300 text-sm">{row.vendor_model}</td>
                      <td className="px-4 py-2 border border-gray-300 text-sm font-mono">{row.serial}</td>
                      <td className="px-4 py-2 border border-gray-300 text-sm font-mono">{row.inventory}</td>
                      <td className="px-4 py-2 border border-gray-300 text-sm">{row.location}</td>
                      <td className="px-4 py-2 border border-gray-300 text-sm">{row.phone}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {sortedRows.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-300 text-sm text-gray-600">
              Total: {sortedRows.length} items
            </div>
          )}
        </div>
      )}

      {!showTable && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="font-semibold mb-2">Report includes:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Device Type</li>
            <li>• Vendor + Model</li>
            <li>• Serial Number</li>
            <li>• Inventory Number</li>
            <li>• Location</li>
            <li>• Phone Number</li>
          </ul>
          <p className="mt-4 text-sm text-gray-500">
            Click "Generate Report" to view the data in a sortable table.
          </p>
        </div>
      )}
    </div>
  );
}
