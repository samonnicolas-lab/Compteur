export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type RootStackParamList = {
  Home: undefined;
  CreateCounter: undefined;
  JoinCounter: undefined;
  CounterTabs: { counterId: string };
  CounterSettings: { counterId: string };
};

export type CounterTabParamList = {
  Compteur: { counterId: string };
  Statistiques: { counterId: string };
  Groupes: { counterId: string };
  Carte: { counterId: string };
};
