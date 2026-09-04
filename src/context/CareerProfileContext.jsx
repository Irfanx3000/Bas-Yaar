import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { careerProfileService } from '../services/careerProfile.service';

// Single shared source of truth for the Career Profile, mirroring
// ProfileContext.jsx's pattern. Previously this was a plain (non-shared)
// hook — every screen that called it fired its own independent fetch on
// mount, and since React Navigation keeps earlier stack screens mounted
// underneath, navigating CareerProfile -> ResumeEditor -> EntryEditor
// stacked up 3+ simultaneous fetches of the same data, which was enough on
// its own to trip the backend's general rate limiter. One shared instance
// here means N mounted screens share ONE fetch instead of N of them.
const CareerProfileContext = createContext(null);

export function CareerProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const inFlight = useRef(false);
  const loaded = useRef(false); // has a successful fetch ever completed

  // silent:true (pull-to-refresh) skips the isLoading flip — CareerProfileScreen
  // gates its entire render on this flag, so flipping it on every refresh
  // would blank the whole screen out instead of keeping content visible
  // under the native pull spinner.
  const load = useCallback(async (force = false, { silent = false } = {}) => {
    if (inFlight.current) return;
    if (loaded.current && !force) return;
    inFlight.current = true;
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const data = await careerProfileService.getCareerProfile();
      setProfile(data);
      loaded.current = true;
    } catch (err) {
      console.error('Error loading career profile:', err);
      setError(err.message || 'Failed to load career profile.');
    } finally {
      inFlight.current = false;
      if (!silent) setIsLoading(false);
    }
  }, []);

  const updateCareerObjective = useCallback(async (careerObjective) => {
    const updated = await careerProfileService.updateCareerObjective(careerObjective);
    setProfile(updated);
  }, []);

  const addEntry = useCallback(async (section, entry) => {
    await careerProfileService.addEntry(section, entry);
    await load(true);
  }, [load]);

  const updateEntry = useCallback(async (section, entryId, entry) => {
    await careerProfileService.updateEntry(section, entryId, entry);
    await load(true);
  }, [load]);

  const removeEntry = useCallback(async (section, entryId) => {
    await careerProfileService.removeEntry(section, entryId);
    await load(true);
  }, [load]);

  // Must be referentially stable, NOT an inline arrow in the value object
  // below — CareerProfileScreen.jsx passes this into its own
  // useCallback/useFocusEffect dependency array. An inline `() => load(true)`
  // gets a new identity every render, which never lets that dependency
  // array settle: effect fires -> fetch -> state update -> re-render -> new
  // `reload` reference -> effect "changed" -> fires again, forever (this is
  // the "My CV keeps reloading and never stops" bug).
  const reload = useCallback((opts) => load(true, opts), [load]);

  return (
    <CareerProfileContext.Provider
      value={{
        profile,
        isLoading,
        error,
        load,
        reload,
        updateCareerObjective,
        addEntry,
        updateEntry,
        removeEntry,
      }}
    >
      {children}
    </CareerProfileContext.Provider>
  );
}

// Matches the old standalone hook's exact return shape, so no consuming
// screen needs to change — but the underlying fetch now happens at most
// once per app session (per `loaded` above) no matter how many screens
// mount this hook, instead of once per screen mount.
export function useCareerProfile() {
  const ctx = useContext(CareerProfileContext);
  if (!ctx) throw new Error('useCareerProfile must be used inside CareerProfileProvider');
  const { load } = ctx;

  useEffect(() => {
    load();
  }, [load]);

  return ctx;
}
