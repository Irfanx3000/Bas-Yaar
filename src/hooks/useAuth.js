import { useState, useCallback, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { tokenStorage } from '../api/tokenStorage';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Restore persisted session on app launch
  useEffect(() => {
    tokenStorage.getUser().then((storedUser) => {
      if (storedUser) setUser(storedUser);
    });
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(email, password);
      if (response.success) {
        setUser(response.user);
      }
      return response;
    } catch (err) {
      setError(err?.message || 'Failed to login');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(userData);
      return response;
    } catch (err) {
      setError(err?.message || 'Failed to register');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendOTP = useCallback(async (contactInfo) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.sendOTP(contactInfo);
      return response;
    } catch (err) {
      setError(err?.message || 'Failed to send OTP');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOTP = useCallback(async (contactInfo, code) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.verifyOTP(contactInfo, code);
      // Set user in state after successful OTP verification (onboarding activation)
      if (response.success && response.user) {
        setUser(response.user);
      }
      return response;
    } catch (err) {
      setError(err?.message || 'Failed to verify OTP');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch {
      // Always clear local state even if server call fails
    } finally {
      setUser(null);
      setError(null);
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    isLoading,
    error,
    login,
    register,
    sendOTP,
    verifyOTP,
    logout,
  };
}
