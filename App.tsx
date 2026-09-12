import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AlertHost } from './components/AlertHost';
import { AppBackground } from './components/AppBackground';
import { AuthProvider } from './contexts/AuthContext';
import { RootNavigator } from './navigation/RootNavigator';

export default function App() {
  return (
    <AppBackground>
      <SafeAreaProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
        <StatusBar style="light" />
        <AlertHost />
      </SafeAreaProvider>
    </AppBackground>
  );
}
