import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '../../components/Button';
import { ScreenContainer } from '../../components/ScreenContainer';
import { TextField } from '../../components/TextField';
import { useAuth } from '../../contexts/AuthContext';
import { alert } from '../../lib/alert';
import { colors, spacing } from '../../lib/theme';

// Affiché à la place du reste de l'app quand Supabase signale une session de
// récupération de mot de passe (lien reçu par email cliqué) — voir
// AuthContext (passwordRecovery) et RootNavigator.
export function ResetPasswordScreen() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (password.length < 6) {
      alert('Mot de passe trop court', 'Choisissez un mot de passe d’au moins 6 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas', 'Vérifiez la confirmation.');
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      alert('Mot de passe mis à jour', 'Vous êtes maintenant connecté avec votre nouveau mot de passe.');
    } catch (error) {
      alert('Erreur', (error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer style={styles.container}>
      <Text style={styles.title}>Nouveau mot de passe</Text>
      <Text style={styles.subtitle}>Choisissez le mot de passe que vous utiliserez désormais.</Text>

      <TextField
        label="Nouveau mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="6 caractères minimum"
      />
      <TextField
        label="Confirmer le mot de passe"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholder="6 caractères minimum"
      />

      <Button label="Valider" onPress={handleSubmit} loading={loading} />
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
});
