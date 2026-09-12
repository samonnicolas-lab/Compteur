import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '../../components/Button';
import { ScreenContainer } from '../../components/ScreenContainer';
import { TextField } from '../../components/TextField';
import { useAuth } from '../../contexts/AuthContext';
import { alert } from '../../lib/alert';
import { colors, spacing } from '../../lib/theme';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) {
      alert('Email manquant', 'Merci de renseigner votre adresse email.');
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      alert(
        'Email envoyé',
        'Si un compte existe avec cette adresse, un lien de réinitialisation vient de lui être envoyé. Pensez à vérifier vos courriers indésirables.'
      );
      navigation.navigate('Login');
    } catch (error) {
      alert('Erreur', (error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer style={styles.container}>
      <Text style={styles.title}>Mot de passe oublié</Text>
      <Text style={styles.subtitle}>
        Indiquez votre email, nous vous enverrons un lien pour choisir un nouveau mot de passe.
      </Text>

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="vous@exemple.com"
      />

      <Button label="Envoyer le lien" onPress={handleSubmit} loading={loading} />
      <Button
        label="Retour à la connexion"
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  secondaryAction: {
    marginTop: spacing.sm,
  },
});
