import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { getApiConfig, saveApiBaseUrl, saveApiConfig } from '../config/api';
import { resetApi } from '../services/api';

export default function SettingsScreen() {
  const { logout, user } = useAuthStore();
  const [baseUrl, setBaseUrl] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [useAdvanced, setUseAdvanced] = useState(false);
  const [useHttps, setUseHttps] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const config = await getApiConfig();
    setBaseUrl(config.baseUrl);
    setHost(config.host || 'ams.it-uae.com');
    setPort(config.port || '443');
    setUseHttps((config.protocol || (config.baseUrl.startsWith('https') ? 'https' : 'http')) === 'https');
  };

  const handleSaveConfig = async () => {
    if (!useAdvanced) {
      if (!baseUrl.trim()) {
        Alert.alert('Error', 'Please enter Base URL');
        return;
      }
    } else {
      if (!host.trim() || !port.trim()) {
        Alert.alert('Error', 'Please enter host and port');
        return;
      }
    }

    setLoading(true);
    try {
      if (!useAdvanced) {
        await saveApiBaseUrl(baseUrl.trim());
      } else {
        await saveApiConfig(host.trim(), port.trim(), useHttps ? 'https' : 'http');
      }
      resetApi();
      Alert.alert('Success', 'API configuration saved');
    } catch (error) {
      Alert.alert('Error', 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Info</Text>
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.label}>Username:</Text>
            <Text style={styles.value}>{user.username}</Text>
            <Text style={styles.label}>Role:</Text>
            <Text style={styles.value}>{user.role}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Configuration</Text>
        <Text style={styles.label}>Base URL</Text>
        <TextInput
          style={styles.input}
          value={baseUrl}
          onChangeText={setBaseUrl}
          placeholder="https://ams.it-uae.com/api/v1"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.row}>
          <Text style={[styles.label, { marginTop: 0 }]}>Advanced (host/port)</Text>
          <Switch value={useAdvanced} onValueChange={setUseAdvanced} />
        </View>

        {useAdvanced && (
          <>
            <Text style={styles.label}>Host</Text>
            <TextInput
              style={styles.input}
              value={host}
              onChangeText={setHost}
              placeholder="ams.it-uae.com"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Port</Text>
            <TextInput
              style={styles.input}
              value={port}
              onChangeText={setPort}
              placeholder="443"
              keyboardType="numeric"
            />

            <View style={styles.row}>
              <Text style={[styles.label, { marginTop: 0 }]}>Use HTTPS</Text>
              <Switch value={useHttps} onValueChange={setUseHttps} />
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSaveConfig}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Save Configuration</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1f2937',
  },
  userInfo: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#1f2937',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

