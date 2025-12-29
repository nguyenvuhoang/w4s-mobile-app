import { router } from 'expo-router';

// Danh sách các màn hình đặc biệt cần map tay (nếu có sự khác biệt)
// Ví dụ: Server trả về 'Home' nhưng file thực tế là '(tabs)/index'
const SPECIAL_ROUTES: Record<string, string> = {
  'Home': '/(protected)/(tabs)', 
  'Settings': '/(protected)/(tabs)/settings', // Nếu bạn để setting trong tab
  'Login': '/(auth)/Login',
  'Notification': '/notification',
  // ... Các màn hình Tabs thường cần map tay
};

export const performNavigationByName = (actionString: string) => {
    if (!actionString) return;

    let [screenName, rawParams] = actionString.split("|");
    
    // 1. Tìm đường dẫn cơ sở (Base Path)
    let basePath = SPECIAL_ROUTES[screenName];
    if (!basePath) {
        const isAuth = screenName.startsWith('Login') || screenName.startsWith('Forgot') || screenName === 'Register';
        const group = isAuth ? '(auth)' : '(protected)';
        basePath = `/${group}/${screenName}`;
    }

    // 2. Ghép chuỗi Params (Query String)
    // Thay vì tạo object params, ta dùng lại luôn cái rawParams của server (a=1&b=2)
    // Nếu server trả về params, ta nối nó vào đuôi path
    
    let fullPath = basePath;
    if (rawParams) {
        // Nối params vào: /path?a=1&b=2
        fullPath = `${basePath}?${rawParams}`;
    }

    // 3. Thực thi
    try {
        // Ép kiểu fullPath thành any để bypass check static route
        router.push(fullPath as any); 
    } catch (e) {
        console.error(`[Navigation] Lỗi khi chuyển hướng tới ${screenName}:`, e);
    }
};
