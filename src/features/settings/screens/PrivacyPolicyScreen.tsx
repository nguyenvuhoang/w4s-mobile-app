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
    <h2>Chính Sách Bảo Mật</h2>
    <p>Chào mừng bạn đến với ứng dụng <strong>W4S</strong>. Việc bảo vệ dữ liệu cá nhân tính riêng tư của bạn là ưu tiên hàng đầu của chúng tôi.</p>
    <p>Tài liệu này giải thích chi tiết cách thức chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin cá nhân của bạn khi bạn sử dụng dịch vụ của ứng dụng.</p>
    
    <h3>1. Thu thập thông tin</h3>
    <p>Thu thập tự động: Khi bạn sử dụng ứng dụng, hệ thống tự động ghi nhận các thông tin như địa chỉ IP, loại thiết bị, hệ điều hành và lịch sử thao tác nhằm mục đích chẩn đoán lỗi và cải thiện hiệu năng.</p>
    <p>Thu thập chủ động: Chúng tôi lưu trữ thông tin cơ bản khi bạn đăng ký tài khoản bao gồm tên, số điện thoại, email và các thông tin cần thiết khác nhằm cung cấp đầy đủ quyền lợi người dùng.</p>
    
    <h3>2. Sử dụng dữ liệu</h3>
    <p>Dữ liệu của bạn được sử dụng vào các mục đích sau:</p>
    <ul>
      <li>Xác thực và duy trì trạng thái đăng nhập.</li>
      <li>Cải thiện và cá nhân hóa trải nghiệm người dùng trong tương lai.</li>
      <li>Gửi các thông báo quan trọng liên quan đến bảo mật hoặc nâng cấp dịch vụ.</li>
    </ul>
    
    <h3>3. Bảo mật thông tin</h3>
    <p>Hệ thống W4S cam kết không chia sẻ, bán hoặc trao đổi thông tin người dùng với bất kỳ bên thứ ba nào khi chưa có sự đồng ý của bạn. Mọi giao dịch và dữ liệu cá nhân đều được mã hóa theo các tiêu chuẩn bảo mật cao nhất hiện nay.</p>
    <p>Chúng tôi luôn nỗ lực thực hiện các biện pháp kỹ thuật tiên tiến nhất để chống lại các rủi ro rò rỉ dữ liệu, đảm bảo dữ liệu luôn được an toàn.</p>
    
    <h3>4. Quyền của người dùng</h3>
    <p>Bạn luôn có quyền truy cập, chỉnh sửa hoặc yêu cầu hệ thống xóa toàn bộ dữ liệu cá nhân của mình trực tiếp thông qua mục Cài đặt của ứng dụng, hoặc liên hệ với đội ngũ CSKH để được hỗ trợ kịp thời.</p>
    
    <h3>5. Sửa đổi chính sách</h3>
    <p>Chúng tôi có quyền thay đổi chính sách bảo mật này bất cứ khi nào để phù hợp với quy định pháp luật. Mọi sửa đổi sẽ được thông báo đến người sử dụng.</p>
    <p>Trân trọng,<br/><strong>Đội ngũ phát triển W4S</strong></p>
  </div>
`;

const StaticHtmlViewer = React.memo(
  ({ htmlContent, themeColors, width }: { htmlContent: string; themeColors: any; width: number }) => {
    const tagsStyles = useMemo(() => ({
      body: { color: themeColors.text, fontFamily: Fonts.regular, fontSize: normalize(16), lineHeight: normalize(24) },
      h2: { color: themeColors.text, fontFamily: Fonts.bold, fontSize: normalize(22), marginBottom: normalize(16) },
      h3: { color: themeColors.text, fontFamily: Fonts.semiBold, fontSize: normalize(18), marginTop: normalize(16), marginBottom: normalize(8) },
      p: { color: themeColors.text, fontFamily: Fonts.regular, fontSize: normalize(16), marginBottom: normalize(12), lineHeight: normalize(24), textAlign: 'justify' as const },
      li: { color: themeColors.text, fontFamily: Fonts.regular, fontSize: normalize(16), marginBottom: normalize(8), lineHeight: normalize(24) },
      ul: { marginVertical: normalize(8), paddingLeft: normalize(20) },
      strong: { fontFamily: Fonts.bold },
      em: { fontStyle: 'italic' } as any,
    }), [themeColors]);

    return (
      <RenderHtml
        contentWidth={width}
        source={{ html: htmlContent }}
        tagsStyles={tagsStyles}
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
