import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useNotification } from '@/contexts/NotificationContext';
import { authRepository } from '@/services/repositories';
import { isValidEmail, isValidPhone, parseFullName } from '@/utils/validation';

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
  const [initialBalance, setInitialBalance] = useState('');
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
        initialBamountalance: initialBalance ? parseFloat(initialBalance.replace(/,/g, '')) : 0,
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
    showNotification,
    t,
    router,
    currency,
    initialBalance,
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
    setInitialBalance('');
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
    initialBalance,
    setInitialBalance,
    isRegistering,
    isFormValid,
    
    // Methods
    handleRegister,
    resetForm,
  };
};