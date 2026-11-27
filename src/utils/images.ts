import { BASE_URL } from "@/core/api/ApiClient";

export const Images = {
  // ===== App =====
  appLogoLight: require('@assets/logo/W4S_Light.png'),
  appLogoDark: require('@assets/logo/W4S_Dark.png'),

  // ===== Placeholder =====
  placeholder: {
    // image: require('@assets/images/common/placeholder.png'),
    avatar: require('@assets/images/default_avatar.png'),
  },

  // ===== Onboarding =====
  onboarding1: require('@assets/images/onboarding/onBoard_3D_1.png'),
  onboarding2: require('@assets/images/onboarding/onBoard_3D_2.png'),
  onboarding3: require('@assets/images/onboarding/onBoard_3D_3.png'),
} as const;

export const getAvatarSource = (avatar?: string | null) => {
  if (!avatar || typeof avatar !== "string" || !avatar.trim()) {
    return Images.placeholder.avatar;
  }
  const trimmed = avatar.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("file://") ||
    trimmed.startsWith("content://") ||
    trimmed.startsWith("data:")
  ) {
    return { uri: trimmed };
  }
  if (trimmed.startsWith("/")) {
    return { uri: `${BASE_URL}${trimmed}` };
  }
  return { uri: `${BASE_URL}/${trimmed}` };
};

