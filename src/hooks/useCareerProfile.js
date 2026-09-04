// Re-exports the shared Context-backed hook — see context/CareerProfileContext.jsx.
// Moved off a plain per-screen hook (each mount fired its own independent
// fetch, and React Navigation keeps prior stack screens mounted underneath,
// so navigating between CV Builder screens stacked up duplicate simultaneous
// requests that were enough on their own to trip the rate limiter).
export { useCareerProfile } from '../context/CareerProfileContext';
