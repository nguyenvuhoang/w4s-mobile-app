import React, { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';

import OTPModal from '@/components/modals/OtpModal';

interface OTPConfig {
  title?: string;
  description?: string;
  isresend?: boolean;
  blockSeconds?: number;
  showOtpCode?: boolean;
  handleVerifyOTP: (otpCode: string) => Promise<{ success: boolean; error?: string }>;
  handleResent?: () => Promise<{ success: boolean; error?: string }>;
  // ✅ Add callback types
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

interface OTPContextType {
  showOTP: (config: OTPConfig) => void;
  hideOTP: () => void;
  isVisible: boolean;
}

const OTPContext = createContext<OTPContextType | undefined>(undefined);

interface OTPProviderProps {
  children: ReactNode;
}

export const OTPProvider: React.FC<OTPProviderProps> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<OTPConfig | null>(null);
  const configRef = useRef<OTPConfig | null>(null);

  const showOTP = useCallback((newConfig: OTPConfig) => {
    configRef.current = newConfig;
    setConfig(newConfig);
    setVisible(true);
  }, []);

  const hideOTP = useCallback(() => {
    // Call onClose callback if provided
    if (configRef.current?.onClose) {
      configRef.current.onClose();
    }

    setVisible(false);

    // Delay clearing config to allow exit animation
    setTimeout(() => {
      setConfig(null);
      configRef.current = null;
    }, 300);
  }, []);

  // Wrap handleVerifyOTP to include callbacks
  const wrappedVerifyOTP = useCallback(
    async (otpCode: string) => {
      if (!config) return { success: false, error: 'No config' };

      try {
        const result = await config.handleVerifyOTP(otpCode);

        if (result.success && config.onSuccess) {
          config.onSuccess();
        } else if (!result.success && config.onError) {
          config.onError(result.error || 'Verification failed');
        }

        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        if (config.onError) {
          config.onError(errorMsg);
        }
        return { success: false, error: errorMsg };
      }
    },
    [config]
  );

  return (
    <OTPContext.Provider value={{ showOTP, hideOTP, isVisible: visible }}>
      {children}
      {config && (
        <OTPModal
          visible={visible}
          onClose={hideOTP}
          title={config.title}
          description={config.description}
          handleVerifyOTP={wrappedVerifyOTP}
          handleResent={config.handleResent}
          isresend={config.isresend}
          blockSeconds={config.blockSeconds}
          showOtpCode={config.showOtpCode}
        />
      )}
    </OTPContext.Provider>
  );
};

export const useOTP = (): OTPContextType => {
  const context = useContext(OTPContext);
  if (!context) {
    throw new Error('useOTP must be used within OTPProvider');
  }
  return context;
};

// Export types for external use
export type { OTPConfig, OTPContextType };
