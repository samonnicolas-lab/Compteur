import {
  DarkTheme,
  NavigationContainer,
  Theme,
  getFocusedRouteNameFromRoute,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { colors } from '../lib/theme';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { CounterSettingsScreen } from '../screens/counter/CounterSettingsScreen';
import { CreateCounterWizard } from '../screens/createCounter/CreateCounterWizard';
import { HomeScreen } from '../screens/home/HomeScreen';
import { JoinCounterScreen } from '../screens/joinCounter/JoinCounterScreen';
import { CounterTabsNavigator } from './CounterTabsNavigator';
import { AuthStackParamList, RootStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const RecoveryStack = createNativeStackNavigator();

const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    // Transparent (pas colors.background) pour laisser voir l'image de fond
    // posée par AppBackground derrière chaque écran ; les en-têtes/barres
    // d'onglets restent opaques via leurs propres styles.
    background: 'transparent',
    card: colors.card,
    primary: colors.accent,
    text: colors.text,
    border: colors.card,
  },
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

// Affiché à la place du reste de l'app tant qu'une récupération de mot de
// passe est en cours (voir AuthContext.passwordRecovery) — priment sur
// AuthNavigator/MainNavigator, session de récupération ou non.
function RecoveryNavigator() {
  return (
    <RecoveryStack.Navigator screenOptions={{ headerShown: false }}>
      <RecoveryStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </RecoveryStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Home" component={HomeScreen} />
      <RootStack.Screen
        name="CreateCounter"
        component={CreateCounterWizard}
        options={{
          headerShown: true,
          title: 'Nouveau compteur',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <RootStack.Screen
        name="JoinCounter"
        component={JoinCounterScreen}
        options={{
          headerShown: true,
          title: 'Rejoindre un compteur',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <RootStack.Screen
        name="CounterTabs"
        component={CounterTabsNavigator}
        options={({ route }) => ({
          // L'onglet Compteur gère son propre "en-tête" dans son contenu
          // (icône réglages + lien "Mes Compteurs") : on masque l'en-tête
          // natif seulement sur cet onglet, les 3 autres (Statistiques,
          // Groupes, Carte) le gardent (titre + flèche retour).
          headerShown: (getFocusedRouteNameFromRoute(route) ?? 'Compteur') !== 'Compteur',
          title: 'Compteur',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        })}
      />
      <RootStack.Screen
        name="CounterSettings"
        component={CounterSettingsScreen}
        options={{
          headerShown: true,
          title: 'Réglages',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
    </RootStack.Navigator>
  );
}

export function RootNavigator() {
  const { session, loading, passwordRecovery } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {passwordRecovery ? (
        <RecoveryNavigator />
      ) : session ? (
        <MainNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
