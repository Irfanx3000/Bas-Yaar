import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

const CURRENCY_PREFIX = { USD: '$', INR: '₹', EUR: '€', GBP: '£', AED: 'AED ', KWD: 'KWD ', SGD: 'S$' };

const currencyPrefix = (code) => CURRENCY_PREFIX[code] || (code ? `${code} ` : '');

const formatSalaryRange = (salary) => {
  if (!salary || (salary.min == null && salary.max == null)) return '';
  const prefix = currencyPrefix(salary.currency);
  const fmt = (n) => (typeof n === 'number' ? n.toLocaleString() : n);
  if (salary.min != null && salary.max != null) {
    return `${prefix}${fmt(salary.min)} - ${prefix}${fmt(salary.max)}`;
  }
  return `${prefix}${fmt(salary.min ?? salary.max)}`;
};

const formatLocation = (location) => {
  if (!location) return '';
  const { city, country } = location;
  if (city && country) return `${city}, ${country}`;
  return city || country || '';
};

// Adapts a backend Job document into the flat shape the existing Jobs UI
// (JobCard, JobDetailsScreen, etc.) already expects, so those components
// don't need to change.
export const mapJobFromApi = (apiJob) => {
  if (!apiJob) return null;
  return {
    id: apiJob._id,
    title: apiJob.title,
    salary: formatSalaryRange(apiJob.salary),
    salaryUnit: apiJob.salary?.period === 'year' ? '/ year' : '/ month',
    location: formatLocation(apiJob.location),
    type: apiJob.employmentType,
    isFeatured: !!apiJob.featured,
    minimumTier: apiJob.minimumTier || 'start',
    urgent: !!apiJob.urgent,
    logo: apiJob.company?.logoUrl || null,
    companyName: apiJob.company?.name || '',
    department: apiJob.department,
    rank: apiJob.rank,
    designation: apiJob.designation,
    category: apiJob.category,
    vesselType: apiJob.vesselType,
    vesselName: apiJob.vesselName,
    description: apiJob.description || '',
    responsibilities: apiJob.responsibilities || [],
    requirements: apiJob.requirements || [],
    requiredSkills: apiJob.requiredSkills || [],
    requiredCertificates: apiJob.requiredCertificates || [],
    benefits: apiJob.benefits || [],
    vacancies: apiJob.vacancies,
    applicationDeadline: apiJob.applicationDeadline,
    joiningDate: apiJob.joiningDate,
    status: apiJob.status,
  };
};

const buildJobQueryParams = ({
  page, limit, search, keyword, location, departments, vesselTypes, category,
  rank, country, employmentType, minSalary, maxSalary, featured, urgent, sort,
} = {}) => {
  const params = {};
  if (page) params.page = page;
  if (limit) params.limit = limit;

  // The search bar's free-text keyword and location fields both map onto the
  // backend's single full-text `search` param (its text index already covers
  // title/company/department/rank/vesselType/location).
  const searchTerm = (search ?? [keyword, location].filter(Boolean).join(' ')).trim();
  if (searchTerm) params.search = searchTerm;

  if (Array.isArray(departments) && departments.length) params.department = departments.join(',');
  if (Array.isArray(vesselTypes) && vesselTypes.length) params.vesselType = vesselTypes.join(',');
  // Accepts either a single category (Home screen's category cards, which pass
  // one name) or an array (the Jobs filter sheet's multi-select). The backend
  // already runs `category` through parseCsvFilter, so a comma-joined list
  // needs no server change.
  if (Array.isArray(category)) {
    if (category.length) params.category = category.join(',');
  } else if (category) {
    params.category = category;
  }
  if (rank) params.rank = rank;
  if (country) params.country = country;
  if (employmentType) params.employmentType = employmentType;
  if (minSalary != null) params.minSalary = minSalary;
  if (maxSalary != null) params.maxSalary = maxSalary;
  if (featured != null) params.featured = featured;
  if (urgent != null) params.urgent = urgent;
  if (sort) params.sort = sort;

  return params;
};

export const jobService = {
  getJobs: async (filters = {}) => {
    const { data } = await apiClient.get(ENDPOINTS.JOBS.LIST, {
      params: buildJobQueryParams(filters),
    });
    return {
      jobs: (data.data.jobs || []).map(mapJobFromApi),
      pagination: data.meta?.pagination || { page: 1, limit: filters.limit || 20, total: 0, totalPages: 1 },
    };
  },

  getJobById: async (id) => {
    const { data } = await apiClient.get(ENDPOINTS.JOBS.DETAIL(id));
    return mapJobFromApi(data.data.job);
  },

  getFeaturedJobs: async () => {
    const { data } = await apiClient.get(ENDPOINTS.JOBS.LIST, {
      params: { featured: true, limit: 10, sort: 'newest' },
    });
    return (data.data.jobs || []).map(mapJobFromApi);
  },

  getSubscriptionStatus: async () => {
    // Future API Call: const response = await apiClient.get('/user/subscription'); return response.data;
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { active: false };
  },
};
