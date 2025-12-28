import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsService } from '../services/assets';
import { movementsService } from '../services/movements';
import { referencesService } from '../services/references';
import { LocationType } from '../types';
import BarcodeScanner from '../components/BarcodeScanner';
import { Picker } from '@react-native-picker/picker';

export default function MovementsScreen() {
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [toType, setToType] = useState<LocationType>(LocationType.warehouse);
  const [toId, setToId] = useState<number | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const queryClient = useQueryClient();

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => assetsService.getAll({ limit: 1000 }),
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => referencesService.getWarehouses(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => referencesService.getEmployees(),
  });

  const moveMutation = useMutation({
    mutationFn: (data: { asset_id: number; to_type: string; to_id: number }) =>
      movementsService.create(data),
    onSuccess: () => {
      Alert.alert('Success', 'Asset moved successfully');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setSelectedAssetId(null);
      setToId(null);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to move asset');
    },
  });

  const handleScan = async (data: string) => {
    setShowScanner(false);
    try {
      const asset = await assetsService.scan(data);
      setSelectedAssetId(asset.id);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Asset not found');
    }
  };

  const handleMove = () => {
    if (!selectedAssetId || !toId) {
      Alert.alert('Error', 'Please select asset and destination');
      return;
    }

    moveMutation.mutate({
      asset_id: selectedAssetId,
      to_type: toType,
      to_id: toId,
    });
  };

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);

  return (
    <View style={styles.container}>
      {showScanner && (
        <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}
      
      {!showScanner && (
        <ScrollView style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Move Asset</Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => setShowScanner(true)}
            >
              <Text style={styles.scanButtonText}>📷 Scan</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Asset</Text>
            {selectedAsset ? (
              <View style={styles.assetInfo}>
                <Text style={styles.assetText}>{selectedAsset.inventory_number}</Text>
                <Text style={styles.assetSubtext}>
                  {selectedAsset.vendor} {selectedAsset.model}
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedAssetId(null)}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowScanner(true)}
              >
                <Text style={styles.selectButtonText}>Scan to select asset</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Destination Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={toType}
                onValueChange={(value) => {
                  setToType(value);
                  setToId(null);
                }}
                style={styles.picker}
              >
                <Picker.Item label="Warehouse" value={LocationType.warehouse} />
                <Picker.Item label="Employee" value={LocationType.employee} />
              </Picker>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              Destination {toType === LocationType.warehouse ? 'Warehouse' : 'Employee'}
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={toId}
                onValueChange={(value) => setToId(value)}
                style={styles.picker}
              >
                <Picker.Item label="Select..." value={null} />
                {toType === LocationType.warehouse
                  ? warehouses.map((w) => (
                      <Picker.Item key={w.id} label={w.name} value={w.id} />
                    ))
                  : employees.map((e) => (
                      <Picker.Item key={e.id} label={e.name} value={e.id} />
                    ))}
              </Picker>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.moveButton, moveMutation.isPending && styles.buttonDisabled]}
            onPress={handleMove}
            disabled={moveMutation.isPending}
          >
            {moveMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.moveButtonText}>Move Asset</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
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
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  assetInfo: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  assetText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  assetSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  clearButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ef4444',
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  selectButton: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  picker: {
    backgroundColor: 'transparent',
  },
  moveButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    margin: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  moveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
