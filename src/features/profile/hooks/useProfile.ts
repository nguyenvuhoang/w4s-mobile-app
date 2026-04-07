import StorageKey from '@/constants/StorageKey';
import { WORKFLOWCODE } from '@/constants/WorkflowCode';
import { apiService } from '@/core/api';
import StorageService from '@/services/StorageService';
import { useCallback, useState } from 'react';

export interface UserProfile {
  id?: number;
  user_id?: string;
  user_code?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  email?: string;
  status?: string;
  identity_number?: string;
  date_of_birth?: string | null;
  gender?: string | number | null;
  nationality?: string | null;
  place_of_origin?: string | null;
  place_of_residence?: string | null;
  issued_date?: string | null;
  issued_place?: string | null;
}

export const useProfile = () => {
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const getUserProfile = useCallback(async (userCode?: string) => {
    setLoading(true);
    setError(null);
    try {
      const code = userCode || await StorageService.getAsyncItem(StorageKey.userCode);
      if (!code) throw new Error('Missing user code');

      const response = await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_GET_USER_PROFILE,
        { user_code: code },
        false,
        true
      );

      if (!response.isSuccess()) {
        throw new Error(response.getError?.() || 'Failed to get user profile');
      }

      const rawData = typeof response.getData === 'function' ? response.getData() : response.data || {};
      
      // API responses might wrap the data differently depending on the workflow format
      let profileData = null;
      if (Array.isArray(rawData) && rawData.length > 0) {
        profileData = rawData[0];
      } else if (rawData.user_profile) {
        profileData = Array.isArray(rawData.user_profile) 
          ? rawData.user_profile[0] 
          : rawData.user_profile;
      } else {
        profileData = rawData;
      }

      setProfile(profileData);
      return profileData;
    } catch (err: any) {
      const message = err.message || 'Lỗi khi lấy thông tin người dùng';
      setError(message);
      console.error('[useProfile] getUserProfile failed', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserProfile = async (payload: Partial<UserProfile>) => {
    setUpdating(true);
    setError(null);
    try {
      const code = payload.user_code || await StorageService.getAsyncItem(StorageKey.userCode);
      const appInfo = await StorageService.getAsyncItem(StorageKey.appInfo);
      const username = JSON.parse(appInfo).login_name;
      if (!code) throw new Error('Missing user code');

      // Ensure user_code is included
      const requestPayload = {
        ...payload,
        user_code: code,
        user_name: username
      };

      const response = await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_UPDATE_USER_PROFILE,
        requestPayload,
        false,
        true
      );

      if (!response.isSuccess()) {
        throw new Error(response.getError?.() || 'Failed to update user profile');
      }

      // Refresh profile immediately upon successful update
      await getUserProfile(String(code));
      
      return response;
    } catch (err: any) {
      const message = err.message || 'Lỗi khi cập nhật thông tin người dùng';
      setError(message);
      console.error('[useProfile] updateUserProfile failed', err);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  return {
    loading,
    updating,
    error,
    profile,
    getUserProfile,
    updateUserProfile,
  };
};
