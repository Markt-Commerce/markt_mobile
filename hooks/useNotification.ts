// hooks/useNotifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { request, BASE_URL } from '../services/api';

const SETTINGS_PATH = `${BASE_URL}/users/settings`;

export function useNotifications() {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ['notificationsSettings'],
    queryFn: async () => {
        return request<{ push: boolean; email: boolean; sms: boolean; marketing: boolean }>(SETTINGS_PATH);
    }
  });
}

export function useUpdateNotifications() {
  const qc = useQueryClient();
  return useMutation({ 
    mutationFn: (payload: { push?: boolean; email?: boolean; sms?: boolean; marketing?: boolean }) => request(SETTINGS_PATH, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificationsSettings'] })
  });
}
