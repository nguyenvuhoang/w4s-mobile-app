import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { normalize, wp } from '@/utils/layout';
import React, { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

const { width: screenWidth } = Dimensions.get('window');

type ChartPoint = {
  value: number;
  label: string;
  fullLabel?: string;
};

interface LineChartCardProps {
  label: string;
  color: string;
  data: Array<{ value: number; label: string }>;
  formatYLabel?: (label: string) => string;
  scrollable?: boolean;
  minLabelPx?: number;
  startFromZero?: boolean;
}

const LineChartCard: React.FC<LineChartCardProps> = ({
  label,
  color,
  data,
  formatYLabel,
  scrollable = false,
  minLabelPx = normalize(15),
  startFromZero = true,
}) => {
  const { colors } = useAppTheme();

  const formatCurrency = (v: number) => v.toLocaleString('vi-VN') + ' đ';

  // ===== Layout =====
  const cardInnerWidth = screenWidth - wp(10) - normalize(32); // trừ marginHorizontal + padding card
  const chartWidthNoScroll = cardInnerWidth - normalize(20);    // chừa chút cho Y-axis & padding nội bộ

  const dataLengthRaw = data.length;

  const spacing = scrollable
    ? normalize(26)
    : Math.max(normalize(6), (chartWidthNoScroll - normalize(40)) / Math.max(1, dataLengthRaw));

  const finalChartWidth = scrollable
    ? dataLengthRaw * spacing + normalize(40)
    : chartWidthNoScroll;

  // ===== Preprocess data =====
  const chartData: ChartPoint[] = useMemo(() => {
    const base: ChartPoint[] = data.map((d) => ({
      value: d.value,
      label: d.label,
      fullLabel: d.label,
    }));

    const withZero: ChartPoint[] = startFromZero
      ? [{ value: 0, label: '', fullLabel: '0' }, ...base]
      : base;

    const n = withZero.length;
    if (n <= 2) return withZero;

    const visibleWidth = chartWidthNoScroll;
    const maxLabels = Math.max(2, Math.floor(visibleWidth / Math.max(1, minLabelPx))); // tối thiểu 2 (đầu/cuối)
    const interval = Math.max(1, Math.ceil((n - 1) / maxLabels));

    return withZero.map((p, i) => {
      const shouldShow =
        i === 0 || i === n - 1 || i % interval === 0;

      return {
        ...p,
        label: shouldShow ? (p.fullLabel ?? p.label) : '',
      };
    });
  }, [data, minLabelPx, startFromZero, chartWidthNoScroll]);

  const ChartComponent = (
    <LineChart
      data={chartData}
      width={finalChartWidth}
      height={normalize(180)}
      spacing={spacing}
      color={color}
      thickness={scrollable ? 2 : 1.6}
      areaChart
      startFillColor={color}
      endFillColor={color}
      startOpacity={0.7}
      endOpacity={0}
      yAxisColor={colors.border}
      xAxisColor={colors.border}
      yAxisTextStyle={{ fontSize: normalize(9), color: colors.icon }}
      xAxisLabelTextStyle={{ fontSize: normalize(8), color: colors.icon }}
      formatYLabel={formatYLabel}
      initialSpacing={normalize(6)}

      // ===== TƯƠNG TÁC =====
      showDataPointOnFocus
      dataPointsRadius={scrollable ? 4 : 3}
      dataPointsColor={color}
      focusedDataPointRadius={scrollable ? 6 : 5}
      focusedDataPointColor={color}

      showVerticalLines
      verticalLinesColor={colors.border}
      verticalLinesStrokeDashArray={[4, 4]}
      verticalLinesSpacing={spacing * (scrollable ? 4 : Math.max(3, Math.ceil(chartData.length / 6)))}

      pointerConfig={{
        pointerStripHeight: normalize(180),
        pointerStripColor: color,
        pointerStripWidth: 2,
        pointerColor: color,
        radius: 6,
        pointerLabelWidth: 110,
        pointerLabelHeight: 90,
        activatePointersOnLongPress: false,
        autoAdjustPointerLabelPosition: true,
        pointerLabelComponent: (items: any) => {
          if (!items || items.length === 0) return null;
          const item = items[0];
          const showLabel = item.fullLabel ?? item.label ?? '';

          return (
            <View
              style={[
                styles.pointerLabel,
                {
                  backgroundColor: colors.card,
                  borderColor: color,
                },
              ]}
            >
              <CustomText type="medium" size={11} style={{ color: colors.text }}>
                Ngày {showLabel}
              </CustomText>
              <CustomText type="bold" size={13} style={{ color, marginTop: 4 }}>
                {formatCurrency(item.value)}
              </CustomText>
            </View>
          );
        },
      }}
    />
  );

  return (
    <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
      <View style={styles.chartLegend}>
        <View style={[styles.legendDot, { backgroundColor: color }]} />
        <CustomText type="medium" size={14}>
          {label}
        </CustomText>

        {scrollable && (
          <CustomText
            type="regular"
            size={11}
            style={{ marginLeft: 'auto', color: colors.icon }}
          >
            Vuốt để xem →
          </CustomText>
        )}
      </View>

      <View style={styles.chartClip}>
        {scrollable ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: wp(5) }}
          >
            {ChartComponent}
          </ScrollView>
        ) : (
          ChartComponent
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartCard: {
    marginHorizontal: wp(5),
    marginBottom: normalize(16),
    padding: normalize(16),
    borderRadius: normalize(16),
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(12),
  },
  legendDot: {
    width: normalize(10),
    height: normalize(10),
    borderRadius: 5,
    marginRight: normalize(8),
  },

  chartClip: {
    borderRadius: normalize(12),
    overflow: 'hidden',
  },

  pointerLabel: {
    padding: normalize(10),
    borderRadius: normalize(8),
    borderWidth: 1.5,
    minWidth: normalize(90),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default LineChartCard;
