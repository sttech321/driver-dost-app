import React from 'react';
import { colors } from '@/theme';
import { Button } from './Button';
import { Icon } from './Icon';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { AuthResult } from '@/api/types';

interface Props {
  onSuccess: (result: AuthResult) => void;
  onError: (msg: string) => void;
}

/**
 * Isolated so the expo-auth-session Google hook only runs when this component
 * is actually mounted. On web that hook throws if no webClientId is set, so
 * the parent screen mounts this ONLY when Google is configured.
 */
export function GoogleSignInButton({ onSuccess, onError }: Props) {
  const google = useGoogleAuth(onSuccess, onError);

  return (
    <Button
      title="Google"
      variant="outline"
      disabled={!google.ready}
      loading={google.busy}
      onPress={() => google.signInWithGoogle()}
      leftIcon={<Icon name="google" size={20} color={colors.primary} />}
    />
  );
}
