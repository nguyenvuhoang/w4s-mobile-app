import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useNotification } from '@/contexts/NotificationContext';
import { authRepository } from '@/services/repositories';

interface RegisterFormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  gender: number;
  birthday: string;
  currency: string;
}

export const useRegisterService = () => {
  // State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState<number>(1); // 1: Nam, 2: Nữ
  const [birthday, setBirthday] = useState('');
  const [currency, setCurrency] = useState('VND');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // Hooks
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const router = useRouter();

  // Validation
  useEffect(() => {
    const isValid = 
      fullName.trim().length > 0 &&
      email.trim().length > 0 &&
      phone.trim().length >= 10 &&
      address.trim().length > 0 &&
      birthday.length > 0 &&
      currency.trim().length > 0;

    setIsFormValid(isValid);
  }, [fullName, email, phone, address, birthday, currency]);

  const parseFullName = useCallback((fullName: string): {
    firstname: string;
    middlename: string;
    lastname: string;
  } => {
    const nameParts = fullName.trim().split(/\s+/).filter(part => part.length > 0);
    
    if (nameParts.length === 0) {
      return { firstname: '', middlename: '', lastname: '' };
    } else if (nameParts.length === 1) {
      // Chỉ có 1 từ -> bỏ vào lastname
      return { firstname: '', middlename: '', lastname: nameParts[0] };
    } else if (nameParts.length === 2) {
      // Có 2 từ -> bỏ vào firstname và lastname
      return { firstname: nameParts[0], middlename: '', lastname: nameParts[1] };
    } else {
      // Có 3 từ trở lên -> firstname, middlename (các từ ở giữa), lastname
      const firstname = nameParts[0];
      const lastname = nameParts[nameParts.length - 1];
      const middlename = nameParts.slice(1, -1).join(' ');
      
      return { firstname, middlename, lastname };
    }
  }, []);

  // Email validation
  const isValidEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  // Phone validation
  const isValidPhone = useCallback((phone: string): boolean => {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone);
  }, []);

  // Handle register
  const handleRegister = useCallback(async (): Promise<boolean> => {
    try {
      setIsRegistering(true);

      // Validate email
      if (!isValidEmail(email)) {
        showNotification(t('validation.invalid_email'), 'warning');
        return false;
      }

      // Validate phone
      if (!isValidPhone(phone)) {
        showNotification(t('validation.invalid_phone'), 'warning');
        return false;
      }

      // Parse fullName
      const { firstname, middlename, lastname } = parseFullName(fullName);

      // Prepare payload
      const payload = {
        username: phone,
        firstname: firstname,
        middlename: middlename,
        lastname: lastname,
        gender: gender,
        address: address,
        email: email,
        phone: phone,
        status: 'A', 
        userlevel: '1',
        birthday: birthday,
        currentstatus: 'P', 
        contracttype: 'WAL',
        reason: '',
        usertype: '0502',
        currencyCode: currency,
      };

      const response = await authRepository.register(payload);

      if (response.isSuccess()) {
        showNotification(
          t('auth.register_success'),
          'success'
        );
        
        router.replace('/(auth)/login' as any);
        return true;
      } else {
        const errorMessage = response.getError() || t('auth.register_failed');
        showNotification(errorMessage, 'error');
        return false;
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      showNotification(
        error.message || t('common.network_error'),
        'error'
      );
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, [
    fullName,
    email,
    phone,
    address,
    gender,
    birthday,
    isValidEmail,
    isValidPhone,
    parseFullName,
    showNotification,
    t,
    t,
    router,
    currency,
  ]);

  // Reset form
  const resetForm = useCallback(() => {
    setFullName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setGender(1);
    setBirthday('');
    setCurrency('VND');
  }, []);

  return {
    // State
    fullName,
    setFullName,
    email,
    setEmail,
    phone,
    setPhone,
    address,
    setAddress,
    gender,
    setGender,
    birthday,
    setBirthday,
    currency,
    setCurrency,
    isRegistering,
    isFormValid,
    
    // Methods
    handleRegister,
    resetForm,
    isValidEmail,
    isValidPhone,
    parseFullName,
  };
};