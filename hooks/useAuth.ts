// hooks/useAuth.ts
import { useMutation } from '@tanstack/react-query';
import { request } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
        await request('/users/logout', { method: 'POST' });
        // clear local storage / auth caches
        await AsyncStorage.clear();
        return true;
      }
  });
}

export function useSendEmailVerification() {
  return useMutation(
    {
        mutationFn: (email: string) => request('/users/email-verfication/send', { method: 'POST', body: JSON.stringify({ email }) })
    }
  );
}

export function usePasswordResetConfirm() {
  return useMutation({
    mutationFn: (payload: { code: string; new_password: string; email: string }) =>
    request('/users/password-reset/confirm', { method: 'POST', body: JSON.stringify(payload) })
  }
  );
}
