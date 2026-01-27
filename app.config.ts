import { versionCode, versionName } from "./app-version.json";

export default () => {
  const buildDate = (() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  })();

  const isDevSimulator = process.env.EAS_BUILD_PROFILE === "dev-simulator";

  return {
    expo: {
      name: "W4S Mobile",
      slug: "w4s",
      version: versionName,
      description:
        "W4S Mobile is a personal finance management application that helps you track, control, and optimize your cash flow comprehensively, from fiat currency to digital assets and DeFi - all in a single platform.",
      orientation: "portrait",
      icon: "./assets/app-icon.png",
      userInterfaceStyle: "light",
      updates: {
        enabled: true,
        fallbackToCacheTimeout: 0,
        url: "https://u.expo.dev/da4b2865-9a79-4658-8321-1cf84cef3b33",
      },
      splash: {
        image: "./assets/splash-screen.png",
        resizeMode: "cover",
        backgroundColor: "#0059df",
        androidStatusBar: {
          translucent: true,
          backgroundColor: "#00000000",
        },
      },
      ios: {
        supportsTablet: true,
        googleServicesFile: "./config/GoogleService-Info.plist",
        icon: "./assets/app-icon.png",
        deploymentTarget: "16.0",
        infoPlist: {
          FirebaseAppDelegateProxyEnabled: true,
          UIBackgroundModes: ["remote-notification"],
          ITSAppUsesNonExemptEncryption: false,
          CFBundleDisplayName: "W4S Mobile ",
          CFBundleShortVersionString: versionName,
          CFBundleVersion: `${versionCode}`,
          CFBundleKeywords: ["ngân hàng", "tài chính", "banking", "finance"],
          CFBundleCategory: "Finance",
          NSCameraUsageDescription:
            "W4S Mobile uses the camera to scan payment QR codes and to capture photos for identity verification (KYC).",
          NSPhotoLibraryUsageDescription:
            "W4S Mobile needs access to your photos when you upload profile images or documents for verification.",
          NSLocationWhenInUseUsageDescription:
            "W4S Mobile uses your location to show nearby branches/ATMs and to help protect your account from fraud.",
          NSContactsUsageDescription:
            "W4S Mobile needs access to your contacts to select transaction participants.",
          ...(isDevSimulator
            ? {
              NSAppTransportSecurity: {
                NSAllowsArbitraryLoads: true,
              },
            }
            : {}),
        },
        runtimeVersion: {
          policy: "nativeVersion",
        },
        bundleIdentifier: "com.jits.mbanking.emi.production",
        buildNumber: versionCode.toString(),
        entitlements: {
          "aps-environment": "development",
        },
      },
      android: {
        icon: "./assets/app-icon.png",
        adaptiveIcon: {
          foregroundImage: "./assets/logo/app-icon-adaptive-android.png",
          backgroundColor: "#FFFFFF",
        },
        edgeToEdgeEnabled: true,
        permissions: [
          "INTERNET",
          "NOTIFICATIONS",
          "VIBRATE",
          "WAKE_LOCK",
          "POST_NOTIFICATIONS",
          "CAMERA",
          "ACCESS_COARSE_LOCATION",
          "ACCESS_FINE_LOCATION",
          "READ_CONTACTS",
          "READ_MEDIA_IMAGES",
        ],
        blockedPermissions: [
          "android.permission.READ_EXTERNAL_STORAGE",
          "android.permission.READ_MEDIA_VIDEO",
          "android.permission.READ_MEDIA_AUDIO",
        ],
        package: "com.w4s.development",
        googleServicesFile: "./config/google-services.json",
        config: {
          googleMaps: {
            apiKey: "AIzaSyBTcOHf5TBFbPd6jqnz_bBZCG89dcwCB9U",
          },
        },
        runtimeVersion: {
          policy: "nativeVersion",
        },
        useNextNotificationsApi: true,
        versionCode: versionCode,
      },
      plugins: [
        [
          "expo-notifications",
          {
            icon: "./assets/app-icon.png",
            // "sounds": ["./assets/sounds/emi.wav"],
            enableBackgroundRemoteNotifications: true,
          },
        ],
        "react-native-edge-to-edge",
        "@react-native-firebase/app",
        "expo-asset",
        "expo-dev-client",
        "expo-secure-store",
        "expo-font",
        "expo-localization",
        "expo-sqlite",
        [
          "@react-native-firebase/messaging",
          {
            ios: {
              useFrameworks: "static",
            },
          },
        ],
        [
          "expo-build-properties",
          {
            ios: {
              useFrameworks: "static",
              deploymentTarget: "16.0",
              extraPods: [
                {
                  name: "GoogleDataTransport",
                  version: "~> 10.0",
                  modular_headers: true,
                },
                {
                  name: "GoogleUtilities",
                  version: "~> 8.0",
                  modular_headers: true,
                },
              ],
            },
            android: {
              targetSdkVersion: 35,
              compileSdkVersion: 35,
              ndkVersion: "26.1.10909125",
              packagingOptions: {
                jniLibs: {
                  useLegacyPackaging: false,
                },
              },
              gradleProperties: {
                "android.bundle.enableUncompressedNativeLibs": "true",
                "android.useAndroidX": "true",
                "android.enableJetifier": "true",
              },
            },
          },
        ],
        [
          "expo-splash-screen",
          {
            backgroundColor: "#38B68C",
            android: {
              image: "./assets/logo/W4S_Light.png",
              imageResizeMode: "contain",
              imageWidth: 120,
            },
          },
        ],
        [
          "react-native-vision-camera",
          {
            cameraPermissionText:
              "W4S Mobile uses the camera to scan payment QR codes and to capture photos for identity verification (KYC).",
            enableMicrophonePermission: false,
          },
        ],
        [
          "expo-location",
          {
            locationAlwaysAndWhenInUsePermission:
              "W4S Mobile uses your location to select transaction locations and show nearby branches/ATMs.",
            locationWhenInUsePermission:
              "W4S Mobile uses your location to select transaction locations and show nearby branches/ATMs.",
          },
        ],
        [
          "expo-image-picker",
          {
            photosPermission:
              "W4S Mobile needs access to your photos to attach images to transactions.",
          },
        ],
        "expo-contacts",
      ],
      extra: {
        eas: {
          projectId: "da4b2865-9a79-4658-8321-1cf84cef3b33",
        },
        updateDate: buildDate,
        storeLinks: {
          ios: "https://apps.apple.com/us/app/emi-smart/id1673334414",
          android:
            "https://play.google.com/store/apps/details?id=com.jits.mbanking.emi.production&pcampaignid=web_share",
          huawei: "https://appgallery.huawei.com/#/app/C107689543",
        },
        hiddenLoginHeader: true,
      },
    },
  };
};
