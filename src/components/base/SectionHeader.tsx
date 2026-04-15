import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { wp } from '@/utils/layout';
import { t } from 'i18next';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface SectionHeaderProps {
  title: string;
  showAction?: boolean;
  actionText?: string;
  onPressAction?: () => void;
}

const SectionHeader = ({
  title,
  showAction = false,
  actionText = t("common.view_all"),
  onPressAction,
}: SectionHeaderProps) => {
  const { colors } = useAppTheme();

  return (
    <View style={styles.sectionHeader}>
      <CustomText type="semiBold" size={18}>
        {title}
      </CustomText>

      {showAction && (
        <TouchableOpacity
          onPress={onPressAction}
          activeOpacity={0.7}
          disabled={!onPressAction}
        >
          <CustomText
            type="medium"
            size={14}
            style={{ color: colors.tint }}
          >
            {actionText}
          </CustomText>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SectionHeader;

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    paddingHorizontal: wp(5),
    marginBottom: 12,
  },
});
