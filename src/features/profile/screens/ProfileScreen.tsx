import AppHeader from "@/components/base/AppHeader";
import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { hp, normalize, wp } from "@/utils/layout";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ProfileScreen = () => {
    const { colors } = useAppTheme();

    // Mock user data - replace with actual user data from your auth/state management
    const [userData] = useState({
        name: "Nguyễn Văn A",
        email: "nguyenvana@email.com",
        phone: "+84 912 345 678",
        dateOfBirth: "15/05/1995",
        gender: "Nam",
        address: "Quận 1, TP. Hồ Chí Minh",
        avatar: null, // or URL string
    });

    const profileItems = [
        { icon: "person-outline", label: "Họ và tên", value: userData.name },
        { icon: "mail-outline", label: "Email", value: userData.email },
        { icon: "call-outline", label: "Số điện thoại", value: userData.phone },
        { icon: "calendar-outline", label: "Ngày sinh", value: userData.dateOfBirth },
        { icon: "male-female-outline", label: "Giới tính", value: userData.gender },
        { icon: "location-outline", label: "Địa chỉ", value: userData.address },
    ];

    const handleChangeAvatar = () => {
        // Handle avatar change - open image picker
        console.log("Change avatar");
    };

    const handleEditProfile = () => {
        // Navigate to edit profile screen
        console.log("Edit profile");
    };

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <AppHeader title="Thông tin cá nhân" showBackButton />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Profile Header */}
                <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
                    <View style={styles.avatarContainer}>
                        {userData.avatar ? (
                            <Image source={{ uri: userData.avatar }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.tint }]}>
                                <Ionicons name="person" size={normalize(48)} color="#fff" />
                            </View>
                        )}
                        <TouchableOpacity
                            style={[styles.cameraButton, { backgroundColor: colors.tint }]}
                            onPress={handleChangeAvatar}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="camera" size={normalize(18)} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <ThemedText style={[styles.userName, { color: colors.text }]}>
                        {userData.name}
                    </ThemedText>
                    <ThemedText style={[styles.userEmail, { color: colors.icon }]}>
                        {userData.email}
                    </ThemedText>

                    <TouchableOpacity
                        style={[styles.editButton, { backgroundColor: colors.tint }]}
                        onPress={handleEditProfile}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="create-outline" size={normalize(18)} color="#fff" />
                        <ThemedText style={styles.editButtonText}>Chỉnh sửa thông tin</ThemedText>
                    </TouchableOpacity>
                </View>

                {/* Profile Information */}
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    {profileItems.map((item, itemIndex) => (
                        <View key={itemIndex}>
                            <View style={styles.infoItem}>
                                <View style={styles.infoLeft}>
                                    <View
                                        style={[
                                            styles.iconWrapper,
                                            { backgroundColor: colors.background },
                                        ]}
                                    >
                                        <Ionicons
                                            name={item.icon as any}
                                            size={normalize(20)}
                                            color={colors.tint}
                                        />
                                    </View>
                                    <ThemedText
                                        style={[styles.infoLabel, { color: colors.icon }]}
                                    >
                                        {item.label}
                                    </ThemedText>
                                </View>
                                <ThemedText
                                    style={[styles.infoValue, { color: colors.text }]}
                                    numberOfLines={2}
                                >
                                    {item.value}
                                </ThemedText>
                            </View>
                            {itemIndex < profileItems.length - 1 && (
                                <View
                                    style={[styles.divider, { backgroundColor: colors.border }]}
                                />
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
        gap: normalize(16),
    },

    // Header Card
    headerCard: {
        borderRadius: normalize(16),
        padding: normalize(24),
        alignItems: "center",
        gap: normalize(12),
    },
    avatarContainer: {
        position: "relative",
        marginBottom: normalize(8),
    },
    avatar: {
        width: normalize(100),
        height: normalize(100),
        borderRadius: normalize(50),
    },
    avatarPlaceholder: {
        width: normalize(100),
        height: normalize(100),
        borderRadius: normalize(50),
        alignItems: "center",
        justifyContent: "center",
    },
    cameraButton: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: normalize(36),
        height: normalize(36),
        borderRadius: normalize(18),
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: "#fff",
    },
    userName: {
        fontSize: normalize(22),
        fontFamily: Fonts.bold,
        lineHeight: normalize(28),
    },
    userEmail: {
        fontSize: normalize(14),
        fontFamily: Fonts.regular,
        lineHeight: normalize(20),
    },
    editButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: normalize(8),
        paddingHorizontal: normalize(20),
        paddingVertical: normalize(10),
        borderRadius: normalize(12),
        marginTop: normalize(8),
    },
    editButtonText: {
        fontSize: normalize(14),
        fontFamily: Fonts.medium,
        color: "#fff",
    },

    // Card
    card: {
        borderRadius: normalize(16),
        padding: normalize(16),
    },

    // Info Item
    infoItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: normalize(12),
        gap: normalize(12),
    },
    infoLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: normalize(12),
        flex: 1,
    },
    iconWrapper: {
        width: normalize(40),
        height: normalize(40),
        borderRadius: normalize(12),
        alignItems: "center",
        justifyContent: "center",
    },
    infoLabel: {
        fontSize: normalize(14),
        fontFamily: Fonts.regular,
        lineHeight: normalize(20),
    },
    infoValue: {
        fontSize: normalize(14),
        fontFamily: Fonts.medium,
        lineHeight: normalize(20),
        textAlign: "right",
        flex: 1,
    },

    // Divider
    divider: {
        height: 1,
        opacity: 0.1,
    },
});

export default ProfileScreen;