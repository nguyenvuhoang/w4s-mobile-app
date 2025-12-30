import CustomText from '@/components/base/CustomText';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <CustomText style={styles.headerTitle}>Cài đặt</CustomText>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Image
            source={{ uri: 'https://via.placeholder.com/80' }}
            style={styles.profileImage}
          />
          <CustomText style={styles.profileName}>Hoàng Nguyễn</CustomText>
          <CustomText style={styles.profileEmail}>hoang@example.com</CustomText>
          <TouchableOpacity style={styles.editButton}>
            <CustomText style={styles.editButtonText}>Chỉnh sửa hồ sơ</CustomText>
          </TouchableOpacity>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Tài khoản</CustomText>
          <View style={styles.settingsList}>
            <SettingItem
              icon="person-outline"
              title="Thông tin cá nhân"
              onPress={() => {}}
            />
            <SettingItem
              icon="lock-closed-outline"
              title="Đổi mật khẩu"
              onPress={() => {}}
            />
            <SettingItem
              icon="card-outline"
              title="Phương thức thanh toán"
              onPress={() => {}}
              badge="2"
            />
            <SettingItem
              icon="wallet-outline"
              title="Tài khoản liên kết"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Cài đặt ứng dụng</CustomText>
          <View style={styles.settingsList}>
            <SettingItemWithSwitch
              icon="notifications-outline"
              title="Thông báo"
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
            <SettingItemWithSwitch
              icon="finger-print-outline"
              title="Sinh trắc học"
              subtitle="Sử dụng Face ID/Touch ID"
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
            />
            <SettingItemWithSwitch
              icon="moon-outline"
              title="Chế độ tối"
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
            />
            <SettingItem icon="language-outline" title="Ngôn ngữ" value="Tiếng Việt" onPress={() => {}} />
            <SettingItem icon="cash-outline" title="Tiền tệ" value="VND (đ)" onPress={() => {}} />
          </View>
        </View>

        {/* Data & Privacy */}
        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Dữ liệu & Bảo mật</CustomText>
          <View style={styles.settingsList}>
            <SettingItem
              icon="cloud-upload-outline"
              title="Sao lưu dữ liệu"
              subtitle="Lần cuối: 2 giờ trước"
              onPress={() => {}}
            />
            <SettingItem
              icon="shield-checkmark-outline"
              title="Bảo mật"
              onPress={() => {}}
            />
            <SettingItem
              icon="document-text-outline"
              title="Chính sách bảo mật"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Hỗ trợ</CustomText>
          <View style={styles.settingsList}>
            <SettingItem
              icon="help-circle-outline"
              title="Trung tâm trợ giúp"
              onPress={() => {}}
            />
            <SettingItem
              icon="chatbubble-outline"
              title="Liên hệ hỗ trợ"
              onPress={() => {}}
            />
            <SettingItem
              icon="star-outline"
              title="Đánh giá ứng dụng"
              onPress={() => {}}
            />
            <SettingItem
              icon="information-circle-outline"
              title="Giới thiệu"
              value="v1.0.0"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <CustomText style={styles.logoutText}>Đăng xuất</CustomText>
        </TouchableOpacity>

        <View style={styles.footer}>
          <CustomText style={styles.footerText}>
            © 2025 Finance App. All rights reserved.
          </CustomText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Setting Item Component
const SettingItem = ({ icon, title, subtitle, value, badge, onPress }: any) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <View style={styles.settingLeft}>
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon} size={22} color="#007AFF" />
      </View>
      <View style={styles.settingInfo}>
        <CustomText style={styles.settingTitle}>{title}</CustomText>
        {subtitle && <CustomText style={styles.settingSubtitle}>{subtitle}</CustomText>}
      </View>
    </View>
    <View style={styles.settingRight}>
      {badge && (
        <View style={styles.badge}>
          <CustomText style={styles.badgeText}>{badge}</CustomText>
        </View>
      )}
      {value && <CustomText style={styles.settingValue}>{value}</CustomText>}
      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
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
}: any) => (
  <View style={styles.settingItem}>
    <View style={styles.settingLeft}>
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon} size={22} color="#007AFF" />
      </View>
      <View style={styles.settingInfo}>
        <CustomText style={styles.settingTitle}>{title}</CustomText>
        {subtitle && <CustomText style={styles.settingSubtitle}>{subtitle}</CustomText>}
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#E5E5EA', true: '#34C759' }}
      thumbColor="#fff"
      ios_backgroundColor="#E5E5EA"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  profileSection: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  settingsList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#000',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    color: '#8E8E93',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
  },
});

export default SettingsScreen;