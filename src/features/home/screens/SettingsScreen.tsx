import CustomText from '@/components/base/CustomText';
import { GlobalContext } from '@/contexts/GlobalContext';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Tokens } from '@/core/theme/theme';
import { useSettingService } from '@/features/settings/hooks/useSettingService';
import { normalize } from '@/utils/layout';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useContext, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { handleLogout, touchIDClick, isUsingTouchID } = useSettingService();
  const { appInfo } = useContext(GlobalContext);
  const { colors } = useAppTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const handleBiometricToggle = async () => {
    const userCode = appInfo?.user_code || '';
    if (userCode) {
      await touchIDClick(userCode);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <CustomText style={[styles.headerTitle, { color: colors.text }]}>
            Cài đặt
          </CustomText>
        </View>

        {/* Profile Section */}
        <View style={[styles.profileSection, { backgroundColor: colors.card }]}>
          <Image
            source={{ uri: 'https://media.istockphoto.com/id/814423752/photo/eye-of-model-with-colorful-art-make-up-close-up.jpg?s=612x612&w=0&k=20&c=l15OdMWjgCKycMMShP8UK94ELVlEGvt7GmB_esHWPYE=' }}
            style={styles.profileImage}
          />
          <CustomText style={[styles.profileName, { color: colors.text }]}>
            Hoàng Nguyễn
          </CustomText>
          <CustomText style={[styles.profileEmail, { color: colors.icon }]}>
            hoang@example.com
          </CustomText>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
            Tài khoản
          </CustomText>
          <View style={[styles.settingsList, { backgroundColor: colors.card }]}>
            <SettingItem
              icon="person-outline"
              title="Thông tin cá nhân"
              onPress={() => {}}
              colors={colors}
            />
            <SettingItem
              icon="lock-closed-outline"
              title="Đổi mật khẩu"
              onPress={() => {router.push('/(protected)/change-password')}}
              colors={colors}
            />
            <SettingItem
              icon="card-outline"
              title="Phương thức thanh toán"
              onPress={() => {}}
              badge="2"
              colors={colors}
            />
            <SettingItem
              icon="wallet-outline"
              title="Tài khoản liên kết"
              onPress={() => {}}
              colors={colors}
            />
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
            Cài đặt ứng dụng
          </CustomText>
          <View style={[styles.settingsList, { backgroundColor: colors.card }]}>
            <SettingItemWithSwitch
              icon="notifications-outline"
              title="Thông báo"
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              colors={colors}
            />
            <SettingItemWithSwitch
              icon="finger-print-outline"
              title="Sinh trắc học"
              subtitle="Sử dụng Face ID/Touch ID"
              value={isUsingTouchID}
              onValueChange={handleBiometricToggle}
              colors={colors}
            />
            <SettingItemWithSwitch
              icon="moon-outline"
              title="Chế độ tối"
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              colors={colors}
            />
            <SettingItem 
              icon="language-outline" 
              title="Ngôn ngữ" 
              value="Tiếng Việt" 
              onPress={() => {}} 
              colors={colors}
            />
            <SettingItem 
              icon="cash-outline" 
              title="Tiền tệ" 
              value="VND (đ)" 
              onPress={() => {}} 
              colors={colors}
            />
          </View>
        </View>

        {/* Data & Privacy */}
        <View style={styles.section}>
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
            Dữ liệu & Bảo mật
          </CustomText>
          <View style={[styles.settingsList, { backgroundColor: colors.card }]}>
            <SettingItem
              icon="cloud-upload-outline"
              title="Sao lưu dữ liệu"
              subtitle="Lần cuối: 2 giờ trước"
              onPress={() => {}}
              colors={colors}
            />
            <SettingItem
              icon="shield-checkmark-outline"
              title="Bảo mật"
              onPress={() => {}}
              colors={colors}
            />
            <SettingItem
              icon="document-text-outline"
              title="Chính sách bảo mật"
              onPress={() => {}}
              colors={colors}
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
            Hỗ trợ
          </CustomText>
          <View style={[styles.settingsList, { backgroundColor: colors.card }]}>
            <SettingItem
              icon="help-circle-outline"
              title="Trung tâm trợ giúp"
              onPress={() => {}}
              colors={colors}
            />
            <SettingItem
              icon="chatbubble-outline"
              title="Liên hệ hỗ trợ"
              onPress={() => {}}
              colors={colors}
            />
            <SettingItem
              icon="star-outline"
              title="Đánh giá ứng dụng"
              onPress={() => {}}
              colors={colors}
            />
            <SettingItem
              icon="information-circle-outline"
              title="Giới thiệu"
              value="v1.0.0"
              onPress={() => {}}
              colors={colors}
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.card }]} 
          onPress={() => {handleLogout()}}
        >
          <Ionicons name="log-out-outline" size={normalize(20)} color="#FF3B30" />
          <CustomText style={styles.logoutText}>
            Đăng xuất
          </CustomText>
        </TouchableOpacity>

        <View style={styles.footer}>
          <CustomText style={[styles.footerText, { color: colors.icon }]}>
            © 2025 Finance App. All rights reserved.
          </CustomText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Setting Item Component
const SettingItem = ({ icon, title, subtitle, value, badge, onPress, colors }: any) => (
  <TouchableOpacity 
    style={[styles.settingItem, { borderBottomColor: colors.border }]} 
    onPress={onPress}
  >
    <View style={styles.settingLeft}>
      <View style={[styles.settingIconContainer, { backgroundColor: Tokens.colors.foundation.primary["primary-1"] }]}>
        <Ionicons name={icon} size={normalize(22)} color={colors.tint} />
      </View>
      <View style={styles.settingInfo}>
        <CustomText style={[styles.settingTitle, { color: colors.text }]}>
          {title}
        </CustomText>
        {subtitle && (
          <CustomText style={[styles.settingSubtitle, { color: colors.icon }]}>
            {subtitle}
          </CustomText>
        )}
      </View>
    </View>
    <View style={styles.settingRight}>
      {badge && (
        <View style={[styles.badge, { backgroundColor: '#FF3B30' }]}>
          <CustomText style={[styles.badgeText, { color: Tokens.colors.main.white }]}>
            {badge}
          </CustomText>
        </View>
      )}
      {value && (
        <CustomText style={[styles.settingValue, { color: colors.icon }]}>
          {value}
        </CustomText>
      )}
      <Ionicons name="chevron-forward" size={normalize(20)} color={colors.border} />
    </View>
  </TouchableOpacity>
);

// Setting Item with Switch Component
const SettingItemWithSwitch = ({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  colors,
}: any) => (
  <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
    <View style={styles.settingLeft}>
      <View style={[styles.settingIconContainer, { backgroundColor: Tokens.colors.foundation.primary["primary-1"] }]}>
        <Ionicons name={icon} size={normalize(22)} color={colors.tint} />
      </View>
      <View style={styles.settingInfo}>
        <CustomText style={[styles.settingTitle, { color: colors.text }]}>
          {title}
        </CustomText>
        {subtitle && (
          <CustomText style={[styles.settingSubtitle, { color: colors.icon }]}>
            {subtitle}
          </CustomText>
        )}
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.border, true: colors.tint }}
      thumbColor={Tokens.colors.main.white}
      ios_backgroundColor={colors.border}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(16),
  },
  headerTitle: {
    fontSize: normalize(24),
    fontWeight: 'bold',
  },
  profileSection: {
    borderRadius: normalize(20),
    padding: normalize(24),
    marginHorizontal: normalize(20),
    marginBottom: normalize(24),
    alignItems: 'center',
  },
  profileImage: {
    width: normalize(80),
    height: normalize(80),
    borderRadius: normalize(40),
    marginBottom: normalize(12),
  },
  profileName: {
    fontSize: normalize(20),
    fontWeight: '600',
    marginBottom: normalize(4),
  },
  profileEmail: {
    fontSize: normalize(14),
    marginBottom: normalize(16),
  },
  editButton: {
    paddingHorizontal: normalize(24),
    paddingVertical: normalize(10),
    borderRadius: normalize(20),
  },
  editButtonText: {
    fontSize: normalize(14),
    fontWeight: '600',
  },
  section: {
    marginBottom: normalize(24),
  },
  sectionTitle: {
    fontSize: normalize(16),
    fontWeight: '600',
    paddingHorizontal: normalize(20),
    marginBottom: normalize(12),
  },
  settingsList: {
    borderRadius: normalize(16),
    marginHorizontal: normalize(20),
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: normalize(16),
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: normalize(12),
  },
  settingIconContainer: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: normalize(16),
  },
  settingSubtitle: {
    fontSize: normalize(12),
    marginTop: normalize(2),
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
  },
  settingValue: {
    fontSize: normalize(14),
  },
  badge: {
    borderRadius: normalize(10),
    minWidth: normalize(20),
    height: normalize(20),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: normalize(6),
  },
  badgeText: {
    fontSize: normalize(12),
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(8),
    borderRadius: normalize(16),
    padding: normalize(16),
    marginHorizontal: normalize(20),
    marginBottom: normalize(24),
  },
  logoutText: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: '#FF3B30',
  },
  footer: {
    paddingHorizontal: normalize(20),
    paddingBottom: normalize(24),
    alignItems: 'center',
  },
  footerText: {
    fontSize: normalize(12),
    marginBottom: normalize(70)
  },
});

export default SettingsScreen;