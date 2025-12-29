import React, { useContext } from 'react';
import { GlobalContext } from '../../contexts/GlobalContext';
import IdleWrapper from './IdleWrapper';

const AppContentWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { appInfo, isReady } = useContext(GlobalContext);

    if (!isReady) return null; // ⏳ Đợi appInfo load xong từ Storage

    if (!appInfo?.is_login || !appInfo?.login_name) {
        return <>{children}</>; // 🟡 Không cần IdleWrapper nếu chưa đăng nhập
    }

    return <IdleWrapper>{children}</IdleWrapper>; // ✅ Có appInfo → bọc IdleWrapper
};

export default AppContentWrapper;
