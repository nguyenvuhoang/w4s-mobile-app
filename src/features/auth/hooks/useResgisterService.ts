import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useNotification } from '@/contexts/NotificationContext';
import { authRepository } from '@/services/repositories/auth.repository';

interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  gender: number;
  birthday: string;
}

export const useRegisterService = () => {
  // State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState<number>(1); // 1: Nam, 2: Nữ
  const [birthday, setBirthday] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      password.length >= 6 &&
      confirmPassword.length >= 6 &&
      password === confirmPassword &&
      phone.trim().length >= 10 &&
      address.trim().length > 0 &&
      birthday.length > 0;

    setIsFormValid(isValid);
  }, [fullName, email, password, confirmPassword, phone, address, birthday]);

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
        showNotification(t('validation.invalidEmail') || 'Email không hợp lệ', 'warning');
        return false;
      }

      // Validate phone
      if (!isValidPhone(phone)) {
        showNotification(t('validation.invalidPhone') || 'Số điện thoại không hợp lệ', 'warning');
        return false;
      }

      // Validate password match
      if (password !== confirmPassword) {
        showNotification(t('validation.passwordMismatch') || 'Mật khẩu không khớp', 'warning');
        return false;
      }

      // Validate password length
      if (password.length < 6) {
        showNotification(t('validation.passwordTooShort') || 'Mật khẩu phải có ít nhất 6 ký tự', 'warning');
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
        contracttype: 'IND',
        reason: '',
        usertype: 'WL',
      };

      const response = await authRepository.register(payload);

      if (response.isSuccess()) {
        showNotification(
          t('register.success') || 'Đăng ký thành công! Vui lòng đăng nhập.',
          'success'
        );
        
        router.replace('/(auth)/login' as any);
        return true;
      } else {
        const errorMessage = response.getError() || t('register.failed') || 'Đăng ký thất bại';
        showNotification(errorMessage, 'error');
        return false;
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      showNotification(
        error.message || t('errors.networkError') || 'Lỗi kết nối mạng',
        'error'
      );
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, [
    fullName,
    email,
    password,
    confirmPassword,
    phone,
    address,
    gender,
    birthday,
    isValidEmail,
    isValidPhone,
    parseFullName,
    showNotification,
    t,
    router,
  ]);

  // Reset form
  const resetForm = useCallback(() => {
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPhone('');
    setAddress('');
    setGender(1);
    setBirthday('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, []);

  return {
    // State
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    phone,
    setPhone,
    address,
    setAddress,
    gender,
    setGender,
    birthday,
    setBirthday,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
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