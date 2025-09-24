// hooks/useNotifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from '../services/api';

// Mock endpoint paths used internally; you will swap with real endpoints later.
const MOCK_PATH = '/mock/notifications';

export function useNotifications() {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ['notificationsSettings'],
    queryFn: async () => {
        // Mock fetch - simulate server response
        // If you later have /users/notifications, change this.
        try {
          const res = await request<{ push: boolean; email: boolean; sms: boolean }>(MOCK_PATH);
          return res;
        } catch (e) {
          // fallback mocked default
          return { push: true, email: false, sms: true };
        }
    }
  });
}

export function useUpdateNotifications() {
  const qc = useQueryClient();
  return useMutation({ 
    mutationFn: (payload: { push?: boolean; email?: boolean; sms?: boolean }) => request(MOCK_PATH, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificationsSettings'] })
  });
}

