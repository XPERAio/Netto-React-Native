import React, { useEffect, useState } from 'react';
import {
  View, StyleSheet, ActivityIndicator, I18nManager,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppStore } from './src/store/useAppStore';
import MainNavigator from './src/navigation/MainNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { Colors } from './src/utils/theme';

// Enable RTL for Hebrew
I18nManager.forceRTL(true);

export default function App() {
  const { isLoggedIn, isLoading, loadPersistedSession } = useAppStore();
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    loadPersistedSession().finally(() => setBootstrapped(true));
  }, []);

  if (!bootstrapped || isLoading) {
    return (
      <View style={s.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {isLoggedIn ? <MainNavigator /> : <OnboardingScreen />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
});
