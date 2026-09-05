import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { Button } from '../../components/Button';
import { ScreenContainer } from '../../components/ScreenContainer';
import { TextField } from '../../components/TextField';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing } from '../../lib/theme';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!pseudo.trim() || !email || password.length < 6) {
      Alert.alert(
        'Formulaire incomplet',
        'Choisissez un pseudo, un email valide et un mot de passe d’au moins 6 caractères.'
      );
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), password, pseudo.trim());
      Alert.alert(
        'Compte créé',
        'Vérifiez votre email si une confirmation est requise, puis connectez-vous.'
      );
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Inscription impossible', (error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer style={styles.container}>
      <Text style={styles.title}>Créer un compte</Text>

      <TextField label="Pseudo" value={pseudo} onChangeText={setPseudo} placeholder="Votre pseudo" />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="vous@exemple.com"
      />
      <TextField
        label="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="6 caractères minimum"
      />

      <Button label="S’inscrire" onPress={handleSubmit} loading={loading} />
      <Button
        label="J’ai déjà un compte"
        variant="ghost"
        onPress={() => navigation.navigate('Login')}
        style={styles.secondaryAction}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.accent,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  secondaryAction: {
    marginTop: spacing.sm,
  },
});
