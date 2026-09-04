import apiClient, { markSessionEstablished } from '../api/client';
import { dataSync } from '../store/dataSync';
import { ENDPOINTS } from '../api/endpoints';
import { tokenStorage } from '../api/tokenStorage';
import { requestPermissionAndGetToken, deregisterCurrentDevice } from './push.service';

export const authService = {
  /**
   * Step 3 of onboarding — registers user and triggers OTP to email.
   * userData: { name, dateOfBirth, gender, nationality, country, state, city, phone, email, password }
   */
  register: async (userData) => {
    const { data } = await apiClient.post(ENDPOINTS.AUTH.REGISTER, userData);
    // referralApplied: true (code entered & valid) | false (entered & invalid,
    // silently ignored server-side) | null (no code entered at all).
    return { success: true, message: data.message, referralApplied: data.data?.referralApplied ?? null };
  },

  /**
   * Resend OTP to email (also used when user wants a fresh code).
   * contactInfo: email string
   */
  sendOTP: async (contactInfo) => {
    const { data } = await apiClient.post(ENDPOINTS.AUTH.SEND_OTP, {
      email: contactInfo,
    });
    return { success: true, message: data.message };
  },

  /**
   * Step 4 of onboarding — verify OTP, receive tokens, activate account.
   * contactInfo: email string; code: 6-digit OTP string
   */
  verifyOTP: async (contactInfo, code) => {
    const { data } = await apiClient.post(ENDPOINTS.AUTH.VERIFY_MOBILE, {
      email: contactInfo,
      otp: code,
    });
    const { accessToken, refreshToken, user } = data.data;
    await tokenStorage.setAccessToken(accessToken);
    await tokenStorage.setRefreshToken(refreshToken);
    await tokenStorage.setUser(user);
    // Re-arms the API client's one-shot sign-out guard for this new session.
    markSessionEstablished();
    requestPermissionAndGetToken().catch(() => {}); // best-effort — must never block onboarding
    return { success: true, verified: true, user, token: accessToken };
  },

  /**
   * Login with email or phone + password.
   * Backend expects 'identifier' — we map from the hook's 'email' param.
   */
  login: async (email, password) => {
    const { data } = await apiClient.post(ENDPOINTS.AUTH.LOGIN, {
      identifier: email,
      password,
    });
    // Guarded rather than destructured blind: a 2xx with an unexpected body
    // would otherwise store `undefined` as the access token, leaving the app
    // "logged in" with a token that 401s on every subsequent request.
    const { accessToken, refreshToken, user } = data?.data || {};
    if (!accessToken || !refreshToken) {
      throw new Error('Unexpected login response from the server.');
    }
    await tokenStorage.setAccessToken(accessToken);
    await tokenStorage.setRefreshToken(refreshToken);
    await tokenStorage.setUser(user);
    // Re-arms the API client's one-shot sign-out guard for this new session.
    markSessionEstablished();
    requestPermissionAndGetToken().catch(() => {}); // best-effort — must never block login
    return { success: true, user, token: accessToken };
  },

  /**
   * Forgot Password step 1 — emails a 6-digit OTP to the account, if one
   * exists (backend stays silent either way, so this never reveals whether
   * an email is registered).
   */
  forgotPassword: async (email) => {
    const { data } = await apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    return { success: true, message: data.message };
  },

  /**
   * Forgot Password step 2 — verify the OTP and set a new password. Revokes
   * every other session on success, so a previously-logged-in device gets
   * signed out on its next request.
   */
  resetPasswordWithOtp: async ({ email, otp, newPassword, confirmPassword }) => {
    const { data } = await apiClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, {
      email,
      otp,
      newPassword,
      confirmPassword,
    });
    return { success: true, message: data.message };
  },

  logout: async () => {
    try {
      // Best-effort, and BEFORE clearAll — deregistering needs the still-valid
      // access token to authenticate the request.
      await deregisterCurrentDevice();
      const refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken) {
        await apiClient.post(ENDPOINTS.AUTH.LOGOUT, { refreshToken });
      }
    } finally {
      await tokenStorage.clearAll();
      // Empty every cached resource (profile, applied jobs, saved jobs,
      // subscription) as part of the same teardown. Clearing tokens alone left
      // the previous user's data sitting in memory — the providers wrap the
      // Auth stack and never unmount, so their state survived the sign-out and
      // the next user briefly saw someone else's applications and avatar.
      dataSync.notifySessionEnded();
    }
    return { success: true };
  },
};
