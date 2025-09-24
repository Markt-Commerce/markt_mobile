// hooks/useProfileMutations.ts
import { useMutation } from '@tanstack/react-query';
import { request } from '../services/api';
//import { useInvalidateUser } from './useUser';

export function usePatchGeneralProfile() {
  //const invalidate = useInvalidateUser();
  return useMutation({
    mutationFn: (payload: { profile_picture?: string; phone_number?: string }) =>
    request('/users/profile', { method: 'PATCH', body: JSON.stringify(payload) })
  , onSuccess: () => console.log('General profile updated'), // you can also call invalidate() here if needed
  });
}

export function usePatchBuyerProfile() {
  //const invalidate = useInvalidateUser();
  return useMutation(
    {
        mutationFn: (payload: { buyername?: string; shipping_address?: any }) => request('/users/profile/buyer', { method: 'PATCH', body: JSON.stringify(payload) }), 
        onSuccess: () => console.log('General profile updated'), // you can also call invalidate() here if needed
    }
  );
}

export function usePatchSellerProfile() {
  //const invalidate = useInvalidateUser();
  return useMutation({
    mutationFn: (payload: { description?: string; policies?: any; shop_name?: string; category_ids?: number[] }) => request('/users/profile/seller', { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => console.log('General profile updated'), // you can also call invalidate() here if needed
  });
}
