import { useEffect, useState } from 'react';
import { jobTaxonomyService } from '../services/jobTaxonomy.service';
import { DEPARTMENTS, VESSEL_TYPES } from '../constants/maritime.constants';

// Fetches the admin-managed Department/Vessel Type lists once on mount,
// starting from the static constants as an immediate fallback so callers
// (Jobs filter, Saved Jobs filter, Maritime Profile onboarding) never render
// an empty dropdown — e.g. offline at cold start — then replacing with live
// data once the fetch resolves.
export function useJobTaxonomyOptions() {
  const [departmentOptions, setDepartmentOptions] = useState(DEPARTMENTS);
  const [vesselTypeOptions, setVesselTypeOptions] = useState(VESSEL_TYPES);
  // No static fallback for categories — unlike departments/vessel types there
  // is no constants-file mirror of them, and the one consumer (the Jobs filter
  // sheet) hides its Category section while this is empty, so an offline cold
  // start degrades to "no category filter" rather than a wrong list.
  const [categoryOptions, setCategoryOptions] = useState([]);

  useEffect(() => {
    jobTaxonomyService.getDepartments().then(setDepartmentOptions).catch(() => {});
    jobTaxonomyService.getVesselTypes().then(setVesselTypeOptions).catch(() => {});
    // getCategories returns the full taxonomy row (it carries an icon for the
    // Home screen's category cards); the filter only needs value/label.
    jobTaxonomyService
      .getCategories()
      .then((list) => setCategoryOptions((list || []).map((c) => ({ value: c.name, label: c.name }))))
      .catch(() => {});
  }, []);

  return { departmentOptions, vesselTypeOptions, categoryOptions };
}
