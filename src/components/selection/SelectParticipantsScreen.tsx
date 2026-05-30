import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import STORAGE_KEY from "@/constants/StorageKey";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import StorageService from "@/services/StorageService";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

interface Participant {
  id: string;
  name: string;
  phoneNumber?: string;
  avatarColor?: string;
  // Cho data từ server
  display_name?: string;
  phone?: string;
  avatar_url?: string;
  counterparty_type?: number;
  is_favorite?: boolean;
  isFromServer?: boolean; // Flag để phân biệt nguồn data
}

type TabType = "recent" | "contacts";

const SelectParticipantsScreen = () => {
  const { colors } = useAppTheme();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabType>("recent");
  const [contacts, setContacts] = useState<Participant[]>([]);
  const [recentParticipants, setRecentParticipants] = useState<Participant[]>(
    [],
  );
  const [filteredContacts, setFilteredContacts] = useState<Participant[]>([]);
  const [filteredRecents, setFilteredRecents] = useState<Participant[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<
    Participant[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingRecents, setLoadingRecents] = useState(true);

  const [customParticipants, setCustomParticipants] = useState<Participant[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState("");
  const [newParticipantPhone, setNewParticipantPhone] = useState("");

  const avatarColors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#F7DC6F",
  ];

  useEffect(() => {
    loadContacts();
    loadRecentParticipants();
    loadSavedParticipants();
  }, []);

  const loadSavedParticipants = async () => {
    try {
      const storedParticipants = await StorageService.getItem(
        STORAGE_KEY.TEMP_PARTICIPANTS_STORAGE,
      );
      if (storedParticipants) {
        const data = JSON.parse(storedParticipants);
        if (data.sessionId === sessionId) {
          const loaded = data.participants || [];
          setSelectedParticipants(loaded);
          const customs = loaded.filter((p: Participant) => p.id && String(p.id).startsWith("custom-"));
          setCustomParticipants(customs);
          console.log(
            "[SelectParticipants] Loaded saved participants:",
            loaded.length,
            "Customs:",
            customs.length,
          );
        }
      }
    } catch (error) {
      console.error("Error loading saved participants:", error);
    }
  };

  // Load danh sách gần đây từ server
  const loadRecentParticipants = async () => {
    try {
      setLoadingRecents(true);
      // TODO: Call API để lấy danh sách gần đây
      // const response = await ApiService.getRecentParticipants();

      // Mock data tạm thời
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockRecentData: Participant[] = [
        {
          id: "1",
          display_name: "Anh Nam",
          phone: "0909123456",
          avatar_url: "",
          counterparty_type: 1,
          is_favorite: true,
          isFromServer: true,
          name: "Anh Nam",
          phoneNumber: "0909123456",
          avatarColor: avatarColors[0],
        },
        {
          id: "2",
          display_name: "Chị Hương",
          phone: "0912345678",
          avatar_url: "",
          counterparty_type: 1,
          is_favorite: false,
          isFromServer: true,
          name: "Chị Hương",
          phoneNumber: "0912345678",
          avatarColor: avatarColors[1],
        },
        {
          id: "3",
          display_name: "Anh Tuấn",
          phone: "0987654321",
          avatar_url: "",
          counterparty_type: 1,
          is_favorite: true,
          isFromServer: true,
          name: "Anh Tuấn",
          phoneNumber: "0987654321",
          avatarColor: avatarColors[2],
        },
      ];

      setRecentParticipants(mockRecentData);
      setFilteredRecents(mockRecentData);
    } catch (error) {
      console.error("Error loading recent participants:", error);
    } finally {
      setLoadingRecents(false);
    }
  };

  useEffect(() => {
    const combinedContacts = [...customParticipants, ...contacts];
    if (searchQuery.trim() === "") {
      setFilteredContacts(combinedContacts);
      setFilteredRecents(recentParticipants);
    } else {
      const filteredC = combinedContacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phoneNumber?.includes(searchQuery),
      );
      setFilteredContacts(filteredC);

      const filteredR = recentParticipants.filter(
        (participant) =>
          participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          participant.phoneNumber?.includes(searchQuery),
      );
      setFilteredRecents(filteredR);
    }
  }, [searchQuery, contacts, recentParticipants, customParticipants]);

  const loadContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();

      if (status !== "granted") {
        alert(t("selection.contacts_permission_error", { defaultValue: "Cần quyền truy cập danh bạ để chọn người tham gia!" }));
        setLoading(false);
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });

      if (data.length > 0) {
        const formattedContacts: Participant[] = data
          .filter((contact) => contact.name)
          .map((contact, index) => ({
            id: contact.id || `contact-${index}`,
            name: contact.name || t("selection.no_name", { defaultValue: "Không tên" }),
            phoneNumber: contact.phoneNumbers?.[0]?.number,
            avatarColor: avatarColors[index % avatarColors.length],
            isFromServer: false,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setContacts(formattedContacts);
        setFilteredContacts(formattedContacts);
      }
    } catch (error) {
      console.error("Error loading contacts:", error);
      alert(t("selection.contacts_load_error", { defaultValue: "Không thể tải danh bạ!" }));
    } finally {
      setLoading(false);
    }
  };

  const toggleParticipant = (participant: Participant) => {
    const isSelected = selectedParticipants.some(
      (p) => p.id === participant.id,
    );

    if (isSelected) {
      setSelectedParticipants(
        selectedParticipants.filter((p) => p.id !== participant.id),
      );
    } else {
      setSelectedParticipants([...selectedParticipants, participant]);
    }
  };

  const handleSaveCustomParticipant = () => {
    if (!newParticipantName.trim()) {
      alert(t("selection.name_required_alert", { defaultValue: "Vui lòng nhập tên người tham gia" }));
      return;
    }

    const newId = `custom-${Date.now()}`;
    const newP: Participant = {
      id: newId,
      name: newParticipantName.trim(),
      phoneNumber: newParticipantPhone.trim() || undefined,
      avatarColor: avatarColors[Math.floor(Math.random() * avatarColors.length)],
      isFromServer: false,
    };

    setCustomParticipants((prev) => [newP, ...prev]);
    setSelectedParticipants((prev) => [...prev, newP]);
    setNewParticipantName("");
    setNewParticipantPhone("");
    setShowAddModal(false);
    setSearchQuery("");
  };

  const handleConfirm = async () => {
    try {
      // Chuẩn bị data để gửi lên server
      const dataToSend = selectedParticipants.map((participant) => {
        if (participant.isFromServer) {
          // Từ tab "Gần đây" - truyền ID
          return {
            id: participant.id,
            display_name: participant.display_name || participant.name,
            phone: participant.phone || participant.phoneNumber,
            avatar_url: participant.avatar_url || "",
            counterparty_type: participant.counterparty_type || 1,
            is_favorite: participant.is_favorite || false,
          };
        } else {
          // Từ tab "Danh bạ" - không truyền ID (server tự hiểu là data mới)
          return {
            display_name: participant.name,
            phone: participant.phoneNumber || "",
            avatar_url: "",
            counterparty_type: 1,
            is_favorite: false,
          };
        }
      });

      console.log("Data to send to server:", dataToSend);

      // TODO: Gọi API để lưu
      // await ApiService.saveParticipants(dataToSend);

      // Lưu vào storage với session ID
      await StorageService.setItem(
        STORAGE_KEY.TEMP_PARTICIPANTS_STORAGE,
        JSON.stringify({
          sessionId,
          participants: selectedParticipants,
        }),
      );

      router.back();
    } catch (error) {
      console.error("Error saving participants:", error);
      alert(t("selection.save_error", { defaultValue: "Lỗi khi lưu người tham gia!" }));
    }
  };

  const getInitials = (name: string) => {
    const words = name.trim().split(" ");
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const renderContact = ({ item }: { item: Participant }) => {
    const isSelected = selectedParticipants.some((p) => p.id === item.id);

    return (
      <TouchableOpacity
        style={[
          styles.contactItem,
          {
            backgroundColor: colors.card,
            borderColor: isSelected ? colors.tint : colors.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => toggleParticipant(item)}
      >
        <View style={styles.contactLeft}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: item.avatarColor || avatarColors[0] },
            ]}
          >
            <CustomText style={styles.avatarText}>
              {getInitials(item.name)}
            </CustomText>
          </View>
          <View style={styles.contactInfo}>
            <View style={styles.nameRow}>
              <CustomText style={[styles.contactName, { color: colors.text }]}>
                {item.name}
              </CustomText>
              {item.is_favorite && (
                <FontAwesome6
                  name="star"
                  size={normalize(12)}
                  color="#FFD700"
                  solid
                />
              )}
            </View>
            {item.phoneNumber && (
              <CustomText style={[styles.contactPhone, { color: colors.icon }]}>
                {item.phoneNumber}
              </CustomText>
            )}
          </View>
        </View>

        {isSelected && (
          <FontAwesome6
            name="circle-check"
            size={normalize(20)}
            color={colors.tint}
            solid
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderTabButton = (tab: TabType, label: string) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab && [
          styles.activeTab,
          { borderBottomColor: colors.tint },
        ],
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <CustomText
        style={[
          styles.tabText,
          {
            color: activeTab === tab ? colors.tint : colors.icon,
            fontFamily: activeTab === tab ? Fonts.semiBold : Fonts.regular,
          },
        ]}
      >
        {label}
      </CustomText>
    </TouchableOpacity>
  );

  if (loading || loadingRecents) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <AppHeader title={t("transaction.select_participants", { defaultValue: "Chọn người tham gia" })} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <CustomText style={[styles.loadingText, { color: colors.text }]}>
            {t("home.loading_data", { defaultValue: "Đang tải dữ liệu..." })}
          </CustomText>
        </View>
      </SafeAreaView>
    );
  }

  const currentData =
    activeTab === "recent" ? filteredRecents : filteredContacts;

  const renderHeader = () => {
    const hasQuery = searchQuery.trim().length > 0;
    return (
      <TouchableOpacity
        style={[
          styles.addNewItem,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
        onPress={() => {
          setNewParticipantName(searchQuery);
          setNewParticipantPhone("");
          setShowAddModal(true);
        }}
      >
        <View style={styles.addNewLeft}>
          <View style={[styles.addNewAvatar, { backgroundColor: colors.tint }]}>
            <FontAwesome6 name="user-plus" size={normalize(16)} color="#fff" />
          </View>
          <View style={styles.addNewInfo}>
            <CustomText style={[styles.addNewTitle, { color: colors.text }]}>
              {hasQuery ? t("selection.add_new_query", { name: searchQuery, defaultValue: `Thêm mới: "${searchQuery}"` }) : t("selection.add_new_participant", { defaultValue: "Thêm người tham gia mới" })}
            </CustomText>
            <CustomText style={[styles.addNewSubtitle, { color: colors.icon }]}>
              {hasQuery ? t("selection.click_to_create", { defaultValue: "Nhấn để tạo người tham gia này" }) : t("selection.add_outside_contacts", { defaultValue: "Thêm người ngoài danh bạ" })}
            </CustomText>
          </View>
        </View>
        <FontAwesome6 name="chevron-right" size={normalize(14)} color={colors.icon} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title={t("transaction.select_participants", { defaultValue: "Chọn người tham gia" })} />

      {/* Tabs */}
      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        {renderTabButton("recent", t("selection.recent", { defaultValue: "Gần đây" }))}
        {renderTabButton("contacts", t("selection.contacts", { defaultValue: "Danh bạ" }))}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <FontAwesome6
            name="magnifying-glass"
            size={normalize(16)}
            color={colors.icon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t("selection.search_placeholder", { defaultValue: "Tìm kiếm theo tên hoặc số điện thoại" })}
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <FontAwesome6
                name="xmark"
                size={normalize(16)}
                color={colors.icon}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Selected Count & Chips */}
      {selectedParticipants.length > 0 && (
        <View style={styles.selectedContainer}>
          <View style={styles.selectedHeader}>
            <CustomText style={[styles.selectedText, { color: colors.tint }]}>
              {t("selection.selected_count", { count: selectedParticipants.length, defaultValue: `Đã chọn ${selectedParticipants.length} người` })}
            </CustomText>
            <TouchableOpacity onPress={() => setSelectedParticipants([])}>
              <CustomText style={[styles.clearAllText, { color: colors.icon }]}>
                {t("selection.clear_all", { defaultValue: "Xóa tất cả" })}
              </CustomText>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedChipsScroll}
            style={styles.selectedChipsContainer}
          >
            {selectedParticipants.map((participant) => (
              <TouchableOpacity
                key={participant.id}
                style={[
                  styles.selectedChip,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.tint,
                  },
                ]}
                onPress={() => toggleParticipant(participant)}
              >
                <View
                  style={[
                    styles.chipAvatar,
                    { backgroundColor: participant.avatarColor || avatarColors[0] },
                  ]}
                >
                  <CustomText style={styles.chipAvatarText}>
                    {getInitials(participant.name)}
                  </CustomText>
                </View>
                <CustomText style={[styles.chipName, { color: colors.text }]} numberOfLines={1}>
                  {participant.name}
                </CustomText>
                <FontAwesome6
                  name="circle-xmark"
                  size={normalize(14)}
                  color={colors.icon}
                  solid
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* List */}
      <FlatList
        data={currentData}
        keyExtractor={(item) => item.id}
        renderItem={renderContact}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome6
              name={
                activeTab === "recent" ? "clock-rotate-left" : "address-book"
              }
              size={normalize(48)}
              color={colors.icon}
            />
            <CustomText style={[styles.emptyText, { color: colors.icon }]}>
              {searchQuery
                ? t("selection.no_results", { defaultValue: "Không tìm thấy kết quả" })
                : activeTab === "recent"
                  ? t("selection.empty_recent", { defaultValue: "Chưa có người tham gia gần đây" })
                  : t("selection.empty_contacts", { defaultValue: "Danh bạ trống" })}
            </CustomText>
          </View>
        }
      />

      {/* Bottom Buttons */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: colors.tint }]}
          onPress={() => router.back()}
        >
          <CustomText style={[styles.cancelText, { color: colors.tint }]}>
            {t("selection.cancel", { defaultValue: "Hủy" })}
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.confirmBtn,
            {
              backgroundColor:
                selectedParticipants.length > 0 ? colors.tint : colors.border,
            },
          ]}
          onPress={handleConfirm}
          disabled={selectedParticipants.length === 0}
        >
          <CustomText style={styles.confirmText}>
            {t("selection.confirm_with_count", { count: selectedParticipants.length, defaultValue: `Xác nhận (${selectedParticipants.length})` })}
          </CustomText>
        </TouchableOpacity>
      </View>

      {/* Add Custom Participant Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setShowAddModal(false)}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.background,
                paddingBottom: Math.max(insets.bottom, hp(3)),
              },
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <CustomText style={[styles.modalTitle, { color: colors.text }]}>
                {t("selection.add_new_participant", { defaultValue: "Thêm người tham gia mới" })}
              </CustomText>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <FontAwesome6 name="xmark" size={normalize(20)} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <CustomText style={[styles.inputLabel, { color: colors.text }]}>
                  {t("selection.participant_name_required", { defaultValue: "Tên người tham gia *" })}
                </CustomText>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder={t("selection.enter_participant_name", { defaultValue: "Nhập tên người tham gia" })}
                  placeholderTextColor={colors.icon}
                  value={newParticipantName}
                  onChangeText={setNewParticipantName}
                  autoFocus
                />
              </View>

              <View style={styles.inputGroup}>
                <CustomText style={[styles.inputLabel, { color: colors.text }]}>
                  {t("selection.phone_optional", { defaultValue: "Số điện thoại (Không bắt buộc)" })}
                </CustomText>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder={t("selection.enter_phone", { defaultValue: "Nhập số điện thoại" })}
                  placeholderTextColor={colors.icon}
                  value={newParticipantPhone}
                  onChangeText={setNewParticipantPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowAddModal(false)}
              >
                <CustomText style={[styles.modalCancelText, { color: colors.text }]}>
                  {t("selection.cancel", { defaultValue: "Hủy" })}
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  {
                    backgroundColor: newParticipantName.trim() ? colors.tint : colors.border,
                  },
                ]}
                onPress={handleSaveCustomParticipant}
                disabled={!newParticipantName.trim()}
              >
                <CustomText style={styles.modalConfirmText}>
                  {t("selection.add_btn", { defaultValue: "Thêm" })}
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: normalize(16),
  },
  loadingText: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: normalize(16),
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: normalize(15),
  },
  searchContainer: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(1),
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    borderRadius: normalize(12),
    borderWidth: 1,
    gap: normalize(12),
  },
  searchInput: {
    flex: 1,
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
    padding: 0,
  },
  selectedContainer: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(1),
  },
  selectedText: {
    fontSize: normalize(13),
    fontFamily: Fonts.medium,
  },
  listContainer: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(2),
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    borderRadius: normalize(12),
    marginBottom: normalize(8),
  },
  contactLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(12),
    flex: 1,
  },
  avatar: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: normalize(14),
    fontFamily: Fonts.semiBold,
    color: "#fff",
  },
  contactInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(6),
    marginBottom: normalize(2),
  },
  contactName: {
    fontSize: normalize(15),
    fontFamily: Fonts.medium,
  },
  contactPhone: {
    fontSize: normalize(12),
    fontFamily: Fonts.regular,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(10),
    gap: normalize(16),
  },
  emptyText: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
  },
  bottomBar: {
    flexDirection: "row",
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    gap: normalize(12),
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: "center",
    borderWidth: 2,
  },
  cancelText: {
    fontSize: normalize(16),
    fontFamily: Fonts.semiBold,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: "center",
  },
  confirmText: {
    fontSize: normalize(16),
    fontFamily: Fonts.semiBold,
    color: "#fff",
  },
  addNewItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    borderRadius: normalize(12),
    borderWidth: 1,
    marginBottom: normalize(12),
  },
  addNewLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(12),
    flex: 1,
  },
  addNewAvatar: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    alignItems: "center",
    justifyContent: "center",
  },
  addNewInfo: {
    flex: 1,
  },
  addNewTitle: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
  },
  addNewSubtitle: {
    fontSize: normalize(12),
    fontFamily: Fonts.regular,
  },
  selectedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(1),
  },
  clearAllText: {
    fontSize: normalize(13),
    fontFamily: Fonts.regular,
  },
  selectedChipsContainer: {
    maxHeight: hp(7),
    marginBottom: hp(1),
  },
  selectedChipsScroll: {
    gap: normalize(8),
    paddingRight: wp(5),
  },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: normalize(20),
    paddingVertical: normalize(4),
    paddingLeft: normalize(4),
    paddingRight: normalize(8),
    gap: normalize(6),
  },
  chipAvatar: {
    width: normalize(24),
    height: normalize(24),
    borderRadius: normalize(12),
    alignItems: "center",
    justifyContent: "center",
  },
  chipAvatarText: {
    fontSize: normalize(10),
    fontFamily: Fonts.semiBold,
    color: "#fff",
  },
  chipName: {
    fontSize: normalize(13),
    fontFamily: Fonts.medium,
    maxWidth: wp(25),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalBackground: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalContent: {
    borderTopLeftRadius: normalize(24),
    borderTopRightRadius: normalize(24),
    paddingBottom: hp(4),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: normalize(18),
    fontFamily: Fonts.semiBold,
  },
  modalBody: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2.5),
    gap: hp(2),
  },
  inputGroup: {
    gap: hp(1),
  },
  inputLabel: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
  },
  modalInput: {
    height: hp(6),
    borderRadius: normalize(12),
    borderWidth: 1,
    paddingHorizontal: normalize(16),
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: wp(5),
    gap: normalize(12),
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: "center",
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: normalize(16),
    fontFamily: Fonts.semiBold,
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: "center",
  },
  modalConfirmText: {
    fontSize: normalize(16),
    fontFamily: Fonts.semiBold,
    color: "#fff",
  },
});

export default SelectParticipantsScreen;
