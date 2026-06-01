import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

/**
 * Requests permission to access the device's media library.
 * If permission is denied, it shows an alert with the provided title and message.
 * 
 * @param title The title for the alert if permission is denied.
 * @param message The message for the alert if permission is denied.
 * @returns A boolean indicating whether permission was granted (true) or denied (false).
 */
export const requestMediaLibraryPermission = async (
  title: string = "Thất bại",
  message: string = "Vui lòng cấp quyền truy cập thư viện ảnh!"
): Promise<boolean> => {
  if (Platform.OS === 'android') {
    return true;
  }
  
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (permissionResult.granted === false) {
    Alert.alert(title, message);
    return false;
  }
  return true;
};
