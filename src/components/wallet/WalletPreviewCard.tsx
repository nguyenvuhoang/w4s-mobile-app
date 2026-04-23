import AppIcon from '@/components/base/AppIcon';
import CustomText from '@/components/base/CustomText';
import { hp, normalize, wp } from '@/utils/layout';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface WalletPreviewCardProps {
  icon: string;
  color: string;
  walletType?: string;
  walletName?: string;
}

const WalletPreviewCard: React.FC<WalletPreviewCardProps> = ({
  icon,
  color,
  walletType = 'Ví theo dõi',
  walletName = 'Tên ví',
}) => {
  return (
    <View style={styles.iconPreview}>
      <View style={[styles.previewCard, { backgroundColor: color }]}>
        <View style={styles.previewLeft}>
          <View style={styles.previewIconWrap}>
            <AppIcon name={icon as any} size={normalize(16)} color="#fff" />
          </View>

          <CustomText style={styles.previewLeftText} type="semiBold" numberOfLines={1}>
            {walletType}
          </CustomText>
        </View>

        <CustomText style={styles.previewRightText} type="bold" numberOfLines={1}>
          {walletName}
        </CustomText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  iconPreview: {
    alignItems: 'center',
    paddingVertical: hp(3),
    paddingHorizontal: wp(5),
  },
  previewCard: {
    width: '100%',
    minHeight: normalize(64),
    borderRadius: normalize(16),
    paddingHorizontal: normalize(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: normalize(12),
  },
  previewIconWrap: {
    width: normalize(26),
    height: normalize(26),
    borderRadius: normalize(13),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: normalize(8),
  },
  previewLeftText: {
    color: '#FFFFFF',
    fontSize: normalize(15),
    flexShrink: 1,
  },
  previewRightText: {
    color: '#FFFFFF',
    fontSize: normalize(16),
    textAlign: 'right',
    maxWidth: '45%',
  },
});

export default WalletPreviewCard;
