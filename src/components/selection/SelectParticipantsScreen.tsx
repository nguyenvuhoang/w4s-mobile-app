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
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Participant {
  id: string;
  name: string;
  phoneNumber?: string;
  avatarColor?: string;
}

const SelectParticipantsScreen = () => {
  const { colors } = useAppTheme();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const [contacts, setContacts] = useState<Participant[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Participant[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<
    Participant[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

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
    loadSavedParticipants();
  }, []);

  const loadSavedParticipants = async () => {
    try {
      // Load participants đã chọn trước đó (nếu có)
      const storedParticipants = await StorageService.getAsyncItem(
        STORAGE_KEY.TEMP_PARTICIPANTS_STORAGE
      );
      if (storedParticipants) {
        const data = JSON.parse(storedParticipants);
        // Chỉ load nếu cùng session
        if (data.sessionId === sessionId) {
          setSelectedParticipants(data.participants);
          console.log(
            "[SelectParticipants] Loaded saved participants:",
            data.participants.length
          );
        } else {
          console.log("[SelectParticipants] Different session, starting fresh");
        }
      }
    } catch (error) {
      console.error("Error loading saved participants:", error);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phoneNumber?.includes(searchQuery)
      );
      setFilteredContacts(filtered);
    }
  }, [searchQuery, contacts]);

  const loadContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();

      if (status !== "granted") {
        alert("Cần quyền truy cập danh bạ để chọn người tham gia!");
        setLoading(false);
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });

      if (data.length > 0) {
        const formattedContacts: Participant[] = data
          .filter((contact) => contact.name) // Chỉ lấy contact có tên
          .map((contact, index) => ({
            id: contact.id || `contact-${index}`,
            name: contact.name || "Không tên",
            phoneNumber: contact.phoneNumbers?.[0]?.number,
            avatarColor: avatarColors[index % avatarColors.length],
          }))
          .sort((a, b) => a.name.localeCompare(b.name)); // Sắp xếp theo tên

        setContacts(formattedContacts);
        setFilteredContacts(formattedContacts);
      }
    } catch (error) {
      console.error("Error loading contacts:", error);
      alert("Không thể tải danh bạ!");
    } finally {
      setLoading(false);
    }
  };

  const toggleParticipant = (participant: Participant) => {
    const isSelected = selectedParticipants.some(
      (p) => p.id === participant.id
    );

    if (isSelected) {
      setSelectedParticipants(
        selectedParticipants.filter((p) => p.id !== participant.id)
      );
    } else {
      setSelectedParticipants([...selectedParticipants, participant]);
    }
  };

  const handleConfirm = async () => {
    try {
      // Lưu vào storage với session ID
      await StorageService.setAsyncItem(
        STORAGE_KEY.TEMP_PARTICIPANTS_STORAGE,
        JSON.stringify({
          sessionId,
          participants: selectedParticipants,
        })
      );
      router.back();
    } catch (error) {
      console.error("Error saving participants:", error);
      alert("Lỗi khi lưu người tham gia!");
    }
  };

  const handleCancel = () => {
    // Không xóa storage khi cancel, giữ nguyên data cũ
    router.back();
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
            <CustomText style={[styles.contactName, { color: colors.text }]}>
              {item.name}
            </CustomText>
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

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <AppHeader title="Chọn người tham gia" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <CustomText style={[styles.loadingText, { color: colors.text }]}>
            Đang tải danh bạ...
          </CustomText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title="Chọn người tham gia" />

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
            placeholder="Tìm kiếm theo tên hoặc số điện thoại"
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

      {/* Selected Count */}
      {selectedParticipants.length > 0 && (
        <View style={styles.selectedContainer}>
          <CustomText style={[styles.selectedText, { color: colors.tint }]}>
            Đã chọn {selectedParticipants.length} người
          </CustomText>
        </View>
      )}

      {/* Contacts List */}
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContact}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome6
              name="address-book"
              size={normalize(48)}
              color={colors.icon}
            />
            <CustomText style={[styles.emptyText, { color: colors.icon }]}>
              {searchQuery ? "Không tìm thấy kết quả" : "Danh bạ trống"}
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
            Hủy
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
            Xác nhận ({selectedParticipants.length})
          </CustomText>
        </TouchableOpacity>
      </View>
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
  contactName: {
    fontSize: normalize(15),
    fontFamily: Fonts.medium,
    marginBottom: normalize(2),
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
});

export default SelectParticipantsScreen;
