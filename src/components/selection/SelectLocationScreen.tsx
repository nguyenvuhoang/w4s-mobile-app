import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import STORAGE_KEY from "@/constants/StorageKey";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import StorageService from "@/services/StorageService";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

const SelectLocationScreen = () => {
  const { colors } = useAppTheme();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const mapRef = useRef<MapView>(null);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LocationData>({
    latitude: 10.8231, // Mặc định là Hồ Chí Minh
    longitude: 106.6297,
  });
  const [markerLocation, setMarkerLocation] = useState<LocationData>({
    latitude: 10.8231,
    longitude: 106.6297,
  });

  useEffect(() => {
    getCurrentLocation();
    loadSavedLocation();
  }, []);

  const loadSavedLocation = async () => {
    try {
      // Load location đã chọn trước đó (nếu có)
      const storedLocation = await StorageService.getAsyncItem(
        STORAGE_KEY.TEMP_LOCATION_STORAGE
      );
      if (storedLocation) {
        const data = JSON.parse(storedLocation);
        // Chỉ load nếu cùng session
        if (data.sessionId === sessionId) {
          const locationData = data.locationData;
          const location = {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
          };
          setSelectedLocation(location);
          setMarkerLocation(location);
          setSearchQuery(locationData.address || locationData.name || "");

          // Animate map to saved location
          if (mapRef.current) {
            setTimeout(() => {
              mapRef.current?.animateToRegion({
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              });
            }, 500);
          }

          console.log(
            "[SelectLocation] Loaded saved location:",
            locationData.address
          );
        } else {
          console.log("[SelectLocation] Different session, starting fresh");
        }
      }
    } catch (error) {
      console.error("Error loading saved location:", error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setSelectedLocation(newLocation);
      setMarkerLocation(newLocation);

      // Lấy địa chỉ từ tọa độ
      const addresses = await Location.reverseGeocodeAsync(newLocation);
      if (addresses.length > 0) {
        const address = addresses[0];
        const fullAddress = [
          address.name,
          address.street,
          address.district,
          address.city,
          address.country,
        ]
          .filter(Boolean)
          .join(", ");

        setSearchQuery(fullAddress);
      }
    } catch (error) {
      console.error("Error getting location:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const results = await Location.geocodeAsync(searchQuery);

      if (results.length > 0) {
        const location = results[0];
        const newLocation = {
          latitude: location.latitude,
          longitude: location.longitude,
          address: searchQuery,
        };

        setMarkerLocation(newLocation);
        setSelectedLocation(newLocation);

        // Animate map to new location
        mapRef.current?.animateToRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } else {
        alert("Không tìm thấy địa điểm!");
      }
    } catch (error) {
      console.error("Error searching location:", error);
      alert("Lỗi khi tìm kiếm địa điểm!");
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = async (event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    setMarkerLocation(coordinate);

    try {
      // Lấy địa chỉ từ tọa độ
      const addresses = await Location.reverseGeocodeAsync(coordinate);
      if (addresses.length > 0) {
        const address = addresses[0];
        const fullAddress = [
          address.name,
          address.street,
          address.district,
          address.city,
        ]
          .filter(Boolean)
          .join(", ");

        setSearchQuery(fullAddress);
        setSelectedLocation({
          ...coordinate,
          address: fullAddress,
        });
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
    }
  };

  const handleConfirm = async () => {
    try {
      const locationData = {
        ...selectedLocation,
        address: searchQuery || selectedLocation.address,
        name: searchQuery || selectedLocation.address,
      };

      // Lưu vào storage với session ID
      await StorageService.setAsyncItem(
        STORAGE_KEY.TEMP_LOCATION_STORAGE,
        JSON.stringify({
          sessionId,
          locationData,
        })
      );
      router.back();
    } catch (error) {
      console.error("Error saving location:", error);
      alert("Lỗi khi lưu địa điểm!");
    }
  };

  const handleCancel = () => {
    // Không xóa storage khi cancel, giữ nguyên data cũ
    router.back();
  };

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    await getCurrentLocation();

    if (mapRef.current && selectedLocation) {
      mapRef.current.animateToRegion({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title="Chọn địa điểm" />

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
            placeholder="Tìm kiếm địa điểm"
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
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
        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: colors.tint }]}
          onPress={handleSearch}
        >
          <FontAwesome6
            name="magnifying-glass"
            size={normalize(16)}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <CustomText style={[styles.loadingText, { color: colors.text }]}>
              Đang tải bản đồ...
            </CustomText>
          </View>
        ) : (
          <>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              onPress={handleMapPress}
              showsUserLocation
              showsMyLocationButton={false}
            >
              <Marker coordinate={markerLocation} />
            </MapView>

            {/* Current Location Button */}
            <TouchableOpacity
              style={[
                styles.currentLocationBtn,
                { backgroundColor: colors.card, shadowColor: colors.text },
              ]}
              onPress={handleUseCurrentLocation}
            >
              <FontAwesome6
                name="location-crosshairs"
                size={normalize(20)}
                color={colors.tint}
                solid
              />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Bottom Info */}
      <View
        style={[
          styles.bottomInfo,
          { backgroundColor: colors.card, borderTopColor: colors.border },
        ]}
      >
        <View style={styles.infoContent}>
          <FontAwesome6
            name="location-dot"
            size={normalize(20)}
            color={colors.tint}
          />
          <View style={styles.addressContainer}>
            <CustomText style={[styles.addressLabel, { color: colors.icon }]}>
              Địa điểm đã chọn
            </CustomText>
            <CustomText style={[styles.addressText, { color: colors.text }]}>
              {searchQuery || "Nhấn vào bản đồ để chọn"}
            </CustomText>
          </View>
        </View>

        {/* Bottom Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: colors.tint }]}
            onPress={handleCancel}
          >
            <CustomText style={[styles.cancelText, { color: colors.tint }]}>
              Hủy
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.confirmBtn,
              {
                backgroundColor: searchQuery ? colors.tint : colors.border,
              },
            ]}
            onPress={handleConfirm}
            disabled={!searchQuery}
          >
            <CustomText style={styles.confirmText}>Xác nhận</CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    gap: normalize(8),
  },
  searchBar: {
    flex: 1,
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
  searchButton: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(12),
    alignItems: "center",
    justifyContent: "center",
  },
  mapContainer: {
    flex: 1,
  },
  map: {
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
  currentLocationBtn: {
    position: "absolute",
    bottom: normalize(20),
    right: normalize(20),
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  bottomInfo: {
    borderTopWidth: 1,
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: Platform.OS === "ios" ? hp(1) : hp(2),
  },
  infoContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: normalize(12),
    marginBottom: hp(2),
  },
  addressContainer: {
    flex: 1,
  },
  addressLabel: {
    fontSize: normalize(12),
    fontFamily: Fonts.regular,
    marginBottom: normalize(4),
  },
  addressText: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: normalize(12),
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

export default SelectLocationScreen;
