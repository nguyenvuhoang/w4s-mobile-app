import CustomButton from '@/components/base/CustomButton';
import CustomText from '@/components/base/CustomText';
import { Fonts } from '@/core/theme/font';
import { Tokens } from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { normalize } from '@/utils/layout';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Keyboard,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const OTP_LENGTH = 5;

const OtpVerificationScreen = () => {
    const router = useRouter();
    const { colors } = useAppTheme();
    const [code, setCode] = useState('');
    const inputRef = useRef<TextInput>(null);
    const [isFocused, setIsFocused] = useState(false);

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            // Fallback or explicit navigation if needed
            router.push('/(auth)/login');
        }
    };

    const handleVerify = () => {
        console.log('Verifying code:', code);
        // TODO: Implement verification logic
    };

    const handleResend = () => {
        console.log('Resend code');
        // TODO: Implement resend logic
    };

    const codeDigitsArray = new Array(OTP_LENGTH).fill(0);

    const handleOnPress = () => {
        setIsFocused(true);
        inputRef.current?.focus();
    };

    const handleOnBlur = () => {
        setIsFocused(false);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={[styles.backButton, { backgroundColor: colors.card, shadowColor: Tokens.colors.main.black }]}>
                    <Ionicons name="arrow-back" size={normalize(24)} color={colors.text} />
                </TouchableOpacity>
            </View>

            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.content}>
                    <CustomText style={styles.title} type="bold" size={28}>
                        OTP Verification
                    </CustomText>

                    <CustomText style={[styles.description, { color: colors.icon }]} size={14}>
                        Enter the verification code we just sent to your Zalo account
                    </CustomText>

                    {/* OTP Input Section */}
                    <View style={styles.otpContainer}>
                        <TextInput
                            ref={inputRef}
                            value={code}
                            onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH))}
                            keyboardType="number-pad"
                            textContentType="oneTimeCode"
                            maxLength={OTP_LENGTH}
                            style={styles.hiddenInput}
                            onFocus={() => setIsFocused(true)}
                            onBlur={handleOnBlur}
                        />
                        <View style={styles.otpInputsContainer}>
                            {codeDigitsArray.map((_, index) => {
                                const digit = code[index] || '';
                                const isCurrentDigit = index === code.length;
                                const isLastDigit = index === OTP_LENGTH - 1;
                                const isActive = isFocused && (isCurrentDigit || (code.length === OTP_LENGTH && index === OTP_LENGTH - 1));

                                return (
                                    <TouchableWithoutFeedback key={index} onPress={handleOnPress}>
                                        <View
                                            style={[
                                                styles.otpBox,
                                                {
                                                    borderColor: isActive ? colors.tint : colors.border,
                                                    backgroundColor: colors.card,
                                                    borderWidth: isActive ? 2 : 1,
                                                }
                                            ]}
                                        >
                                            <CustomText size={24} type="bold" style={[styles.otpText, { color: colors.text }]}>
                                                {digit}
                                            </CustomText>
                                        </View>
                                    </TouchableWithoutFeedback>
                                );
                            })}
                        </View>
                    </View>

                    {/* Verify Button */}
                    <CustomButton
                        title="Verify"
                        onPress={handleVerify}
                        style={styles.verifyButton}
                    />

                    {/* Resend Link */}
                    <View style={styles.resendContainer}>
                        <CustomText style={{ color: colors.icon }}>
                            Didn’t receive a code?{' '}
                        </CustomText>
                        <TouchableOpacity onPress={handleResend}>
                            <CustomText style={{ color: colors.tint, marginTop: 0 }} type="bold">
                                Resend
                            </CustomText>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: normalize(20),
    },
    header: {
        paddingVertical: normalize(16),
        alignItems: 'flex-start',
    },
    backButton: {
        padding: normalize(8),
        borderRadius: normalize(50),
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    content: {
        marginTop: normalize(20),
        flex: 1,
    },
    title: {
        marginBottom: normalize(12),
        fontFamily: Fonts.bold,
    },
    description: {
        marginBottom: normalize(40),
        lineHeight: normalize(22),
    },
    otpContainer: {
        marginBottom: normalize(40),
        width: '100%',
    },
    hiddenInput: {
        position: 'absolute',
        width: 1,
        height: 1,
        opacity: 0,
    },
    otpInputsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    otpBox: {
        width: normalize(56),
        height: normalize(64),
        borderRadius: normalize(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    otpText: {
        textAlign: 'center',
    },
    verifyButton: {
        marginBottom: normalize(24),
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default OtpVerificationScreen;
