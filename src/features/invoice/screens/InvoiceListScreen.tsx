import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import StorageKey from "@/constants/StorageKey";
import { useNotification } from "@/contexts/NotificationContext";
import { Fonts } from "@/core/theme/font";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import { useCategory } from "@/hooks/useCategory";
import { invoiceRepository } from "@/services/repositories/invoice.repository";
import StorageService from "@/services/StorageService";
import { WalletSummary } from "@/types/wallet";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecurringInfo {
  type: string;
  count: number;
  is_forever: boolean;
  selected_days: number[] | null;
}

interface BillItem {
  bill_id: number;
  wallet_id: number;
  account_number: string;
  bill_name: string;
  category_id: number;
  business_type: string;
  recurring: RecurringInfo;
  amount: number;
  currency_code: string;
  due_at_utc: string;
  /** "Pending" | "Overdue" | "Paid" */
  status: string;
}

type TabType = "unpaid" | "paid";

interface StatusCfg {
  label: string;
  color: string;
  bg: string;
  icon: string;
}

const DEFAULT_ICON = "receipt";
const DEFAULT_COLOR = "#6B7280";

const isPayable = (b: BillItem) =>
  b.status === "Pending" || b.status === "Due";

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function InvoiceListScreen() {
  const { colors } = useAppTheme();
  const { t, i18n } = useTranslation();
  const { showNotification, showNotificationAPI } = useNotification();
  const { wallets, defaultWallet } = useWallet();

  // ─── Localized configs ──────────────────────────────────────────────────

  const RECURRING_LABELS: Record<string, string> = useMemo(() => ({
    Monthly: t("invoice.rec_monthly"),
    Weekly: t("invoice.rec_weekly"),
    Daily: t("invoice.rec_daily"),
    Yearly: t("invoice.rec_yearly"),
    None: t("invoice.rec_none"),
  }), [t]);

  const STATUS_MAP: Record<string, StatusCfg> = useMemo(() => ({
    Pending: { label: t("invoice.status_pending"), color: "#F59E0B", bg: "#FEF3C7", icon: "clock" },
    Due: { label: t("invoice.status_due"), color: "#3B82F6", bg: "#DBEAFE", icon: "bolt" },
    Overdue: { label: t("invoice.status_overdue"), color: "#EF4444", bg: "#FEE2E2", icon: "circle-exclamation" },
    Paid: { label: t("invoice.status_paid"), color: "#10B981", bg: "#D1FAE5", icon: "circle-check" },
  }), [t]);

  const DEFAULT_STATUS: StatusCfg = useMemo(() => STATUS_MAP.Pending, [STATUS_MAP]);

  const parseName = useCallback((s: string) => {
    if (!s) return "";
    if (!s.startsWith("{")) return s;
    try {
      const p = JSON.parse(s);
      return p[i18n.language] || p.vi || p.en || s;
    }
    catch { return s; }
  }, [i18n.language]);

  const fmtDate = useCallback((utc: string) => {
    try {
      return new Date(utc).toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US");
    } catch {
      return utc;
    }
  }, [i18n.language]);

  const recurringLabel = useCallback((r: RecurringInfo) => {
    const base = RECURRING_LABELS[r?.type] ?? r?.type ?? "";
    if (!r || r.type === "None") return base;
    return r.is_forever ? base : t("invoice.rec_count", { base, count: r.count });
  }, [t, RECURRING_LABELS]);

  const [tab, setTab] = useState<TabType>("unpaid");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bills, setBills] = useState<BillItem[]>([]);

  // Pay modal
  const [payBill, setPayBill] = useState<BillItem | null>(null);
  const [selWallet, setSelWallet] = useState<WalletSummary | null>(null);
  const [paying, setPaying] = useState(false);

  const { categories } = useCategory({ autoFetch: true });
  const styles = useMemo(() => createStyles(colors), [colors]);

  const catMap = useMemo(() => {
    const m = new Map<number, { icon: string; color: string; name: string }>();
    categories.forEach((c) =>
      m.set(Number(c.id), {
        icon: c.icon ?? DEFAULT_ICON,
        color: c.color ?? DEFAULT_COLOR,
        name: parseName(c.category_name ?? ""),
      }),
    );
    return m;
  }, [categories, parseName]);

  const fmt = useCallback(
    (n: number) => new Intl.NumberFormat(i18n.language === "vi" ? "vi-VN" : "en-US").format(Math.abs(n)),
    [i18n.language],
  );

  // ── Fetch ────────────────────────────────────────────────────────────────

  const load = useCallback(async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      const userCode = await StorageService.getAsyncItem(StorageKey.userCode);
      const res = await invoiceRepository.advancedSearchInvoice({
        user_code: userCode, wallet_id: 0,
        business_type: null, schedule_type: null, status: null,
        from_due_at_utc: null, to_due_at_utc: null,
        page_index: 0, page_size: 50,
      });
      if (res?.success && res?.data?.items)
        setBills(res.data.items as BillItem[]);
    } catch (e) {
      console.error("[InvoiceListScreen] load:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ── Derived ──────────────────────────────────────────────────────────────

  const unpaid = useMemo(() => bills.filter(isPayable), [bills]);
  const paid = useMemo(() => bills.filter((b) => !isPayable(b)), [bills]);
  const displayed = tab === "unpaid" ? unpaid : paid;

  // ── Pay flow ─────────────────────────────────────────────────────────────

  const openPay = useCallback(
    (b: BillItem) => {
      setPayBill(b);
      setSelWallet(defaultWallet ?? wallets[0] ?? null);
    },
    [defaultWallet, wallets],
  );

  const closePay = useCallback(() => { setPayBill(null); }, []);

  const confirmPay = useCallback(async () => {
    if (!payBill || !selWallet || paying) return;
    setPaying(true);
    try {
      const expenseAccount =
        selWallet.accounts?.find((a) => a.accountType === "02") ??
        selWallet.accounts?.find((a) => a.isPrimary) ??
        selWallet.accounts?.[0];
      const res = await invoiceRepository.payBill({
        id: payBill.bill_id,
        wallet_id: selWallet.walletId,
        account_number: expenseAccount?.accountNumber ?? "",
        paid_at_utc: new Date().toISOString(),
      });
      setPayBill(null);
      showNotificationAPI(res);
      if (res?.success) load(true);
    } catch {
      showNotification(t("invoice.payment_failed"), "error");
    } finally {
      setPaying(false);
    }
  }, [payBill, selWallet, paying, showNotification, showNotificationAPI, load, t]);

  // ── Card ─────────────────────────────────────────────────────────────────

  const renderCard = useCallback(
    (bill: BillItem) => {
      const cat = catMap.get(Number(bill.category_id));
      const icon = cat?.icon ?? DEFAULT_ICON;
      const color = cat?.color ?? DEFAULT_COLOR;
      const title = cat?.name || parseName(bill.bill_name);
      const recLbl = recurringLabel(bill.recurring);
      let status = STATUS_MAP[bill.status] ?? DEFAULT_STATUS;
      if (bill.status === "Due") {
        const isOverdue = new Date() > new Date(bill.due_at_utc);
        if (isOverdue) status = STATUS_MAP.Overdue;
      }
      const payable = isPayable(bill);

      return (
        <TouchableOpacity
          key={bill.bill_id}
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => router.push({
            pathname: "/(protected)/invoice/transaction-history",
            params: { billId: String(bill.bill_id), type: 'bill' },
          })}
        >
          {/* Accent bar */}
          <View style={[styles.accentBar, { backgroundColor: color }]} />

          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: color + "22" }]}>
            <FontAwesome6 name={icon} size={normalize(20)} color={color} solid />
          </View>

          {/* Info */}
          <View style={styles.info}>
            <CustomText style={styles.billTitle} numberOfLines={1}>
              {title}
            </CustomText>

            {/* Recurring */}
            <View style={[styles.chip, { backgroundColor: color + "18" }]}>
              <FontAwesome6 name="repeat" size={normalize(9)} color={color} />
              <CustomText style={[styles.chipText, { color }]}>{recLbl}</CustomText>
            </View>

            {/* Status */}
            <View style={[styles.chip, { backgroundColor: status.bg }]}>
              <FontAwesome6
                name={status.icon}
                size={normalize(9)}
                color={status.color}
                solid
              />
              <CustomText style={[styles.chipText, { color: status.color }]}>
                {status.label}
              </CustomText>
            </View>
          </View>

          {/* Right */}
          <View style={styles.right}>
            {/* Amount */}
            <View style={styles.amountRow}>
              <CustomText style={[styles.amount, { color: "#EF4444" }]}>
                -{fmt(bill.amount)}
              </CustomText>
              <View style={styles.ccyBadge}>
                <CustomText style={styles.ccyText}>{bill.currency_code}</CustomText>
              </View>
            </View>

            {/* Due date */}
            <View style={styles.dateRow}>
              <FontAwesome6 name="calendar" size={normalize(9)} color={colors.icon} />
              <CustomText style={styles.dateText}>{fmtDate(bill.due_at_utc)}</CustomText>
            </View>

            {/* Pay button */}
            {payable && (
              <TouchableOpacity
                style={[styles.payBtn, { backgroundColor: colors.tint }]}
                onPress={() => openPay(bill)}
                activeOpacity={0.8}
              >
                <FontAwesome6 name="bolt" size={normalize(10)} color="#fff" solid />
                <CustomText style={styles.payBtnText}>{t("invoice.pay_now")}</CustomText>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [styles, fmt, catMap, openPay, colors.icon, colors.tint, STATUS_MAP, DEFAULT_STATUS, fmtDate, parseName, recurringLabel, t],
  );

  // ── Pay Modal ────────────────────────────────────────────────────────────

  const renderPayModal = () => {
    if (!payBill) return null;
    const cat = catMap.get(Number(payBill.category_id));
    const color = cat?.color ?? DEFAULT_COLOR;
    const title = cat?.name || parseName(payBill.bill_name);

    return (
      <Modal
        visible
        transparent
        animationType="slide"
        onRequestClose={closePay}
      >
        {/* Dimmed backdrop */}
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => !paying && closePay()}
        />

        {/* Sheet */}
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <CustomText style={[styles.sheetTitle, { color: colors.text }]}>
            {t("invoice.confirm_payment")}
          </CustomText>

          {/* Bill summary card */}
          <View style={[styles.billCard, { backgroundColor: colors.background }]}>
            <View style={[styles.billCardIcon, { backgroundColor: color + "22" }]}>
              <FontAwesome6
                name={cat?.icon ?? DEFAULT_ICON}
                size={normalize(22)}
                color={color}
                solid
              />
            </View>
            <View style={{ flex: 1 }}>
              <CustomText
                style={[styles.billCardTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {title}
              </CustomText>
              <CustomText style={[styles.billCardSub, { color: colors.icon }]}>
                {t("invoice.due_date", { date: fmtDate(payBill.due_at_utc) })}
              </CustomText>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <CustomText style={[styles.billCardAmount, { color: "#EF4444" }]}>
                -{fmt(payBill.amount)}
              </CustomText>
              <CustomText style={[styles.billCardCcy, { color: colors.icon }]}>
                {payBill.currency_code}
              </CustomText>
            </View>
          </View>

          {/* Wallet selector label */}
          <CustomText style={[styles.sectionLabel, { color: colors.icon }]}>
            {t("invoice.pay_from_wallet")}
          </CustomText>

          {/* Wallet list */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.walletRow}
          >
            {wallets.map((w) => {
              const active = selWallet?.walletId === w.walletId;
              return (
                <TouchableOpacity
                  key={w.walletId}
                  style={[
                    styles.walletChip,
                    {
                      borderColor: active ? colors.tint : colors.border,
                      backgroundColor: active ? colors.tint + "18" : colors.background,
                    },
                  ]}
                  onPress={() => setSelWallet(w)}
                  activeOpacity={0.75}
                >
                  {/* Color dot */}
                  <View
                    style={[
                      styles.walletDot,
                      { backgroundColor: w.color ?? colors.tint },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <CustomText
                      style={[
                        styles.walletName,
                        { color: active ? colors.tint : colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {w.name}
                    </CustomText>
                    <CustomText
                      style={[styles.walletBalance, { color: colors.icon }]}
                    >
                      {fmt(w.balance)} {w.currency}
                    </CustomText>
                  </View>
                  {active && (
                    <FontAwesome6
                      name="circle-check"
                      size={normalize(16)}
                      color={colors.tint}
                      solid
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Confirm */}
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              { backgroundColor: colors.tint },
              (!selWallet || paying) && { opacity: 0.55 },
            ]}
            onPress={confirmPay}
            disabled={!selWallet || paying}
            activeOpacity={0.8}
          >
            {paying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <FontAwesome6 name="bolt" size={normalize(14)} color="#fff" solid />
                <CustomText style={styles.confirmText}>{t("invoice.confirm_payment")}</CustomText>
              </>
            )}
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity style={styles.cancelBtn} onPress={closePay}>
            <CustomText style={[styles.cancelText, { color: colors.icon }]}>{t("common.cancel")}</CustomText>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  // ── Main render ──────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <AppHeader
        title={t("invoice.title")}
      />

      {/* Tabs */}
      <View style={styles.tabs}>
        {(
          [
            { key: "unpaid", label: t("invoice.unpaid"), count: unpaid.length },
            { key: "paid", label: t("invoice.paid"), count: 0 },
          ] as { key: TabType; label: string; count: number }[]
        ).map(({ key, label, count }) => {
          const active = tab === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setTab(key)}
            >
              <CustomText
                style={[styles.tabText, active && styles.tabTextActive]}
              >
                {label}
              </CustomText>
              {count > 0 && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: active ? "rgba(255,255,255,0.3)" : colors.tint },
                  ]}
                >
                  <CustomText style={styles.badgeText}>{count}</CustomText>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
          }
        >
          {displayed.length > 0 ? (
            displayed.map(renderCard)
          ) : (
            <View style={styles.empty}>
              <FontAwesome6
                name="file-invoice"
                size={normalize(56)}
                color={colors.icon}
                style={{ opacity: 0.25 }}
              />
              <CustomText style={[styles.emptyText, { color: colors.icon }]}>
                {tab === "unpaid"
                  ? t("invoice.empty_unpaid")
                  : t("invoice.empty_paid")}
              </CustomText>
            </View>
          )}
          <View style={{ height: hp(12) }} />
        </ScrollView>
      )}

      {/* FAB */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.tint }]}
          onPress={() => router.push("/(protected)/invoice/create-invoice")}
          activeOpacity={0.8}
        >
          <FontAwesome6 name="plus" size={normalize(15)} color="#fff" />
          <CustomText style={styles.fabText}>{t("invoice.create_invoice")}</CustomText>
        </TouchableOpacity>
      </View>

      {/* Pay modal */}
      {renderPayModal()}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // Tabs
    tabs: {
      flexDirection: "row",
      paddingHorizontal: wp(4),
      paddingVertical: hp(1),
      gap: wp(3),
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: wp(1.5),
      paddingVertical: hp(1.2),
      borderRadius: normalize(12),
      backgroundColor: colors.card,
    },
    tabActive: { backgroundColor: colors.tint },
    tabText: { fontSize: normalize(13), color: colors.text, fontFamily: Fonts.regular },
    tabTextActive: { color: "#fff", fontFamily: Fonts.semiBold },
    badge: {
      borderRadius: normalize(10),
      paddingHorizontal: wp(1.5),
      minWidth: normalize(18),
      alignItems: "center",
    },
    badgeText: { fontSize: normalize(10), color: "#fff", fontFamily: Fonts.bold },

    // List
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: wp(4), paddingTop: hp(2), gap: hp(1.5), flexGrow: 1 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: hp(15) },
    emptyText: { fontSize: normalize(14), fontFamily: Fonts.regular, marginTop: hp(2), textAlign: "center" },

    // Card
    card: {
      backgroundColor: colors.card,
      borderRadius: normalize(16),
      flexDirection: "row",
      alignItems: "center",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    accentBar: { width: normalize(4), alignSelf: "stretch" },
    iconWrap: {
      width: normalize(44),
      height: normalize(44),
      borderRadius: normalize(12),
      alignItems: "center",
      justifyContent: "center",
      marginLeft: wp(3),
      marginVertical: normalize(14),
    },
    info: {
      flex: 1,
      marginLeft: wp(3),
      paddingVertical: normalize(12),
      gap: hp(0.5),
    },
    billTitle: { fontSize: normalize(14), color: colors.text, fontFamily: Fonts.semiBold },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.3),
      borderRadius: normalize(20),
      gap: wp(1),
    },
    chipText: { fontSize: normalize(10), fontFamily: Fonts.semiBold },
    right: {
      alignItems: "flex-end",
      paddingRight: wp(3),
      paddingVertical: normalize(12),
      gap: hp(0.4),
    },
    amountRow: { flexDirection: "row", alignItems: "center", gap: wp(1.5) },
    amount: { fontSize: normalize(14), fontFamily: Fonts.bold, color: "#EF4444" },
    ccyBadge: { backgroundColor: "#EF444418", paddingHorizontal: wp(1.5), paddingVertical: hp(0.2), borderRadius: normalize(4) },
    ccyText: { fontSize: normalize(10), fontFamily: Fonts.semiBold, color: "#EF4444" },
    dateRow: { flexDirection: "row", alignItems: "center", gap: wp(1) },
    dateText: { fontSize: normalize(10), color: colors.icon, fontFamily: Fonts.regular },
    payBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: wp(1),
      paddingHorizontal: wp(2.5),
      paddingVertical: hp(0.55),
      borderRadius: normalize(8),
      marginTop: hp(0.3),
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    },
    payBtnText: { fontSize: normalize(10), color: "#fff", fontFamily: Fonts.semiBold },

    // Bottom bar
    bottomBar: {
      paddingHorizontal: wp(4),
      paddingVertical: hp(2),
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    fab: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: wp(2),
      paddingVertical: hp(1.8),
      borderRadius: normalize(16),
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    fabText: { fontSize: normalize(16), color: "#fff", fontFamily: Fonts.semiBold },

    // Pay modal
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    sheet: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      borderTopLeftRadius: normalize(24),
      borderTopRightRadius: normalize(24),
      paddingTop: hp(1.5),
      paddingBottom: hp(4),
      paddingHorizontal: wp(5),
    },
    handle: {
      width: normalize(40),
      height: normalize(4),
      borderRadius: normalize(2),
      alignSelf: "center",
      marginBottom: hp(2),
    },
    sheetTitle: {
      fontSize: normalize(17),
      fontFamily: Fonts.bold,
      textAlign: "center",
      marginBottom: hp(2),
    },

    // Bill summary inside modal
    billCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: wp(3),
      borderRadius: normalize(14),
      padding: normalize(14),
      marginBottom: hp(2.5),
    },
    billCardIcon: {
      width: normalize(44),
      height: normalize(44),
      borderRadius: normalize(12),
      alignItems: "center",
      justifyContent: "center",
    },
    billCardTitle: { fontSize: normalize(14), fontFamily: Fonts.semiBold, marginBottom: hp(0.3) },
    billCardSub: { fontSize: normalize(11), fontFamily: Fonts.regular },
    billCardAmount: { fontSize: normalize(16), fontFamily: Fonts.bold },
    billCardCcy: { fontSize: normalize(11), fontFamily: Fonts.regular, marginTop: hp(0.2) },

    sectionLabel: {
      fontSize: normalize(11),
      fontFamily: Fonts.semiBold,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: hp(1),
    },

    // Wallet list
    walletRow: { gap: wp(2.5), paddingVertical: hp(0.5), paddingHorizontal: 2 },
    walletChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: wp(2),
      paddingHorizontal: wp(3.5),
      paddingVertical: hp(1.3),
      borderRadius: normalize(14),
      borderWidth: 1.5,
      minWidth: wp(44),
      marginBottom: hp(2),
    },
    walletDot: { width: normalize(10), height: normalize(10), borderRadius: normalize(5) },
    walletName: { fontSize: normalize(13), fontFamily: Fonts.semiBold },
    walletBalance: { fontSize: normalize(11), fontFamily: Fonts.regular, marginTop: hp(0.2) },

    // Confirm / cancel
    confirmBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: wp(2),
      paddingVertical: hp(1.8),
      borderRadius: normalize(16),
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      marginBottom: hp(0.5),
    },
    confirmText: { fontSize: normalize(16), color: "#fff", fontFamily: Fonts.semiBold },
    cancelBtn: { alignItems: "center", paddingVertical: hp(1.2) },
    cancelText: { fontSize: normalize(15), fontFamily: Fonts.regular },
  });
