import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PaybookDetailScreen = () => {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <AppHeader title="Chi tiết sổ nợ" />
      <View style={styles.content}>
        <FontAwesome6
          name="book-open"
          size={normalize(64)}
          color={colors.icon}
          style={{ opacity: 0.3 }}
        />
        <CustomText style={[styles.text, { color: colors.icon }]}>
          Chức năng đang phát triển
        </CustomText>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: wp(4),
  },
  text: {
    fontSize: normalize(15),
    fontFamily: Fonts.regular,
    marginTop: hp(2),
    textAlign: "center",
  },
});

export default PaybookDetailScreen;
