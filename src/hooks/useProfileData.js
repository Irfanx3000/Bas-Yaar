import { useEffect, useCallback } from 'react';
import { useProfile } from '../context/ProfileContext';
import { PROFILE_MENU_ITEMS } from '../constants/profile.constants';
import { usePullToRefresh } from './usePullToRefresh';

// Profile screen data — backed by the shared ProfileContext so the header,
// sidebar and this screen all stay in sync.
export function useProfileData() {
  const { profile, completion, loading, refresh } = useProfile();

  // Refresh when the Profile tab mounts (e.g. right after login).
  useEffect(() => {
    refresh();
  }, [refresh]);

  const { refreshing: isRefreshing, onRefresh: handleRefresh } = usePullToRefresh(refresh);

  const handleEditProfile = useCallback(() => {}, []);

  return {
    profile,
    completion,
    menuItems: PROFILE_MENU_ITEMS,
    isLoading: loading && !profile,
    isRefreshing,
    handleRefresh,
    handleEditProfile,
  };
}
