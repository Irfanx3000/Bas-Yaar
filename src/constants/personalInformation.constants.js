export const PERSONAL_INFO_CONSTANTS = {
  SCREEN_TITLE: 'Personal Information',
  SCREEN_SUBTITLE: 'Update your basic personal details',
  SAVE_BUTTON: 'Save Changes',

  SECTIONS: {
    PHOTO: 'Profile Photo',
    BASIC: 'Basic Details',
    CONTACT: 'Contact Details',
    LOCATION: 'Location',
  },

  LABELS: {
    FULL_NAME: 'Full Name',
    DOB: 'Date of Birth',
    GENDER: 'Gender',
    NATIONALITY: 'Nationality',
    MARITAL_STATUS: 'Marital Status',
    EMAIL: 'Email Address',
    PHONE: 'Phone Number',
    ALT_PHONE: 'Alternate Phone (Optional)',
    LOCATION: 'Current Location',
  },

  PLACEHOLDERS: {
    FULL_NAME: 'Enter full name',
    DOB: 'Select date of birth',
    GENDER: 'Select gender',
    NATIONALITY: 'Select nationality',
    MARITAL_STATUS: 'Select marital status',
    EMAIL: 'Enter email address',
    PHONE: 'Enter phone number',
    ALT_PHONE: 'Enter alternate phone number',
    LOCATION: 'Select current location',
  },

  VALIDATION: {
    REQUIRED: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_PHONE: 'Please enter a valid phone number',
    MIN_AGE: 18,
    MIN_AGE_ERROR: 'You must be at least 18 years old',
    MAX_AGE: 100,
    MAX_AGE_ERROR: 'Please enter a realistic date of birth',
    FUTURE_DOB_ERROR: 'Date of birth cannot be in the future',
    INVALID_DATE_ERROR: 'Enter a valid date as DD-MM-YYYY',
    FILE_SIZE_LIMIT: 5 * 1024 * 1024, // 5MB
    FILE_SIZE_ERROR: 'File size exceeds 5MB limit',
    FILE_TYPE_ERROR: 'Invalid file type. Only JPG and PNG are supported',
  },

  GENDER_OPTIONS: [
    { label: 'Male', value: 'male', labelKey: 'profile.personalInfo.options.gender.male' },
    { label: 'Female', value: 'female', labelKey: 'profile.personalInfo.options.gender.female' },
    { label: 'Other', value: 'other', labelKey: 'profile.personalInfo.options.gender.other' },
  ],

  MARITAL_STATUS_OPTIONS: [
    { label: 'Single', value: 'single', labelKey: 'profile.personalInfo.options.maritalStatus.single' },
    { label: 'Married', value: 'married', labelKey: 'profile.personalInfo.options.maritalStatus.married' },
  ],

  NATIONALITIES: [
    { label: 'Indian', value: 'IN' },
    { label: 'American', value: 'US' },
    { label: 'Filipino', value: 'PH' },
    { label: 'British', value: 'GB' },
    { label: 'Ukrainian', value: 'UA' },
    { label: 'Indian', value: 'Indian' },
  ],

  LOCATIONS: [
    { label: 'Mumbai, Maharashtra', value: 'Mumbai, Maharashtra' },
    { label: 'Delhi, India', value: 'Delhi, India' },
    { label: 'Miami, USA', value: 'Miami, USA' },
    { label: 'Manila, Philippines', value: 'Manila, Philippines' },
    { label: 'London, UK', value: 'London, UK' },
  ],
};
