import AsyncStorage from '@react-native-async-storage/async-storage';

// Production default (HTTPS)
const DEFAULT_API_URL = 'https://ams.it-uae.com/api/v1';

export interface ApiConfig {
  baseUrl: string;
  host?: string;
  port?: string;
  protocol?: 'http' | 'https';
}

export const getApiConfig = async (): Promise<ApiConfig> => {
  // Preferred: full base URL
  const storedBaseUrl = await AsyncStorage.getItem('api_base_url');
  if (storedBaseUrl && storedBaseUrl.trim()) {
    return { baseUrl: storedBaseUrl.trim() };
  }

  // Expo env (optional): EXPO_PUBLIC_API_BASE_URL
  const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined;
  if (envBaseUrl && envBaseUrl.trim()) {
    return { baseUrl: envBaseUrl.trim() };
  }

  // Backward compatibility: host/port/protocol
  const host = (await AsyncStorage.getItem('api_host')) || 'ams.it-uae.com';
  const port = (await AsyncStorage.getItem('api_port')) || '443';
  const protocol = ((await AsyncStorage.getItem('api_protocol')) || 'https') as 'http' | 'https';

  // If port is default for protocol, omit it
  const isDefaultPort = (protocol === 'https' && port === '443') || (protocol === 'http' && port === '80');
  const baseUrl = isDefaultPort ? `${protocol}://${host}/api/v1` : `${protocol}://${host}:${port}/api/v1`;
  return { baseUrl, host, port, protocol };
};

export const saveApiBaseUrl = async (baseUrl: string): Promise<void> => {
  await AsyncStorage.setItem('api_base_url', baseUrl);
};

export const saveApiConfig = async (host: string, port: string, protocol: 'http' | 'https' = 'https'): Promise<void> => {
  await AsyncStorage.setItem('api_host', host);
  await AsyncStorage.setItem('api_port', port);
  await AsyncStorage.setItem('api_protocol', protocol);
  // also keep base url in sync
  const isDefaultPort = (protocol === 'https' && port === '443') || (protocol === 'http' && port === '80');
  const baseUrl = isDefaultPort ? `${protocol}://${host}/api/v1` : `${protocol}://${host}:${port}/api/v1`;
  await saveApiBaseUrl(baseUrl);
};

