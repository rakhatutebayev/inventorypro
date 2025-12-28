import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsService } from '../services/assets';
import { inventoryService } from '../services/inventory';
import { InventorySession } from '../types';
import BarcodeScanner from '../components/BarcodeScanner';

export default function InventoryScreen() {
  const [activeSession, setActiveSession] = useState<number | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['inventory-sessions'],
    queryFn: () => inventoryService.getSessions(),
  });

  const createSessionMutation = useMutation({
    mutationFn: () => inventoryService.createSession({}),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-sessions'] });
      setActiveSession(session.id);
      Alert.alert('Success', 'Inventory session started');
    },
  });

  const completeSessionMutation = useMutation({
    mutationFn: (id: number) => inventoryService.completeSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-sessions'] });
      setActiveSession(null);
      Alert.alert('Success', 'Inventory session completed');
    },
  });

  const addResultMutation = useMutation({
    mutationFn: ({ sessionId, assetId }: { sessionId: number; assetId: number }) =>
      inventoryService.addResult(sessionId, {
        asset_id: assetId,
        found: true,
      }),
    onSuccess: () => {
      Alert.alert('Success', 'Asset checked in inventory');
    },
  });

  const handleScan = async (data: string) => {
    if (!activeSession) {
      Alert.alert('Error', 'Please start an inventory session first');
      setShowScanner(false);
      return;
    }

    setShowScanner(false);
    try {
      const asset = await assetsService.scan(data);
      addResultMutation.mutate({
        sessionId: activeSession,
        assetId: asset.id,
      });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Asset not found');
    }
  };

  const handleStartSession = () => {
    createSessionMutation.mutate();
  };

  const handleCompleteSession = (id: number) => {
    Alert.alert(
      'Complete Session',
      'Are you sure you want to complete this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => completeSessionMutation.mutate(id),
        },
      ]
    );
  };

  const renderSession = ({ item }: { item: InventorySession }) => (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionId}>Session #{item.id}</Text>
        <Text style={styles.sessionDate}>
          {new Date(item.started_at).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.sessionTime}>
        Started: {new Date(item.started_at).toLocaleTimeString()}
      </Text>
      {item.completed_at && (
        <Text style={styles.sessionTime}>
          Completed: {new Date(item.completed_at).toLocaleTimeString()}
        </Text>
      )}
      {!item.completed_at && (
        <TouchableOpacity
          style={styles.completeButton}
          onPress={() => handleCompleteSession(item.id)}
        >
          <Text style={styles.completeButtonText}>Complete</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (showScanner) {
    return <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        {activeSession && (
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => setShowScanner(true)}
          >
            <Text style={styles.scanButtonText}>📷 Scan</Text>
          </TouchableOpacity>
        )}
      </View>

      {!activeSession && (
        <View style={styles.startSection}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartSession}
            disabled={createSessionMutation.isPending}
          >
            {createSessionMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.startButtonText}>Start New Session</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {activeSession && (
        <View style={styles.activeSession}>
          <Text style={styles.activeSessionText}>
            Active Session: #{activeSession}
          </Text>
          <Text style={styles.instruction}>
            Scan assets to check them in inventory
          </Text>
        </View>
      )}

      <View style={styles.sessionsHeader}>
        <Text style={styles.sessionsTitle}>Sessions</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No sessions found</Text>
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
  startSection: {
    padding: 16,
  },
  startButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  activeSession: {
    backgroundColor: '#dbeafe',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  activeSessionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  instruction: {
    fontSize: 14,
    color: '#1e40af',
  },
  sessionsHeader: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  sessionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  list: {
    padding: 16,
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sessionId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  sessionDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  sessionTime: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  completeButton: {
    backgroundColor: '#10b981',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
