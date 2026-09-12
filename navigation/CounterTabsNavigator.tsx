import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Text } from 'react-native';

import { colors } from '../lib/theme';
import { CounterScreen } from '../screens/counter/CounterScreen';
import { GroupsScreen } from '../screens/groups/GroupsScreen';
import { MapScreen } from '../screens/map/MapScreen';
import { StatsScreen } from '../screens/stats/StatsScreen';
import { CounterTabParamList, RootStackParamList } from './types';

const Tab = createBottomTabNavigator<CounterTabParamList>();

const TAB_ICONS: Record<keyof CounterTabParamList, string> = {
  Compteur: '🔘',
  Statistiques: '📊',
  Groupes: '🏆',
  Carte: '🗺️',
};

type Props = NativeStackScreenProps<RootStackParamList, 'CounterTabs'>;

export function CounterTabsNavigator({ route }: Props) {
  const { counterId } = route.params;

  return (
    <Tab.Navigator
      initialRouteName="Compteur"
      screenOptions={({ route: tabRoute }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.background,
          // Sur grand écran (web desktop), recentre la barre plutôt que de
          // l'étirer sur toute la largeur : mise en page pensée pour mobile.
          maxWidth: 480,
          width: '100%',
          alignSelf: 'center',
        },
        tabBarIcon: () => (
          <Text style={{ fontSize: 18 }}>
            {TAB_ICONS[tabRoute.name as keyof CounterTabParamList]}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Compteur" component={CounterScreen} initialParams={{ counterId }} />
      <Tab.Screen name="Statistiques" component={StatsScreen} initialParams={{ counterId }} />
      <Tab.Screen name="Groupes" component={GroupsScreen} initialParams={{ counterId }} />
      <Tab.Screen name="Carte" component={MapScreen} initialParams={{ counterId }} />
    </Tab.Navigator>
  );
}
