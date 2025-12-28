# InventoryPro Mobile App

React Native/Expo mobile application for InventoryPro IT Equipment Management System.

## Features

- 🔐 Authentication (JWT)
- 📦 Assets management
- 🔄 Asset movements
- ✓ Inventory sessions
- ⚙️ API configuration (host/port)
- 🔍 QR/Barcode scanning (coming soon)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start Expo:
```bash
npm start
```

3. Run on device/simulator:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## Configuration

The app allows you to configure the API host and port through Settings screen.

Defaults:
- Production: `https://ams.it-uae.com/api/v1`
- You can override via Expo env: `EXPO_PUBLIC_API_BASE_URL`

## Development

- Uses React Navigation for routing
- Zustand for state management
- AsyncStorage for local storage
- Axios for API calls

