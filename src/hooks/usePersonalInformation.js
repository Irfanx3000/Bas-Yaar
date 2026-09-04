import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { personalInformationService } from '../services/personalInformation.service';
import { PERSONAL_INFO_CONSTANTS } from '../constants/personalInformation.constants';
import { getPhoneLengthRange } from '../constants/phoneLength.constants';
import { parseDDMMYYYY, calculateAge } from '../utils/dateValidation';
import { showAlert } from '../utils/alertRef';
import { getErrorMessage } from '../i18n/getErrorMessage';

export function usePersonalInformation(onSaveSuccess) {
  const { t } = useTranslation();
  const [formValues, setFormValues] = useState({
    fullName: '',
    dob: '',
    gender: '',
    nationality: '',
    maritalStatus: '',
    email: '',
    phone: '',
    phoneDialCode: null,
    phoneFlag: null,
    phoneIso: null,
    altPhone: '',
    location: '',
    photoUrl: null,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // A newly-picked photo URI (upload) or a removal request — neither is sent
  // to the backend until Save Changes is pressed, so closing the sheet
  // without saving leaves the stored photo untouched.
  const [pendingPhotoUri, setPendingPhotoUri] = useState(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);

  const loadDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const details = await personalInformationService.getPersonalInformation();
      setFormValues(details);
      setErrors({});
      setPendingPhotoUri(null);
      setPhotoRemoved(false);
    } catch (err) {
      console.error('Failed to load personal details:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const setFieldValue = useCallback((field, value) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field as the user types/selects
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  const validateForm = () => {
    const nextErrors = {};

    if (!formValues.fullName?.trim()) {
      nextErrors.fullName = PERSONAL_INFO_CONSTANTS.VALIDATION.REQUIRED;
    }

    if (!formValues.dob) {
      nextErrors.dob = PERSONAL_INFO_CONSTANTS.VALIDATION.REQUIRED;
    } else {
      const dobDate = parseDDMMYYYY(formValues.dob);
      if (!dobDate) {
        nextErrors.dob = PERSONAL_INFO_CONSTANTS.VALIDATION.INVALID_DATE_ERROR;
      } else if (dobDate > new Date()) {
        nextErrors.dob = PERSONAL_INFO_CONSTANTS.VALIDATION.FUTURE_DOB_ERROR;
      } else if (calculateAge(dobDate) < PERSONAL_INFO_CONSTANTS.VALIDATION.MIN_AGE) {
        nextErrors.dob = PERSONAL_INFO_CONSTANTS.VALIDATION.MIN_AGE_ERROR;
      } else if (calculateAge(dobDate) > PERSONAL_INFO_CONSTANTS.VALIDATION.MAX_AGE) {
        nextErrors.dob = PERSONAL_INFO_CONSTANTS.VALIDATION.MAX_AGE_ERROR;
      }
    }

    if (!formValues.gender) {
      nextErrors.gender = PERSONAL_INFO_CONSTANTS.VALIDATION.REQUIRED;
    }

    if (!formValues.maritalStatus) {
      nextErrors.maritalStatus = PERSONAL_INFO_CONSTANTS.VALIDATION.REQUIRED;
    }

    // Email and nationality are locked (not user-editable — see the form),
    // so there's nothing for the user to fix; they're not re-validated here.

    // Phone check — the dial code is locked, so only the local digits are
    // validated, against that country's actual digit-length range when known.
    if (!formValues.phone?.trim()) {
      nextErrors.phone = PERSONAL_INFO_CONSTANTS.VALIDATION.REQUIRED;
    } else {
      const cleanPhone = formValues.phone.replace(/\D/g, '');
      if (formValues.phoneIso) {
        const { min, max } = getPhoneLengthRange(formValues.phoneIso);
        if (cleanPhone.length < min || cleanPhone.length > max) {
          nextErrors.phone = PERSONAL_INFO_CONSTANTS.VALIDATION.INVALID_PHONE;
        }
      } else if (cleanPhone.length < 8) {
        nextErrors.phone = PERSONAL_INFO_CONSTANTS.VALIDATION.INVALID_PHONE;
      }
    }

    // Alternate phone is optional, but if the user typed something it still
    // has to look like a phone number.
    if (formValues.altPhone?.trim()) {
      const cleanAlt = formValues.altPhone.replace(/[\s\-()]/g, '');
      if (!/^\+?\d{6,15}$/.test(cleanAlt)) {
        nextErrors.altPhone = PERSONAL_INFO_CONSTANTS.VALIDATION.INVALID_PHONE;
      }
    }

    if (!formValues.location) {
      nextErrors.location = PERSONAL_INFO_CONSTANTS.VALIDATION.REQUIRED;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showAlert({
        type: 'warning',
        title: t('profile.personalInfo.validationErrorTitle'),
        message: t('profile.personalInfo.validationErrorBody'),
      });
      return false;
    }

    setIsSaving(true);
    try {
      // Photo changes are staged locally until Save is pressed — apply
      // whichever one is pending before saving the rest of the form.
      if (pendingPhotoUri) {
        await personalInformationService.uploadProfilePhoto(pendingPhotoUri);
      } else if (photoRemoved) {
        await personalInformationService.deleteProfilePhoto();
      }

      const result = await personalInformationService.updatePersonalInformation(formValues);
      if (result.success) {
        setPendingPhotoUri(null);
        setPhotoRemoved(false);
        if (onSaveSuccess) onSaveSuccess(result.data);
        return true;
      }
    } catch (err) {
      console.error('Failed to save personal details:', err);
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: getErrorMessage(err, t),
      });
    } finally {
      setIsSaving(false);
    }
    return false;
  };

  // Stages a new photo locally (shown immediately as a preview) — the actual
  // upload happens in handleSave, not here.
  const handlePhotoUpload = (uri) => {
    setPendingPhotoUri(uri);
    setPhotoRemoved(false);
    setFieldValue('photoUrl', uri);
  };

  // Stages a photo removal locally — the actual delete call happens in
  // handleSave. Nothing is sent to the backend by tapping "Remove Photo"
  // alone, so closing the sheet without saving leaves the stored photo intact.
  const handlePhotoDelete = () => {
    setPendingPhotoUri(null);
    setPhotoRemoved(true);
    setFieldValue('photoUrl', null);
  };

  return {
    formValues,
    errors,
    isLoading,
    isSaving,
    setFieldValue,
    handleSave,
    handlePhotoUpload,
    handlePhotoDelete,
    refreshDetails: loadDetails,
  };
}
