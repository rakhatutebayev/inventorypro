import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { assetsService } from '../services/assets';
import { referencesService } from '../services/references';
import { Asset, LocationType } from '../types';
import BarcodeScanner from '../components/BarcodeScanner';

export default function AssetsScreen() {
  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets', search],
    queryFn: () => assetsService.getAll({ search, limit: 100 }),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => referencesService.getEmployees(),
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => referencesService.getWarehouses(),
  });

  const handleScan = async (data: string) => {
    setShowScanner(false);
    try {
      const asset = await assetsService.scan(data);
      Alert.alert(
        'Asset Found',
        `${asset.inventory_number}\n${asset.vendor} ${asset.model}\nSerial: ${asset.serial_number}`
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Asset not found');
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

  const renderAsset = ({ item }: { item: Asset }) => (
    <TouchableOpacity style={styles.assetCard}>
      <View style={styles.assetHeader}>
        <Text style={styles.inventoryNumber}>{item.inventory_number}</Text>
        <Text style={styles.vendorModel}>{item.vendor} {item.model}</Text>
      </View>
      <Text style={styles.serial}>Serial: {item.serial_number}</Text>
      <Text style={styles.location}>
        Location: {getLocationName(item.location_type, item.location_id)}
      </Text>
    </TouchableOpacity>
  );

  if (showScanner) {
    return <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Assets</Text>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setShowScanner(true)}
        >
          <Text style={styles.scanButtonText}>📷 Scan</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by inventory, serial, vendor..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={assets}
          renderItem={renderAsset}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No assets found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  scanButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  list: {
    padding: 16,
  },
  assetCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  assetHeader: {
    marginBottom: 8,
  },
  inventoryNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  vendorModel: {
    fontSize: 16,
    color: '#4b5563',
  },
  serial: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#6b7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
});
