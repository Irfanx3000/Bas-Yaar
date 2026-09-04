import React, {
  createContext,
  useContext,
  useMemo,
  useEffect,
} from 'react';
import { profileService } from '../services/profile.service';
import { tokenStorage } from '../api/tokenStorage';
import { useSyncedResource } from '../hooks/useSyncedResource';

// Single source of truth for the logged-in user's profile, shared across the
// whole app (home header, sidebar, profile screen, edit sheet) so every place
// shows the same, always-fresh details.
//
// The avatar not appearing outside the Profile tab was this context failing
// its first fetch and never retrying. useProfileData (the Profile screen's
// hook) calls refresh() on its own mount, so opening that tab was the only
// thing in the entire app that gave this a second chance — which is precisely
// why the photo showed up there and nowhere else until it did. Registered
// with dataSync now, so a reconnect or a login refreshes it wherever the user
// happens to be standing.
const ProfileContext = createContext({
  profile: null,
  completion: { percentage: 0, message: '' },
  loading: false,
  refresh: async () => {},
  refreshIfStale: async () => {},
  setProfile: () => {},
});

export function ProfileProvider({ children }) {
  const {
    data: profile,
    setData: setProfile,
    refresh,
    refreshIfStale,
    isFetching,
  } = useSyncedResource('profile', profileService.getProfile, {
    staleTime: 120000,
  });

  // On mount: seed instantly from the cached user (stored at login) so the name
  // is shown immediately — no hardcoded/placeholder flash — then the full
  // profile (avatar, rank, completion…) arrives from the API.
  useEffect(() => {
    let mounted = true;
    tokenStorage
      .getUser()
      .then((u) => {
        if (!mounted || !u?.name) return;
        setProfile((prev) => prev || {
          id: u.id,
          firstName: u.name.split(' ')[0] || '',
          lastName: u.name.split(' ').slice(1).join(' '),
          name: u.name,
          email: u.email || '',
          phone: u.phone || '',
          rank: null,
          location: null,
          avatarUrl: null,
          profileCompletion: 0,
          maritimeProfile: {},
        });
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [setProfile]);

  // Derived rather than held in its own state: it is a pure function of the
  // profile, and keeping a second copy meant a refresh could update one and
  // not the other.
  const completion = useMemo(
    () => ({
      percentage: profile?.profileCompletion ?? 0,
      message: 'Complete profile to get better job matches',
    }),
    [profile],
  );

  const value = useMemo(
    () => ({ profile, completion, loading: isFetching, refresh, refreshIfStale, setProfile }),
    [profile, completion, isFetching, refresh, refreshIfStale, setProfile],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export const useProfile = () => useContext(ProfileContext);
