export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type RootStackParamList = {
  Home: undefined;
  CreateCounter: undefined;
  CounterTabs: { counterId: string };
};

export type CounterTabParamList = {
  Compteur: { counterId: string };
  Statistiques: { counterId: string };
  Groupes: { counterId: string };
  Carte: { counterId: string };
};
