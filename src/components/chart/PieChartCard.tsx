import CustomText from "@/components/base/CustomText";
import { normalize } from "@/utils/layout";
import React, { useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import Svg, { Circle, Line } from "react-native-svg";

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface PieChartWithLabelsProps {
  data: PieChartData[];
  title: string;
  backgroundColor?: string;
  showAsPercent?: boolean;
  minShowPercent?: number;
}

type LabelInfo = {
  index: number;
  side: "left" | "right";
  x1: number;
  y1: number; // điểm xuất phát từ pie
  x2: number;
  y2: number; // điểm gãy (ngang)
  x4: number;
  y4: number; // điểm kết thúc ở label
  labelY: number; // vị trí Y của label
};

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const PieChartWithLabels: React.FC<PieChartWithLabelsProps> = ({
  data,
  title,
  backgroundColor = "#fff",
  showAsPercent = true,
  minShowPercent = 0,
}) => {
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.floor(e.nativeEvent.layout.width);
    if (w && w !== measuredWidth) setMeasuredWidth(w);
  };

  const safeData = useMemo(
    () => data.filter((d) => Number.isFinite(d.value) && d.value > 0),
    [data]
  );
  const total = useMemo(
    () => safeData.reduce((s, d) => s + d.value, 0),
    [safeData]
  );

  const pieData = useMemo(
    () =>
      safeData.map((d, idx) => ({
        value: d.value,
        color: d.color,
        onPress: () => {
          // Toggle: nếu đang focus thì unfocus, nếu chưa focus thì focus
          setFocusedIndex((prev) => (prev === idx ? -1 : idx));
        },
      })),
    [safeData]
  );

  // ===== LAYOUT: 2 CỘT BÊN TỰ ĐỘNG, CỘT GIỮA LẤY PHẦN CÒN LẠI =====
  const layout = useMemo(() => {
    const totalWidth = measuredWidth || normalize(320);

    // Width của 2 cột label (tự động theo nội dung, có thể tùy chỉnh)
    const sideColumnWidth = Math.max(normalize(80), totalWidth * 0.25); // 25% hoặc tối thiểu 80

    // Cột giữa = phần còn lại
    const middleColumnWidth = totalWidth - 2 * sideColumnWidth;

    // Tính hình vuông lớn nhất có thể cho pie
    const maxPieSize = middleColumnWidth;
    const pieSize = Math.min(maxPieSize, normalize(180)); // giới hạn max
    const pieRadius = pieSize / 2;
    const pieInnerRadius = pieRadius * 0.62;

    // Height của wrapper = pieSize + padding
    const paddingY = normalize(20);
    const wrapperHeight = pieSize + paddingY * 2;

    // Vị trí các cột
    const leftColumnX = 0;
    const middleColumnX = sideColumnWidth;
    const rightColumnX = sideColumnWidth + middleColumnWidth;

    // Center của pie (giữa cột giữa)
    const pieCenterX = middleColumnX + middleColumnWidth / 2;
    const pieCenterY = wrapperHeight / 2;

    return {
      totalWidth,
      sideColumnWidth,
      middleColumnWidth,
      pieSize,
      pieRadius,
      pieInnerRadius,
      wrapperHeight,
      leftColumnX,
      middleColumnX,
      rightColumnX,
      pieCenterX,
      pieCenterY,
      paddingY,
    };
  }, [measuredWidth]);

  // ===== TÍNH VỊ TRÍ LABELS =====
  const labelInfos: LabelInfo[] = useMemo(() => {
    if (!safeData.length || total <= 0) return [];

    const {
      sideColumnWidth,
      pieRadius,
      pieCenterX,
      pieCenterY,
      leftColumnX,
      rightColumnX,
      wrapperHeight,
      paddingY,
    } = layout;

    const rOut = pieRadius;

    const labelPadding = normalize(10); // padding trong label column

    const topBound = paddingY + normalize(18); // tăng margin trên
    const bottomBound = wrapperHeight - paddingY - normalize(18); // tăng margin dưới
    const minGapY = normalize(36); // tăng khoảng cách giữa các label

    const percents = safeData.map((d) => (d.value / total) * 100);
    let startAngle = -Math.PI / 2;
    const raw: LabelInfo[] = [];

    // Tính vị trí ban đầu cho mỗi label
    for (let i = 0; i < safeData.length; i++) {
      const sliceAngle = (safeData[i].value / total) * Math.PI * 2;
      const mid = startAngle + sliceAngle / 2;
      startAngle += sliceAngle;

      if (percents[i] < minShowPercent) continue;

      const cos = Math.cos(mid);
      const sin = Math.sin(mid);
      const side: "left" | "right" = cos >= 0 ? "right" : "left";

      // Điểm xuất phát từ pie (x1, y1)
      const x1 = pieCenterX + cos * rOut;
      const y1 = pieCenterY + sin * rOut;

      // Điểm kết thúc: cột trái vào bên phải label, cột phải vào bên trái label
      const x4 =
        side === "right"
          ? rightColumnX + normalize(12) // vào bên trái label (cột phải)
          : leftColumnX + sideColumnWidth - normalize(12); // vào bên phải label (cột trái)

      // Đường nối đơn giản: từ pie → ngang → label (2 đoạn)
      // x2, y2: điểm gãy (ngang từ pie)
      const x2 =
        side === "right"
          ? rightColumnX - normalize(8) // gần cột phải
          : leftColumnX + sideColumnWidth + normalize(8); // gần cột trái
      const y2 = y1;

      raw.push({
        index: i,
        side,
        x1,
        y1,
        x2,
        y2,
        x4,
        y4: y1, // sẽ được update trong adjustSide()
        labelY: y1,
      });
    }

    // Hàm điều chỉnh vị trí labels để không overlap và phân bố đều
    const adjustSide = (arr: LabelInfo[]) => {
      if (arr.length === 0) return [];

      const sorted = [...arr].sort((a, b) => a.labelY - b.labelY);
      const n = sorted.length;

      // Tính tổng không gian cần thiết
      const totalNeededSpace = (n - 1) * minGapY;
      const availableSpace = bottomBound - topBound;

      if (totalNeededSpace > availableSpace) {
        // Nếu không đủ chỗ: phân bố đều trong khoảng có sẵn
        const actualGap = availableSpace / (n - 1);
        for (let i = 0; i < n; i++) {
          sorted[i].labelY = topBound + i * actualGap;
        }
      } else {
        // Có đủ chỗ: căn chỉnh thông minh

        // Step 1: Clamp ban đầu
        for (const p of sorted) {
          p.labelY = clamp(p.labelY, topBound, bottomBound);
        }

        // Step 2: Fix overlaps - đẩy xuống
        for (let i = 1; i < n; i++) {
          const prev = sorted[i - 1];
          const cur = sorted[i];
          if (cur.labelY - prev.labelY < minGapY) {
            cur.labelY = prev.labelY + minGapY;
          }
        }

        // Step 3: Nếu labels cuối vượt bound, kéo tất cả lên
        if (sorted[n - 1].labelY > bottomBound) {
          const overflow = sorted[n - 1].labelY - bottomBound;
          for (const p of sorted) {
            p.labelY -= overflow;
          }
        }

        // Step 4: Clamp lại lần cuối
        for (const p of sorted) {
          p.labelY = clamp(p.labelY, topBound, bottomBound);
        }

        // Step 5: Fix lại gaps sau khi clamp (nếu cần)
        for (let pass = 0; pass < 2; pass++) {
          for (let i = 1; i < n; i++) {
            const prev = sorted[i - 1];
            const cur = sorted[i];
            if (cur.labelY - prev.labelY < minGapY) {
              const mid = (prev.labelY + cur.labelY) / 2;
              prev.labelY = mid - minGapY / 2;
              cur.labelY = mid + minGapY / 2;
            }
          }
          // Clamp sau mỗi pass
          for (const p of sorted) {
            p.labelY = clamp(p.labelY, topBound, bottomBound);
          }
        }
      }

      // Sync y4 với labelY
      for (const p of sorted) {
        p.y4 = p.labelY;
      }

      return sorted;
    };

    const left = adjustSide(raw.filter((p) => p.side === "left"));
    const right = adjustSide(raw.filter((p) => p.side === "right"));

    return [...left, ...right].sort((a, b) => a.index - b.index);
  }, [safeData, total, minShowPercent, layout]);

  const formatValue = (idx: number) => {
    if (!safeData[idx] || total <= 0) return "";
    if (!showAsPercent) return `${safeData[idx].value}`;
    const pct = (safeData[idx].value / total) * 100;
    const s =
      pct < 10 && Math.abs(pct - Math.round(pct)) > 0.01
        ? pct.toFixed(2)
        : pct.toFixed(0);
    return `${s}%`;
  };

  const centerLabelComponent = () => {
    if (focusedIndex < 0 || !safeData[focusedIndex]) return null;

    const item = safeData[focusedIndex];
    // Hiển thị value gốc - format với dấu phẩy ngăn cách
    const value =
      typeof item.value === "number"
        ? item.value.toLocaleString("en-US") // VD: 1,234,567
        : String(item.value);

    return (
      <View style={styles.centerLabel}>
        <CustomText
          type="medium"
          size={10}
          style={styles.centerName}
          numberOfLines={2}
        >
          {item.name}
        </CustomText>
        <CustomText
          type="bold"
          size={16}
          style={[styles.centerValue, { color: item.color }]}
        >
          {value}
        </CustomText>
      </View>
    );
  };

  return (
    <View style={[styles.chartCard, { backgroundColor }]} onLayout={onLayout}>
      <CustomText type="medium" size={14} style={styles.chartTitle}>
        {title}
      </CustomText>

      <View style={styles.center}>
        <View
          style={[
            styles.wrapper,
            { width: layout.totalWidth, height: layout.wrapperHeight },
          ]}
        >
          {/* DEBUG: Cột trái */}
          {/* <View
            style={[
              styles.debugColumn,
              {
                left: layout.leftColumnX,
                width: layout.sideColumnWidth,
                height: layout.wrapperHeight,
                backgroundColor: 'rgba(255, 0, 0, 0.1)', // Đỏ nhạt
              },
            ]}
          /> */}

          {/* DEBUG: Cột giữa */}
          {/* <View
            style={[
              styles.debugColumn,
              {
                left: layout.middleColumnX,
                width: layout.middleColumnWidth,
                height: layout.wrapperHeight,
                backgroundColor: 'rgba(0, 255, 0, 0.1)', // Xanh lá nhạt
              },
            ]}
          /> */}

          {/* DEBUG: Cột phải */}
          {/* <View
            style={[
              styles.debugColumn,
              {
                left: layout.rightColumnX,
                width: layout.sideColumnWidth,
                height: layout.wrapperHeight,
                backgroundColor: 'rgba(0, 0, 255, 0.1)', // Xanh dương nhạt
              },
            ]}
          /> */}

          {/* Pie Chart - ở giữa */}
          <View
            style={[
              styles.pieLayer,
              {
                left: layout.middleColumnX,
                width: layout.middleColumnWidth,
                height: layout.wrapperHeight,
              },
            ]}
          >
            <PieChart
              data={pieData}
              donut
              radius={layout.pieRadius}
              innerRadius={layout.pieInnerRadius}
              showValuesAsLabels={false}
              centerLabelComponent={centerLabelComponent}
              focusOnPress
              toggleFocusOnPress
              sectionAutoFocus
              innerCircleColor={backgroundColor}
            />
          </View>

          {/* Lines + Dots */}
          <Svg
            width={layout.totalWidth}
            height={layout.wrapperHeight}
            style={styles.overlay}
            pointerEvents="none"
          >
            {labelInfos.map((p) => {
              const item = safeData[p.index];
              return (
                <React.Fragment key={`line-${p.index}`}>
                  <Line
                    x1={p.x1}
                    y1={p.y1}
                    x2={p.x2}
                    y2={p.y2}
                    stroke={item.color}
                    strokeWidth={1.5}
                  />
                  <Line
                    x1={p.x2}
                    y1={p.y2}
                    x2={p.x4}
                    y2={p.y4}
                    stroke={item.color}
                    strokeWidth={1.5}
                  />
                  <Circle cx={p.x1} cy={p.y1} r={2.5} fill={item.color} />
                  <Circle cx={p.x4} cy={p.y4} r={2.5} fill={item.color} />
                </React.Fragment>
              );
            })}
          </Svg>

          {/* Labels */}
          <View style={styles.labelsLayer} pointerEvents="none">
            {labelInfos.map((p) => {
              const item = safeData[p.index];
              const isRight = p.side === "right";

              const labelLeft = isRight
                ? layout.rightColumnX
                : layout.leftColumnX;
              const labelTop = p.labelY - normalize(18);

              return (
                <View
                  key={`label-${p.index}`}
                  style={[
                    styles.labelBox,
                    {
                      width: layout.sideColumnWidth,
                      left: labelLeft,
                      top: labelTop,
                      paddingHorizontal: normalize(10),
                      alignItems: "center",
                    },
                  ]}
                >
                  <CustomText
                    type="medium"
                    size={11}
                    style={styles.labelName}
                    numberOfLines={2}
                  >
                    {item.name}
                  </CustomText>
                  <CustomText
                    type="bold"
                    size={12}
                    style={[styles.labelValue, { color: item.color }]}
                  >
                    {formatValue(p.index)}
                  </CustomText>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartCard: {
    padding: normalize(16),
    borderRadius: normalize(12),
    marginBottom: normalize(16),
  },
  chartTitle: {
    textAlign: "center",
    marginBottom: normalize(12),
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  wrapper: {
    position: "relative",
  },
  debugColumn: {
    position: "absolute",
    top: 0,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.2)",
  },
  pieLayer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  labelsLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  labelBox: {
    position: "absolute",
    gap: 0,
  },
  labelName: {
    flexWrap: "wrap",
  },
  labelValue: {
    marginTop: normalize(-2),
  },
  centerLabel: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: normalize(8),
  },
  centerName: {
    textAlign: "center",
    marginBottom: normalize(4),
  },
  centerValue: {
    textAlign: "center",
  },
});

export default PieChartWithLabels;
