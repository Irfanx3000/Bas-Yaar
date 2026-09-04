import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { resumeConfigurationService } from '../services/resumeConfiguration.service';
import { resumeTemplateService } from '../services/resumeTemplate.service';

// Single shared source of truth for the user's named resumes + the template
// gallery — see CareerProfileContext.jsx for why this moved from a plain
// per-screen hook to a shared context (duplicate simultaneous fetches from
// stacked navigation screens were enough to trip the rate limiter).
const ResumeConfigurationsContext = createContext(null);

export function ResumeConfigurationsProvider({ children }) {
  const [resumes, setResumes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const inFlight = useRef(false);
  const loaded = useRef(false);

  const load = useCallback(async (force = false) => {
    if (inFlight.current) return;
    if (loaded.current && !force) return;
    inFlight.current = true;
    setIsLoading(true);
    try {
      const [resumesData, templatesData] = await Promise.all([
        resumeConfigurationService.getResumes(),
        resumeTemplateService.getActiveTemplates(),
      ]);
      setResumes(resumesData);
      setTemplates(templatesData);
      loaded.current = true;
    } catch (err) {
      console.error('Error loading resumes:', err);
    } finally {
      inFlight.current = false;
      setIsLoading(false);
    }
  }, []);

  const createResume = useCallback(async (payload) => {
    const resume = await resumeConfigurationService.createResume(payload);
    await load(true);
    return resume;
  }, [load]);

  const updateResume = useCallback(async (id, payload) => {
    const resume = await resumeConfigurationService.updateResume(id, payload);
    await load(true);
    return resume;
  }, [load]);

  const deleteResume = useCallback(async (id) => {
    await resumeConfigurationService.deleteResume(id);
    await load(true);
  }, [load]);

  // The only action that actually produces a PDF — explicit, never implicit.
  const generateResume = useCallback(async (id) => {
    setIsGenerating(true);
    try {
      const doc = await resumeConfigurationService.renderResume(id);
      await load(true);
      return doc;
    } finally {
      setIsGenerating(false);
    }
  }, [load]);

  // Must be referentially stable — see CareerProfileContext.jsx's identical
  // `reload` comment for why an inline arrow here caused an infinite
  // reload loop on the "My CV" screen.
  const reload = useCallback(() => load(true), [load]);

  return (
    <ResumeConfigurationsContext.Provider
      value={{
        resumes,
        templates,
        isLoading,
        isGenerating,
        load,
        reload,
        createResume,
        updateResume,
        deleteResume,
        generateResume,
      }}
    >
      {children}
    </ResumeConfigurationsContext.Provider>
  );
}

// Matches the old standalone hook's exact return shape — see
// CareerProfileContext.js's useCareerProfile() for the same "fetch at most
// once per app session, no matter how many screens mount this" mechanism.
export function useResumeConfigurations() {
  const ctx = useContext(ResumeConfigurationsContext);
  if (!ctx) throw new Error('useResumeConfigurations must be used inside ResumeConfigurationsProvider');
  const { load } = ctx;

  useEffect(() => {
    load();
  }, [load]);

  return ctx;
}
