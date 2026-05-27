import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import StorageKey from "@/constants/StorageKey";
import { useNotification } from "@/contexts/NotificationContext";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import { useCategory } from "@/hooks/useCategory";
import { invoiceRepository } from "@/services/repositories/invoice.repository";
import StorageService from "@/services/StorageService";
import TransactionEventEmitter from "@/services/TransactionEventEmitter";
import { hp, normalize } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
import { createStyles } from "../styles/InvoiceListScreen.styles";

// Types

interface RecurringInfo {
  type: string;
  count: number | null;
  is_forever: boolean;
  selected_days: number[] | null;
}

interface BillItem {
  bill_id: number;
  user_code: string;
  wallet_id: number;
  account_number?: string;
  bill_name: string;
  category_id: number;
  business_type: string | null;
  schedule_type?: string | null;
  recurring: RecurringInfo;
  amount: number;
  currency_code: string;
  due_at_utc: string;
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

// Screen

export default function InvoiceListScreen() {
  const { colors } = useAppTheme();
  const { t, i18n } = useTranslation();
  const { showNotification, showNotificationAPI } = useNotification();
  const { wallets, defaultWallet } = useWallet();

  // Localized configs

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
    return r.is_forever ? base : t("invoice.rec_count", { base, count: r.count ?? 0 });
  }, [t, RECURRING_LABELS]);

  const [tab, setTab] = useState<TabType>("unpaid");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bills, setBills] = useState<BillItem[]>([]);

  // Pay modal
  const [payBill, setPayBill] = useState<BillItem | null>(null);
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

  // Fetch

  const load = useCallback(async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      const userCode = await StorageService.getItem(StorageKey.userCode);
      const res = await invoiceRepository.advancedSearchInvoice({
        user_code: userCode, wallet_id: 0,
        business_type: null, schedule_type: null, status: ["Pending", "Paid", "Due"],
        from_due_at_utc: null, to_due_at_utc: null,
        page_index: 0, page_size: 50,
      });
      if (res?.success && res?.data?.items) {
        console.log("[InvoiceListScreen] Setting bills:", res.data.items.length);
        setBills(res.data.items as BillItem[]);
      } else {
        console.warn("[InvoiceListScreen] No items in response or success=false", res);
      }
    } catch (e) {
      console.error("[InvoiceListScreen] load:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Derived

  const unpaid = useMemo(() => {
    const list = bills.filter(isPayable);
    console.log("[InvoiceListScreen] Unpaid count:", list.length);
    return list;
  }, [bills]);

  const paid = useMemo(() => {
    const list = bills.filter((b) => !isPayable(b));
    console.log("[InvoiceListScreen] Paid count:", list.length);
    return list;
  }, [bills]);

  const displayed = useMemo(() => {
    const list = tab === "unpaid" ? unpaid : paid;
    console.log("[InvoiceListScreen] Displayed count for tab", tab, ":", list.length);
    return list;
  }, [tab, unpaid, paid]);

  // Pay flow

  const openPay = useCallback(
    (b: BillItem) => {
      setPayBill(b);
    },
    [],
  );

  const closePay = useCallback(() => { setPayBill(null); }, []);

  const confirmPay = useCallback(async () => {
    if (!payBill || paying) return;
    setPaying(true);
    try {
      const targetWallet = wallets.find(w => w.walletId === payBill.wallet_id);
      const expenseAccount =
        targetWallet?.accounts?.find((a) => a.accountType === "02") ??
        targetWallet?.accounts?.find((a) => a.isPrimary) ??
        targetWallet?.accounts?.[0];

      const res = await invoiceRepository.payBill({
        id: payBill.bill_id,
        wallet_id: payBill.wallet_id,
        account_number: payBill.account_number || expenseAccount?.accountNumber || "",
        paid_at_utc: new Date().toISOString(),
      });
      setPayBill(null);
      showNotificationAPI(res);
      if (res?.success) {
        TransactionEventEmitter.emitTransactionChanged();
        load(true);
      }
    } catch {
      showNotification(t("invoice.payment_failed"), "error");
    } finally {
      setPaying(false);
    }
  }, [payBill, paying, wallets, showNotification, showNotificationAPI, load, t]);

  // Card

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
                style={styles.payBtn}
                onPress={() => openPay(bill)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={colors.gradianBase}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: normalize(8) }]}
                />
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

  // Pay Modal

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

          {/* Wallet Info (Read-only) */}
          <CustomText style={[styles.sectionLabel, { color: colors.icon }]}>
            {t("invoice.pay_from_wallet")}
          </CustomText>
          {(() => {
            const w = wallets.find(wal => wal.walletId === payBill.wallet_id);
            if (!w) return null;
            return (
              <View
                style={[
                  styles.walletChip,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    opacity: 0.8,
                  },
                ]}
              >
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
                      { color: colors.text },
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
              </View>
            );
          })()}

          {/* Confirm */}
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              paying && { opacity: 0.55 },
            ]}
            onPress={confirmPay}
            disabled={paying}
            activeOpacity={0.8}
          >
            {!paying && (
              <LinearGradient
                colors={colors.gradianBase}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, { borderRadius: normalize(16) }]}
              />
            )}
            {paying ? (
              <ActivityIndicator color={colors.tint} />
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

  // Main render

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
            { key: "paid", label: t("invoice.paid"), count: paid.length },
          ] as { key: TabType; label: string; count: number }[]
        ).map(({ key, label, count }) => {
          const active = tab === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tab]}
              onPress={() => setTab(key)}
            >
              {active && (
                <LinearGradient
                  colors={colors.gradianBase}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: normalize(12) }]}
                />
              )}
              <CustomText
                style={[styles.tabText, active && styles.tabTextActive]}
              >
                {label}
              </CustomText>
              {count > 0 && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: active ? "#fff" : colors.tint },
                  ]}
                >
                  <CustomText style={[styles.badgeText, active && { color: colors.tint }]}>{count}</CustomText>
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
          style={styles.fab}
          onPress={() => router.push("/(protected)/invoice/create-invoice")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={colors.gradianBase}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: normalize(16) }]}
          />
          <FontAwesome6 name="plus" size={normalize(15)} color="#fff" />
          <CustomText style={styles.fabText}>{t("invoice.create_invoice")}</CustomText>
        </TouchableOpacity>
      </View>

      {/* Pay modal */}
      {renderPayModal()}
    </SafeAreaView>
  );
}

