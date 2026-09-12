import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchCounterById } from '../lib/api';
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

export function CounterTabsNavigator({ route, navigation }: Props) {
  const { counterId } = route.params;
  const insets = useSafeAreaInsets();

  // Affiche le nom du compteur dans le header (voir RootNavigator), qui
  // porte aussi le bouton retour vers l'Accueil.
  useEffect(() => {
    fetchCounterById(counterId)
      .then((counter) => navigation.setOptions({ title: counter.name }))
      .catch(() => {});
  }, [counterId, navigation]);

  return (
    <>
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
      {/* Sur le web (iPhone notamment), la barre d'onglets ne couvre pas
          toujours correctement la zone d'encoche/bandeau du bas une fois le
          fond opaque retiré (voir AppBackground) : on comble explicitement
          cette bande avec la couleur de la barre, plutôt que de laisser
          l'image de fond apparaître derrière. */}
      {insets.bottom > 0 && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: insets.bottom,
            backgroundColor: colors.card,
          }}
        />
      )}
    </>
  );
}
