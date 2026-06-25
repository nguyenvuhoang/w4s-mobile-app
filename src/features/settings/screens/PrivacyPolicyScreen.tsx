import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/font';
import { Tokens } from '@/core/theme/theme';
import { hp, normalize, wp } from '@/utils/layout';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../styles/PrivacyPolicyScreen.styles';

const mockHtmlContent = `
  <div>
    <h1>W4S Mobile Application Privacy Policy</h1>
    <p><strong>Effective date:</strong> June 18, 2026</p>

    <p>
      This Privacy Policy applies to the W4S mobile application.
      It explains how the W4S mobile application collects, uses, stores, protects, and shares user data.
    </p>
    <p>
      This Privacy Policy does not replace or modify the Privacy Policy applicable to the Wealth4S website
      or other Wealth4S services, unless expressly stated.
    </p>
    <p>
      By using the W4S mobile application, users acknowledge that their data may be processed as described in this Privacy Policy.
    </p>

    <h2>1. Information We Collect</h2>
    <p>The W4S mobile application may collect and process the following types of information:</p>
    <ul>
      <li><strong>Personal information:</strong> full name, phone number, email address, customer ID, user ID, or other information used to identify the user.</li>
      <li><strong>Account and authentication information:</strong> login ID, OTP verification status, authentication status, session information, token information, and security-related account data.</li>
      <li><strong>Financial and service information:</strong> account-related information, transaction information, service request information, and service usage history.</li>
      <li><strong>Device information:</strong> device ID, operating system, app version, IP address, push notification token, and other technical information required for app operation and security.</li>
      <li><strong>Camera, QR, and KYC data:</strong> information processed when the user uses QR scanning, identity verification, document capture, or related app features.</li>
      <li><strong>Location data:</strong> location information, only if the app provides location-based features and the user grants permission.</li>
      <li><strong>Logs and diagnostics:</strong> crash logs, performance logs, application logs, security logs, and diagnostic information.</li>
    </ul>

    <h2>2. How We Use Information</h2>
    <p>We use the information collected through the W4S mobile application for the following purposes:</p>
    <ul>
      <li>To provide digital financial services, loan/service request features, account management, and related application features.</li>
      <li>To authenticate users, verify identity, manage sessions, and protect user accounts.</li>
      <li>To process transactions, service requests, notifications, confirmations, and other user-initiated actions.</li>
      <li>To send OTP, push notifications, alerts, security messages, service messages, and other important communications.</li>
      <li>To improve application performance, reliability, security, functionality, and user experience.</li>
      <li>To detect, prevent, investigate, and respond to fraud, unauthorized access, suspicious activities, technical issues, or security incidents.</li>
      <li>To comply with legal, regulatory, accounting, audit, security, dispute resolution, and risk management requirements.</li>
    </ul>

    <h2>3. Data Sharing</h2>
    <p>
      We do not sell user personal data. User data may be shared with authorized service providers, technology partners,
      payment or financial institutions, infrastructure providers, regulators, law enforcement agencies, courts, auditors,
      or legal authorities where such sharing is necessary for service operation, transaction processing, security, compliance,
      legal obligations, audit, dispute resolution, or fraud prevention.
    </p>
    <p>
      Any third party that processes data on our behalf is expected to process such data only for authorized purposes and
      to apply appropriate security and confidentiality measures.
    </p>

    <h2>4. Data Security</h2>
    <p>
      We apply technical and organizational measures designed to protect user data against unauthorized access, loss, misuse,
      alteration, or disclosure. These measures may include encryption in transit, secure authentication, access control,
      monitoring, logging, system hardening, and security review procedures.
    </p>
    <p>
      However, no method of transmission over the Internet or electronic storage is completely secure. We continuously work
      to maintain and improve the security of the W4S mobile application.
    </p>

    <h2>5. Data Retention</h2>
    <p>
      User data is retained only for as long as necessary to provide the application and related services, maintain security,
      process transactions, support user requests, resolve disputes, and comply with legal, regulatory, accounting, audit,
      fraud prevention, and risk management obligations.
    </p>
    <p>
      Retention periods may vary depending on the type of data, the purpose of processing, contractual obligations,
      applicable law, and financial or regulatory requirements.
    </p>

    <h2>6. Account and Data Deletion</h2>
    <p>
      Users may request account deletion or data deletion by contacting Wealth4S through the support channel below,
      or through any account deletion request channel provided in the W4S mobile application.
    </p>
    <p>
      Upon receiving a valid request, we will review and process the request in accordance with applicable laws,
      service requirements, security requirements, and regulatory obligations.
    </p>
    <p>
      Certain data may be retained where required or permitted by law, financial regulations, accounting obligations,
      audit requirements, fraud prevention, security monitoring, legal claims, dispute resolution, or legitimate business obligations.
    </p>

    <h2>7. Third-party SDKs and Services</h2>
    <p>
      The W4S mobile application may use third-party SDKs and services, such as Firebase, push notification services,
      analytics services, crash reporting services, cloud infrastructure, security tools, or other technology providers.
    </p>
    <p>
      These services may process limited device information, diagnostic data, usage data, crash data, push notification tokens,
      or other technical data for application operation, notification delivery, performance monitoring, security, troubleshooting,
      and service improvement.
    </p>

    <h2>8. User Permissions</h2>
    <p>
      The W4S mobile application may request permissions such as camera, notification, location, biometric, storage,
      or other device permissions depending on the features used.
    </p>
    <p>
      Permissions are requested only when required for related app features, such as QR scanning, identity verification,
      security authentication, notification delivery, or location-based services. Users may manage app permissions through
      their device settings. Some app features may not function properly if required permissions are disabled.
    </p>

    <h2>9. Children's Privacy</h2>
    <p>
      The W4S mobile application is intended for users who are eligible to use financial or related services. It is not intended
      for children or users who are not legally eligible to use such services. We do not knowingly collect personal data from
      children through the W4S mobile application.
    </p>

    <h2>10. Changes to This Privacy Policy</h2>
    <p>
      We may update this Privacy Policy from time to time to reflect changes in our application, services, legal requirements,
      regulatory requirements, or data processing practices. Updated versions will be published on this page with a revised effective date.
    </p>

    <h2>11. Contact Us</h2>
    <p>
      If users have any questions, requests, or concerns regarding this Privacy Policy or the processing of their data,
      they may contact us using the information below:
    </p>
    <p>
      <strong>Company:</strong> Wealth4S<br>
      <strong>Email:</strong> <a href="mailto:support@wealth4s.vn">support@wealth4s.vn</a><br>
      <strong>Website:</strong> <a href="https://wealth4s.vn">https://wealth4s.vn</a><br>
      <strong>App Privacy Policy URL:</strong> <a href="https://wealth4s.vn/app-policy">https://wealth4s.vn/app-policy</a>
    </p>
    
    <p class="note">© 2026 W4S. All rights reserved.</p>
  </div>
`;

const StaticHtmlViewer = React.memo(
  ({ htmlContent, themeColors, width }: { htmlContent: string; themeColors: any; width: number }) => {
    const tagsStyles = useMemo(() => ({
      body: { color: themeColors.text, fontFamily: Fonts.regular, fontSize: normalize(16), lineHeight: normalize(24) },
      h1: { color: themeColors.tint || themeColors.text, fontFamily: Fonts.bold, fontSize: normalize(24), marginBottom: normalize(16) },
      h2: { color: themeColors.text, fontFamily: Fonts.bold, fontSize: normalize(20), marginTop: normalize(20), marginBottom: normalize(10), borderTopWidth: 1, borderTopColor: themeColors.border, paddingTop: normalize(16) },
      h3: { color: themeColors.text, fontFamily: Fonts.semiBold, fontSize: normalize(18), marginTop: normalize(16), marginBottom: normalize(8) },
      p: { color: themeColors.text, fontFamily: Fonts.regular, fontSize: normalize(16), marginBottom: normalize(12), lineHeight: normalize(24), textAlign: 'justify' as const },
      li: { color: themeColors.text, fontFamily: Fonts.regular, fontSize: normalize(16), marginBottom: normalize(8), lineHeight: normalize(24) },
      ul: { marginVertical: normalize(8), paddingLeft: normalize(20) },
      strong: { fontFamily: Fonts.bold },
      em: { fontStyle: 'italic' } as any,
      a: { color: themeColors.tint || '#0057ff', textDecorationLine: 'underline' as const },
    }), [themeColors]);

    const classesStyles = useMemo(() => ({
      note: { color: themeColors.icon, fontSize: normalize(14), borderTopWidth: 1, borderTopColor: themeColors.border, marginTop: normalize(24), paddingTop: normalize(12) }
    }), [themeColors]);

    return (
      <RenderHtml
        contentWidth={width}
        source={{ html: htmlContent }}
        tagsStyles={tagsStyles}
        classesStyles={classesStyles}
        systemFonts={[Fonts.regular, Fonts.medium, Fonts.semiBold, Fonts.bold]}
      />
    );
  },
  (prev, next) => prev.htmlContent === next.htmlContent && prev.themeColors === next.themeColors
);

const PrivacyPolicyScreen = () => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ showAgreement?: string }>();
  const isRequireAgreement = params.showAgreement === 'true';

  const [agreed, setAgreed] = useState(false);
  const footerRef = useRef<View>(null);
  const checkboxRef = useRef<View>(null);

  const footerHRef = useRef(0);
  const checkboxHRef = useRef(0);

  const lastScrollY = useRef(0);
  const footerTranslateY = useRef(new Animated.Value(0)).current;
  const isFooterHidden = useRef(false);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const contentWidth = useMemo(() => Dimensions.get("window").width, []);

  // Compute footer scroll hide distance dynamically
  const calculateDistanceToHide = useCallback(() => {
    const fH = footerHRef.current;
    const cH = checkboxHRef.current;

    if (fH === 0 || cH === 0) return 0;
    const visiblePart = cH + insets.bottom + normalize(25);
    return Math.max(0, fH - visiblePart);
  }, [insets.bottom]);

  const animateFooter = useCallback((toValue: number) => {
    if (animationRef.current) animationRef.current.stop();
    animationRef.current = Animated.timing(footerTranslateY, {
      toValue: toValue,
      duration: 300,
      useNativeDriver: true,
    });
    animationRef.current.start(() => {
      animationRef.current = null;
    });
  }, [footerTranslateY]);

  // Hide footer when scrolling down, show when scrolling up
  const handleScroll = useCallback((event: any) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;

    if (currentY < 0) {
      if (isFooterHidden.current) {
        animateFooter(0);
        isFooterHidden.current = false;
      }
      lastScrollY.current = 0;
      return;
    }

    const dy = currentY - lastScrollY.current;
    const scrollThreshold = 10;
    const hideDistance = calculateDistanceToHide();

    if (hideDistance > 0 && !agreed) {
      if (dy > scrollThreshold && !isFooterHidden.current) {
        animateFooter(hideDistance);
        isFooterHidden.current = true;
      } else if (dy < -scrollThreshold && isFooterHidden.current) {
        animateFooter(0);
        isFooterHidden.current = false;
      }
    }

    const distanceToBottom = contentHeight - currentY - layoutHeight;
    if (distanceToBottom < 60 && isFooterHidden.current) {
      animateFooter(0);
      isFooterHidden.current = false;
    }

    if (Math.abs(dy) > scrollThreshold / 2) {
      lastScrollY.current = currentY;
    }
  }, [agreed, animateFooter, calculateDistanceToHide]);

  useEffect(() => {
    if (agreed) {
      animateFooter(0);
      isFooterHidden.current = false;
    } else {
      const hideDistance = calculateDistanceToHide();
      if (hideDistance > 0) {
        animateFooter(hideDistance);
        isFooterHidden.current = true;
      }
    }
  }, [agreed, animateFooter, calculateDistanceToHide]);

  const handleFooterLayout = useCallback((event: any) => {
    const height = Math.round(event.nativeEvent.layout.height);
    footerHRef.current = height;
  }, []);

  const handleCheckboxLayout = useCallback((event: any) => {
    const height = Math.round(event.nativeEvent.layout.height);
    checkboxHRef.current = height;
  }, []);

  const handleContinue = () => {
    if (agreed) {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={Tokens.gradients.base}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={[
          styles.headerContent,
          { paddingTop: insets.top + normalize(10) },
        ]}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={normalize(24)} color="#fff" />
          </TouchableOpacity>
          <CustomText style={styles.headerText}>{t('settings.privacy_policy')}</CustomText>
        </View>
      </LinearGradient>

      <View style={styles.contentWrapper}>
        <ScrollView
          style={styles.htmlContainer}
          onScroll={isRequireAgreement ? handleScroll : undefined}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingBottom: isRequireAgreement ? insets.bottom + hp(25) : insets.bottom + hp(5),
            paddingHorizontal: wp(7),
            paddingTop: hp(3),
          }}
        >
          <StaticHtmlViewer htmlContent={mockHtmlContent} themeColors={colors} width={contentWidth - wp(14)} />
        </ScrollView>

        {isRequireAgreement && (
          <Animated.View
            ref={footerRef}
            onLayout={handleFooterLayout}
            style={[
              styles.footer,
              {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
                paddingBottom: Math.max(insets.bottom, normalize(20)),
                transform: [{ translateY: footerTranslateY }],
              },
            ]}
          >
            <TouchableOpacity
              ref={checkboxRef}
              onLayout={handleCheckboxLayout}
              style={styles.checkboxContainer}
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={agreed ? "checkbox" : "square-outline"}
                size={normalize(24)}
                color={agreed ? Tokens.colors.foundation.primary['primary-1'] : colors.icon}
              />
              <CustomText style={[styles.checkboxLabel, { color: colors.text }]}>
                Tôi đã đọc và đồng ý với chính sách
              </CustomText>
            </TouchableOpacity>

            <CustomText style={[styles.additionalNote, { color: colors.icon }]}>
              Vui lòng cuộn xuống cuối màn hình để xem đầy đủ chính sách trước khi xác nhận.
            </CustomText>

            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: agreed ? 'transparent' : colors.border,
                  opacity: agreed ? 1 : 0.6,
                  overflow: 'hidden',
                },
              ]}
              onPress={handleContinue}
              disabled={!agreed}
            >
              {agreed && (
                <LinearGradient
                  colors={Tokens.gradients.base}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <CustomText style={styles.buttonText}>{t('common.continue')}</CustomText>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

export default PrivacyPolicyScreen;
