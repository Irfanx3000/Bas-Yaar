import { useCallback, useEffect, useState } from 'react';
import { searchService } from '../services/search.service';
import { jobService } from '../services/job.service';

// Owns the Search Results screen's state: the query itself, its grouped
// results (today: Jobs only — app scope, see search.service.js on the
// backend), and resolving a tapped result's full Job record (the search
// endpoint returns a lightweight { id, title, subtitle } row; JobDetailsScreen
// needs the full job object, same as JobsScreen's existing flow).
//
// A query that matches nothing also loads `suggestedJobs` — the same
// Featured Jobs list Home shows, reused here as "here's something else you
// might like" instead of leaving the screen with nothing but a "no results"
// message (mirrors the "no results, showing related products" pattern many
// shopping apps use for an empty search).
export function useSearchResults(initialQuery) {
  const [query, setQuery] = useState(initialQuery || '');
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestedJobs, setSuggestedJobs] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const loadSuggestedJobs = useCallback(async () => {
    setIsLoadingSuggestions(true);
    try {
      const jobs = await jobService.getFeaturedJobs();
      setSuggestedJobs(jobs);
    } catch {
      setSuggestedJobs([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  const runSearch = useCallback(async (term) => {
    const trimmed = (term || '').trim();
    setQuery(trimmed);
    if (trimmed.length < 2) {
      setGroups([]);
      setError(null);
      setSuggestedJobs([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const results = await searchService.search(trimmed);
      setGroups(results);
      const jobsResult = results.find((g) => g.entityType === 'jobs');
      if (!jobsResult || jobsResult.results.length === 0) {
        loadSuggestedJobs();
      } else {
        setSuggestedJobs([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load search results.');
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, [loadSuggestedJobs]);

  useEffect(() => {
    runSearch(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const jobsGroup = groups.find((g) => g.entityType === 'jobs') || null;

  const resolveJob = useCallback((id) => jobService.getJobById(id), []);

  return {
    query,
    jobsGroup,
    isLoading,
    error,
    runSearch,
    resolveJob,
    suggestedJobs,
    isLoadingSuggestions,
  };
}
