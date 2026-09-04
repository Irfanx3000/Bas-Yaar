import { useState, useCallback, useEffect } from 'react';
import { applicationService } from '../services/application.service';

const EMPTY = {
  eligible: false,
  hasActiveSubscription: false,
  hasRequiredDocuments: false,
  requiredDocuments: [],
  missingDocuments: [],
  jobIsOpen: true,
  alreadyApplied: false,
  meetsTierRequirement: true,
  jobMinimumTier: 'start',
  userTier: null,
  applicationsUsed: 0,
  applicationLimit: null,
  applicationsRemaining: null,
};

// Single source of truth for "can this user apply to this job right now" —
// combines document-completeness and subscription status in one atomic,
// server-computed snapshot (the backend enforces the same check at apply-time,
// so the UI's only job is to display the same truth, not recompute it).
export function useApplicationEligibility(jobId) {
  const [state, setState] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!jobId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const eligibility = await applicationService.getEligibility(jobId);
      setState(eligibility);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, loading, error, refresh };
}
