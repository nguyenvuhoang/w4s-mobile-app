import AppHeader from "@/components/base/AppHeader";
import { ThemedText } from "@/components/themed-text";
import i18n from "@/core/i18n/i18n";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Tokens } from "@/core/theme/theme";
import { Fonts } from "@/core/theme/font";
import { hp, normalize, wp } from "@/utils/layout";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// =====================
// Google Places API
// =====================
const GOOGLE_API_KEY = "AIzaSyBTcOHf5TBFbPd6jqnz_bBZCG89dcwCB9U";

// =====================
// Types
// =====================
interface PlaceResult {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    type: "atm" | "bank";
    rating?: number;
    totalRatings?: number;
    isOpen?: boolean;
    distance?: number;
    placeId: string;
}

interface PlaceDetail {
    formattedPhone?: string;
    formattedAddress?: string;
    website?: string;
    weekdayText?: string[];
    url?: string;
}

// =====================
// Type Filters
// =====================
const TYPE_FILTERS = [
    { label: i18n.t("atm_finder.all"), value: "all", icon: "apps-outline" as const },
    { label: i18n.t("atm_finder.atm"), value: "atm", icon: "card-outline" as const },
    { label: i18n.t("atm_finder.bank"), value: "bank", icon: "business-outline" as const },
];

// =====================
// Radius options
// =====================
const RADIUS_OPTIONS = [
    { label: "1 km", value: 1000 },
    { label: "3 km", value: 3000 },
    { label: "5 km", value: 5000 },
    { label: "10 km", value: 10000 },
];

// =====================
// Helpers
// =====================
const haversineDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// =====================
// Screen Component
// =====================
const ATMFinderScreen = () => {
    const { colors, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const mapRef = useRef<MapView>(null);
    const { t } = useTranslation();

    // State
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [places, setPlaces] = useState<PlaceResult[]>([]);
    const [selectedType, setSelectedType] = useState("all");
    const [searchText, setSearchText] = useState("");
    const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [searchRadius, setSearchRadius] = useState(3000);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Detail modal state
    const [placeDetail, setPlaceDetail] = useState<PlaceDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // =====================
    // Get user location
    // =====================
    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") {
                    setErrorMsg(t("atm_finder.permission_error"));
                    setLoading(false);
                    return;
                }

                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

                const loc = {
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                };
                setUserLocation(loc);
                setLoading(false);
            } catch (error) {
                console.error("Error getting location:", error);
                setErrorMsg(t("atm_finder.location_error"));
                setLoading(false);
            }
        })();
    }, []);

    // =====================
    // Fetch nearby places when location or radius changes
    // =====================
    useEffect(() => {
        if (userLocation) {
            fetchNearbyPlaces();
        }
    }, [userLocation, searchRadius]);

    // =====================
    // Fetch nearby ATMs & Banks using Google Places API (New)
    // =====================
    const NEARBY_FIELD_MASK = [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.shortFormattedAddress",
        "places.location",
        "places.rating",
        "places.userRatingCount",
        "places.currentOpeningHours",
        "places.types",
    ].join(",");

    const fetchNearbyPlaces = useCallback(async () => {
        if (!userLocation) return;

        setSearching(true);
        setPlaces([]);

        try {
            const buildNearbyRequest = (includedTypes: string[]) =>
                fetch("https://places.googleapis.com/v1/places:searchNearby", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Goog-Api-Key": GOOGLE_API_KEY,
                        "X-Goog-FieldMask": NEARBY_FIELD_MASK,
                    },
                    body: JSON.stringify({
                        includedTypes,
                        locationRestriction: {
                            circle: {
                                center: {
                                    latitude: userLocation.lat,
                                    longitude: userLocation.lng,
                                },
                                radius: searchRadius,
                            },
                        },
                        languageCode: "vi",
                        maxResultCount: 20,
                    }),
                }).then((r) => r.json());

            // Parallel requests for ATM and Bank
            const [atmRes, bankRes] = await Promise.all([
                buildNearbyRequest(["atm"]),
                buildNearbyRequest(["bank"]),
            ]);

            const parseResults = (data: any, type: "atm" | "bank"): PlaceResult[] => {
                if (data.error) {
                    console.warn(`Google Places API (${type}):`, data.error.message);
                    return [];
                }
                return (data.places || []).map((place: any) => ({
                    id: place.id,
                    name: place.displayName?.text || (type === "atm" ? t("atm_finder.atm") : t("atm_finder.bank")),
                    address: place.shortFormattedAddress || place.formattedAddress || "",
                    lat: place.location?.latitude,
                    lng: place.location?.longitude,
                    type,
                    rating: place.rating,
                    totalRatings: place.userRatingCount,
                    isOpen: place.currentOpeningHours?.openNow,
                    placeId: place.id,
                    distance: haversineDistance(
                        userLocation.lat,
                        userLocation.lng,
                        place.location?.latitude,
                        place.location?.longitude
                    ),
                }));
            };

            const atmResults = parseResults(atmRes, "atm");
            const bankResults = parseResults(bankRes, "bank");

            // Deduplicate by place_id and sort by distance
            const uniqueMap = new Map<string, PlaceResult>();
            [...atmResults, ...bankResults].forEach((p) => {
                if (!uniqueMap.has(p.id)) uniqueMap.set(p.id, p);
            });

            const results = Array.from(uniqueMap.values());
            results.sort((a, b) => (a.distance || 0) - (b.distance || 0));
            setPlaces(results);

            // Fit map to results
            if (results.length > 0 && mapRef.current) {
                const coordinates = results.slice(0, 30).map((p) => ({
                    latitude: p.lat,
                    longitude: p.lng,
                }));
                coordinates.push({
                    latitude: userLocation.lat,
                    longitude: userLocation.lng,
                });
                mapRef.current.fitToCoordinates(coordinates, {
                    edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
                    animated: true,
                });
            }
        } catch (error) {
            console.error("Error fetching places:", error);
            setErrorMsg(t("atm_finder.fetch_error"));
        } finally {
            setSearching(false);
        }
    }, [userLocation, searchRadius]);

    // =====================
    // Text Search (Google Places API - New)
    // =====================
    const handleTextSearch = useCallback(async () => {
        if (!userLocation || !searchText.trim()) return;

        setSearching(true);
        try {
            const TEXT_FIELD_MASK = [
                "places.id",
                "places.displayName",
                "places.formattedAddress",
                "places.shortFormattedAddress",
                "places.location",
                "places.rating",
                "places.userRatingCount",
                "places.currentOpeningHours",
                "places.types",
            ].join(",");

            const response = await fetch(
                "https://places.googleapis.com/v1/places:searchText",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Goog-Api-Key": GOOGLE_API_KEY,
                        "X-Goog-FieldMask": TEXT_FIELD_MASK,
                    },
                    body: JSON.stringify({
                        textQuery: searchText.trim() + " ATM " + t("atm_finder.bank"),
                        locationBias: {
                            circle: {
                                center: {
                                    latitude: userLocation.lat,
                                    longitude: userLocation.lng,
                                },
                                radius: searchRadius,
                            },
                        },
                        languageCode: "vi",
                        maxResultCount: 20,
                    }),
                }
            );
            const data = await response.json();

            if (data.error) {
                console.warn("Text Search error:", data.error.message);
                setPlaces([]);
            } else {
                const results: PlaceResult[] = (data.places || []).map((place: any) => {
                    const types: string[] = place.types || [];
                    return {
                        id: place.id,
                        name: place.displayName?.text || "",
                        address: place.shortFormattedAddress || place.formattedAddress || "",
                        lat: place.location?.latitude,
                        lng: place.location?.longitude,
                        type: types.includes("atm") ? "atm" : ("bank" as "atm" | "bank"),
                        rating: place.rating,
                        totalRatings: place.userRatingCount,
                        isOpen: place.currentOpeningHours?.openNow,
                        placeId: place.id,
                        distance: haversineDistance(
                            userLocation.lat,
                            userLocation.lng,
                            place.location?.latitude,
                            place.location?.longitude
                        ),
                    };
                });

                results.sort((a, b) => (a.distance || 0) - (b.distance || 0));
                setPlaces(results);

                if (results.length > 0 && mapRef.current) {
                    const coords = results.slice(0, 20).map((p) => ({
                        latitude: p.lat,
                        longitude: p.lng,
                    }));
                    mapRef.current.fitToCoordinates(coords, {
                        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
                        animated: true,
                    });
                }
            }
        } catch (error) {
            console.error("Error text searching:", error);
        } finally {
            setSearching(false);
        }
    }, [userLocation, searchText, searchRadius]);

    // =====================
    // Fetch Place Details (Google Places API - New)
    // =====================
    const fetchPlaceDetail = useCallback(async (placeId: string) => {
        setLoadingDetail(true);
        setPlaceDetail(null);

        try {
            const DETAIL_FIELD_MASK = [
                "id",
                "displayName",
                "formattedAddress",
                "nationalPhoneNumber",
                "websiteUri",
                "regularOpeningHours",
                "googleMapsUri",
            ].join(",");

            const response = await fetch(
                `https://places.googleapis.com/v1/places/${placeId}`,
                {
                    method: "GET",
                    headers: {
                        "X-Goog-Api-Key": GOOGLE_API_KEY,
                        "X-Goog-FieldMask": DETAIL_FIELD_MASK,
                    },
                }
            );
            const data = await response.json();

            if (!data.error) {
                setPlaceDetail({
                    formattedPhone: data.nationalPhoneNumber,
                    formattedAddress: data.formattedAddress,
                    website: data.websiteUri,
                    weekdayText: data.regularOpeningHours?.weekdayDescriptions,
                    url: data.googleMapsUri,
                });
            }
        } catch (error) {
            console.error("Error fetching place details:", error);
        } finally {
            setLoadingDetail(false);
        }
    }, []);

    // =====================
    // Filter places client-side (type only, search triggers API)
    // =====================
    const filteredPlaces = useMemo(() => {
        let result = places;

        // Filter by type
        if (selectedType !== "all") {
            result = result.filter((p) => p.type === selectedType);
        }

        return result;
    }, [places, selectedType]);

    // =====================
    // Handlers
    // =====================
    const handleLocationPress = (place: PlaceResult) => {
        setSelectedPlace(place);
        setShowDetail(true);
        fetchPlaceDetail(place.placeId);

        // Center map on this place
        if (mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: place.lat,
                longitude: place.lng,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            });
        }
    };

    const handleMarkerPress = (place: PlaceResult) => {
        setSelectedPlace(place);
        setShowDetail(true);
        fetchPlaceDetail(place.placeId);
    };

    const handleOpenDirections = (place: PlaceResult) => {
        if (!userLocation) return;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${place.lat},${place.lng}&destination_place_id=${place.placeId}&travelmode=driving`;
        Linking.openURL(url);
    };

    const handleCall = (phone: string) => {
        Linking.openURL(`tel:${phone.replace(/\s/g, "")}`);
    };

    const handleCenterToUser = () => {
        if (userLocation && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: userLocation.lat,
                longitude: userLocation.lng,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
            });
        }
    };

    const handleRefresh = () => {
        if (searchText.trim()) {
            handleTextSearch();
        } else {
            fetchNearbyPlaces();
        }
    };

    const handleClearSearch = () => {
        setSearchText("");
        fetchNearbyPlaces();
    };

    // =====================
    // Render Map Markers
    // =====================
    const renderMarkers = () => {
        return filteredPlaces.map((place) => (
            <Marker
                key={place.id}
                coordinate={{ latitude: place.lat, longitude: place.lng }}
                title={place.name}
                description={place.address}
                onCalloutPress={() => handleMarkerPress(place)}
                pinColor={place.type === "atm" ? "#00A651" : "#3B82F6"}
            />
        ));
    };

    // =====================
    // Render Location Card
    // =====================
    const renderLocationItem = ({ item }: { item: PlaceResult }) => {
        return (
            <TouchableOpacity
                style={[styles.locationCard, { backgroundColor: colors.card }]}
                onPress={() => handleLocationPress(item)}
                activeOpacity={0.7}
            >
                {/* Top Row */}
                <View style={styles.locationCardTop}>
                    {/* Type Icon */}
                    <View
                        style={[
                            styles.typeIcon,
                            {
                                backgroundColor:
                                    item.type === "atm"
                                        ? isDark
                                            ? "rgba(0,166,81,0.2)"
                                            : "rgba(0,166,81,0.1)"
                                        : isDark
                                            ? "rgba(59,130,246,0.2)"
                                            : "rgba(59,130,246,0.1)",
                            },
                        ]}
                    >
                        <Ionicons
                            name={item.type === "atm" ? "card-outline" : "business-outline"}
                            size={normalize(20)}
                            color={item.type === "atm" ? "#00A651" : "#3B82F6"}
                        />
                    </View>

                    <View style={styles.locationCardInfo}>
                        <ThemedText
                            style={[styles.locationName, { color: colors.text }]}
                            numberOfLines={1}
                        >
                            {item.name}
                        </ThemedText>
                        {item.address ? (
                            <ThemedText
                                style={[styles.locationAddress, { color: colors.icon }]}
                                numberOfLines={2}
                            >
                                {item.address}
                            </ThemedText>
                        ) : null}
                    </View>
                </View>

                {/* Bottom Row: Tags & Distance */}
                <View style={styles.locationCardBottom}>
                    <View style={styles.tagsRow}>
                        {/* Type Badge */}
                        <View
                            style={[
                                styles.typeBadge,
                                {
                                    backgroundColor:
                                        item.type === "atm"
                                            ? isDark
                                                ? "rgba(0,166,81,0.2)"
                                                : "rgba(0,166,81,0.1)"
                                            : isDark
                                                ? "rgba(59,130,246,0.2)"
                                                : "rgba(59,130,246,0.1)",
                                },
                            ]}
                        >
                            <ThemedText
                                style={[
                                    styles.typeBadgeText,
                                    { color: item.type === "atm" ? "#00A651" : "#3B82F6" },
                                ]}
                            >
                                {item.type === "atm" ? "ATM" : "Ngân hàng"}
                            </ThemedText>
                        </View>

                        {/* Open/Closed Badge */}
                        {item.isOpen !== undefined && (
                            <View
                                style={[
                                    styles.openBadge,
                                    {
                                        backgroundColor: item.isOpen
                                            ? isDark
                                                ? "rgba(0,166,81,0.2)"
                                                : "rgba(0,166,81,0.1)"
                                            : isDark
                                                ? "rgba(239,68,68,0.2)"
                                                : "rgba(239,68,68,0.1)",
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.openDot,
                                        { backgroundColor: item.isOpen ? "#00A651" : "#EF4444" },
                                    ]}
                                />
                                <ThemedText
                                    style={[
                                        styles.openBadgeText,
                                        { color: item.isOpen ? "#00A651" : "#EF4444" },
                                    ]}
                                >
                                    {item.isOpen ? t("atm_finder.open") : t("atm_finder.closed")}
                                </ThemedText>
                            </View>
                        )}

                        {/* Rating */}
                        {item.rating !== undefined && (
                            <View style={styles.ratingWrapper}>
                                <Ionicons name="star" size={normalize(12)} color="#F59E0B" />
                                <ThemedText style={[styles.ratingText, { color: colors.icon }]}>
                                    {item.rating.toFixed(1)}
                                </ThemedText>
                            </View>
                        )}
                    </View>

                    {/* Distance */}
                    {item.distance !== undefined && (
                        <View style={styles.distanceWrapper}>
                            <Ionicons name="navigate-outline" size={normalize(14)} color={colors.tint} />
                            <ThemedText style={[styles.distanceText, { color: colors.tint }]}>
                                {item.distance < 1
                                    ? `${Math.round(item.distance * 1000)} ${t("atm_finder.unit_meter")}`
                                    : `${item.distance.toFixed(1)} ${t("atm_finder.unit_km")}`}
                            </ThemedText>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    // =====================
    // Detail Modal
    // =====================
    const renderDetailModal = () => {
        if (!selectedPlace) return null;

        return (
            <Modal
                visible={showDetail}
                transparent
                animationType="slide"
                onRequestClose={() => setShowDetail(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowDetail(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[styles.modalContent, { backgroundColor: colors.card }]}
                        onPress={() => { }}
                    >
                        {/* Handle Bar */}
                        <View style={[styles.handleBar, { backgroundColor: colors.border }]} />

                        {/* Header */}
                        <View style={styles.detailHeader}>
                            <View
                                style={[
                                    styles.detailTypeIcon,
                                    {
                                        backgroundColor:
                                            selectedPlace.type === "atm"
                                                ? isDark
                                                    ? "rgba(0,166,81,0.2)"
                                                    : "rgba(0,166,81,0.1)"
                                                : isDark
                                                    ? "rgba(59,130,246,0.2)"
                                                    : "rgba(59,130,246,0.1)",
                                    },
                                ]}
                            >
                                <Ionicons
                                    name={selectedPlace.type === "atm" ? "card-outline" : "business-outline"}
                                    size={normalize(24)}
                                    color={selectedPlace.type === "atm" ? "#00A651" : "#3B82F6"}
                                />
                            </View>
                            <View style={styles.detailHeaderInfo}>
                                <ThemedText style={[styles.detailName, { color: colors.text }]} numberOfLines={2}>
                                    {selectedPlace.name}
                                </ThemedText>
                                <View style={styles.detailBankRow}>
                                    <View
                                        style={[
                                            styles.detailTypeBadge,
                                            {
                                                backgroundColor:
                                                    selectedPlace.type === "atm"
                                                        ? "rgba(0,166,81,0.1)"
                                                        : "rgba(59,130,246,0.1)",
                                            },
                                        ]}
                                    >
                                        <ThemedText
                                            style={[
                                                styles.detailTypeBadgeText,
                                                { color: selectedPlace.type === "atm" ? "#00A651" : "#3B82F6" },
                                            ]}
                                        >
                                            {selectedPlace.type === "atm" ? "ATM" : "Ngân hàng"}
                                        </ThemedText>
                                    </View>

                                    {selectedPlace.isOpen !== undefined && (
                                        <View
                                            style={[
                                                styles.detailTypeBadge,
                                                {
                                                    backgroundColor: selectedPlace.isOpen
                                                        ? "rgba(0,166,81,0.1)"
                                                        : "rgba(239,68,68,0.1)",
                                                },
                                            ]}
                                        >
                                            <ThemedText
                                                style={[
                                                    styles.detailTypeBadgeText,
                                                    { color: selectedPlace.isOpen ? "#00A651" : "#EF4444" },
                                                ]}
                                            >
                                                {selectedPlace.isOpen ? t("atm_finder.opening") : t("atm_finder.closing")}
                                            </ThemedText>
                                        </View>
                                    )}

                                    {selectedPlace.rating !== undefined && (
                                        <View style={styles.detailRating}>
                                            <Ionicons name="star" size={normalize(13)} color="#F59E0B" />
                                            <ThemedText style={[styles.detailRatingText, { color: colors.text }]}>
                                                {selectedPlace.rating.toFixed(1)}
                                            </ThemedText>
                                            {selectedPlace.totalRatings !== undefined && (
                                                <ThemedText style={[styles.detailRatingCount, { color: colors.icon }]}>
                                                    ({selectedPlace.totalRatings})
                                                </ThemedText>
                                            )}
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Info Items */}
                        <ScrollView style={styles.detailScrollView} showsVerticalScrollIndicator={false}>
                            <View style={[styles.detailInfoSection, { borderColor: colors.border }]}>
                                {/* Address */}
                                <DetailInfoRow
                                    icon="location-outline"
                                    iconColor="#3B82F6"
                                    label={t("atm_finder.address")}
                                    value={placeDetail?.formattedAddress || selectedPlace.address}
                                    colors={colors}
                                    isDark={isDark}
                                />

                                {/* Distance */}
                                {selectedPlace.distance !== undefined && (
                                    <DetailInfoRow
                                        icon="navigate-outline"
                                        iconColor="#8B5CF6"
                                        label={t("atm_finder.distance")}
                                        value={
                                            selectedPlace.distance < 1
                                                ? `${Math.round(selectedPlace.distance * 1000)} ${t("atm_finder.unit_meter")}`
                                                : `${selectedPlace.distance.toFixed(1)} ${t("atm_finder.unit_km")}`
                                        }
                                        colors={colors}
                                        isDark={isDark}
                                    />
                                )}

                                {/* Loading detail */}
                                {loadingDetail ? (
                                    <View style={styles.detailLoadingRow}>
                                        <ActivityIndicator size="small" color={colors.tint} />
                                        <ThemedText style={[styles.detailLoadingText, { color: colors.icon }]}>
                                            {t("atm_finder.loading_detail")}
                                        </ThemedText>
                                    </View>
                                ) : (
                                    <>
                                        {/* Phone */}
                                        {placeDetail?.formattedPhone && (
                                            <DetailInfoRow
                                                icon="call-outline"
                                                iconColor="#00A651"
                                                label={t("atm_finder.phone")}
                                                value={placeDetail.formattedPhone}
                                                colors={colors}
                                                isDark={isDark}
                                                isLink
                                                onPress={() => handleCall(placeDetail.formattedPhone!)}
                                            />
                                        )}

                                        {/* Working Hours */}
                                        {placeDetail?.weekdayText && placeDetail.weekdayText.length > 0 && (
                                            <View style={styles.detailInfoItem}>
                                                <View
                                                    style={[
                                                        styles.detailInfoIcon,
                                                        {
                                                            backgroundColor: isDark
                                                                ? "rgba(245,158,11,0.2)"
                                                                : "rgba(245,158,11,0.1)",
                                                        },
                                                    ]}
                                                >
                                                    <Ionicons name="time-outline" size={normalize(18)} color="#F59E0B" />
                                                </View>
                                                <View style={styles.detailInfoContent}>
                                                    <ThemedText style={[styles.detailInfoLabel, { color: colors.icon }]}>
                                                        {t("atm_finder.working_hours")}
                                                    </ThemedText>
                                                    {placeDetail.weekdayText.map((text, idx) => (
                                                        <ThemedText
                                                            key={idx}
                                                            style={[styles.detailInfoValueSmall, { color: colors.text }]}
                                                        >
                                                            {text}
                                                        </ThemedText>
                                                    ))}
                                                </View>
                                            </View>
                                        )}

                                        {/* Website */}
                                        {placeDetail?.website && (
                                            <DetailInfoRow
                                                icon="globe-outline"
                                                iconColor="#EC4899"
                                                label={t("atm_finder.website")}
                                                value={placeDetail.website}
                                                colors={colors}
                                                isDark={isDark}
                                                isLink
                                                numberOfLines={1}
                                                onPress={() => Linking.openURL(placeDetail.website!)}
                                            />
                                        )}
                                    </>
                                )}
                            </View>
                        </ScrollView>

                        {/* Action Buttons */}
                        <View style={styles.detailActions}>
                            {placeDetail?.formattedPhone && (
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.callButton]}
                                    onPress={() => handleCall(placeDetail.formattedPhone!)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="call" size={normalize(20)} color="#FFFFFF" />
                                    <ThemedText style={styles.actionButtonText}>{t("atm_finder.call")}</ThemedText>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    styles.mapButton,
                                    !placeDetail?.formattedPhone && { flex: 1 },
                                ]}
                                onPress={() => handleOpenDirections(selectedPlace)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="navigate" size={normalize(20)} color="#FFFFFF" />
                                <ThemedText style={styles.actionButtonText}>{t("atm_finder.directions")}</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        );
    };

    // =====================
    // Loading State
    // =====================
    if (loading) {
        return (
            <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: colors.background }]}>
                <AppHeader title={t("atm_finder.title")} showBackButton />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.tint} />
                    <ThemedText style={[styles.loadingText, { color: colors.icon }]}>
                        {t("atm_finder.determining_location")}
                    </ThemedText>
                </View>
            </SafeAreaView>
        );
    }

    // =====================
    // Error State
    // =====================
    if (errorMsg && !userLocation) {
        return (
            <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: colors.background }]}>
                <AppHeader title={t("atm_finder.title")} showBackButton />
                <View style={styles.errorContainer}>
                    <Ionicons name="location-outline" size={normalize(64)} color={colors.border} />
                    <ThemedText style={[styles.errorTitle, { color: colors.text }]}>
                        {t("atm_finder.no_location_access")}
                    </ThemedText>
                    <ThemedText style={[styles.errorDesc, { color: colors.icon }]}>
                        {errorMsg}
                    </ThemedText>
                    <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: "transparent", overflow: "hidden" }]}
                        onPress={() => {
                            setErrorMsg(null);
                            setLoading(true);
                            Location.requestForegroundPermissionsAsync().then(({ status }) => {
                                if (status === "granted") {
                                    Location.getCurrentPositionAsync({
                                        accuracy: Location.Accuracy.Balanced,
                                    }).then((loc) => {
                                        setUserLocation({
                                            lat: loc.coords.latitude,
                                            lng: loc.coords.longitude,
                                        });
                                        setLoading(false);
                                    });
                                } else {
                                    setErrorMsg(t("atm_finder.grant_permission_hint"));
                                    setLoading(false);
                                }
                            });
                        }}
                    >
                        <LinearGradient
                            colors={Tokens.gradients.base}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                        />
                        <ThemedText style={styles.retryButtonText}>{t("atm_finder.retry")}</ThemedText>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: colors.background }]}>
            <AppHeader title={t("atm_finder.title")} showBackButton />

            {/* Map Section */}
            {userLocation && (
                <View style={styles.mapContainer}>
                    <MapView
                        ref={mapRef}
                        provider={PROVIDER_GOOGLE}
                        style={styles.map}
                        initialRegion={{
                            latitude: userLocation.lat,
                            longitude: userLocation.lng,
                            latitudeDelta: 0.02,
                            longitudeDelta: 0.02,
                        }}
                        showsUserLocation
                        showsMyLocationButton={false}
                    >
                        {renderMarkers()}
                    </MapView>

                    {/* Center to user button */}
                    <TouchableOpacity
                        style={[
                            styles.floatingButton,
                            styles.floatingButtonRight,
                            { backgroundColor: colors.card, shadowColor: colors.text },
                        ]}
                        onPress={handleCenterToUser}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="locate" size={normalize(22)} color={colors.tint} />
                    </TouchableOpacity>

                    {/* Refresh button */}
                    <TouchableOpacity
                        style={[
                            styles.floatingButton,
                            styles.floatingButtonLeft,
                            { backgroundColor: colors.card, shadowColor: colors.text },
                        ]}
                        onPress={handleRefresh}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="refresh" size={normalize(22)} color={colors.tint} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Bottom Sheet */}
            <View style={[styles.bottomSheet, { backgroundColor: colors.background }]}>
                {/* Search Bar */}
                <View style={styles.searchSection}>
                    <View
                        style={[
                            styles.searchBar,
                            { backgroundColor: colors.card, borderColor: colors.border },
                        ]}
                    >
                        <Ionicons name="search-outline" size={normalize(20)} color={colors.icon} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder={t("atm_finder.search_placeholder")}
                            placeholderTextColor={colors.icon}
                            value={searchText}
                            onChangeText={setSearchText}
                            returnKeyType="search"
                            onSubmitEditing={handleTextSearch}
                        />
                        {searchText.length > 0 && (
                            <TouchableOpacity onPress={handleClearSearch} activeOpacity={0.7}>
                                <Ionicons name="close-circle" size={normalize(20)} color={colors.icon} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Type Filter + Radius */}
                <View style={styles.filtersRow}>
                    {/* Type Filters */}
                    <View style={styles.typeFilterSection}>
                        {TYPE_FILTERS.map((filter) => (
                            <TouchableOpacity
                                key={filter.value}
                                style={[
                                    styles.typeFilterButton,
                                    {
                                        backgroundColor:
                                            selectedType === filter.value ? "transparent" : colors.card,
                                        borderColor:
                                            selectedType === filter.value ? "transparent" : colors.border,
                                        overflow: "hidden",
                                    },
                                ]}
                                onPress={() => setSelectedType(filter.value)}
                                activeOpacity={0.7}
                            >
                                {selectedType === filter.value && (
                                    <LinearGradient
                                        colors={Tokens.gradients.base}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={StyleSheet.absoluteFill}
                                    />
                                )}
                                <Ionicons
                                    name={filter.icon}
                                    size={normalize(14)}
                                    color={selectedType === filter.value ? "#fff" : colors.text}
                                />
                                <ThemedText
                                    style={[
                                        styles.typeFilterText,
                                        { color: selectedType === filter.value ? "#fff" : colors.text },
                                    ]}
                                >
                                    {filter.label}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Radius selector */}
                <View style={styles.radiusSection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.radiusContent}
                    >
                        <ThemedText style={[styles.radiusLabel, { color: colors.icon }]}>
                            {t("atm_finder.radius")}
                        </ThemedText>
                        {RADIUS_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.radiusChip,
                                    {
                                        backgroundColor:
                                            searchRadius === option.value ? "transparent" : colors.card,
                                        borderColor:
                                            searchRadius === option.value ? "transparent" : colors.border,
                                        overflow: "hidden",
                                    },
                                ]}
                                onPress={() => setSearchRadius(option.value)}
                                activeOpacity={0.7}
                            >
                                {searchRadius === option.value && (
                                    <LinearGradient
                                        colors={Tokens.gradients.base}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={StyleSheet.absoluteFill}
                                    />
                                )}
                                <ThemedText
                                    style={[
                                        styles.radiusChipText,
                                        { color: searchRadius === option.value ? "#fff" : colors.text },
                                    ]}
                                >
                                    {option.label}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Results count */}
                <View style={styles.resultsCountSection}>
                    <ThemedText style={[styles.resultsCountText, { color: colors.icon }]}>
                        {searching ? (
                            t("atm_finder.searching")
                        ) : (
                            <>
                                {t("atm_finder.results_found", { count: filteredPlaces.length })}
                            </>
                        )}
                    </ThemedText>
                </View>

                {/* Location List */}
                {searching ? (
                    <View style={styles.searchingContainer}>
                        <ActivityIndicator size="small" color={colors.tint} />
                    </View>
                ) : (
                    <FlatList
                        data={filteredPlaces}
                        keyExtractor={(item) => item.id}
                        renderItem={renderLocationItem}
                        contentContainerStyle={[styles.listContent, { paddingBottom: hp(3) + insets.bottom }]}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="location-outline" size={normalize(48)} color={colors.border} />
                                <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                                    {t("atm_finder.no_results")}
                                </ThemedText>
                                <ThemedText style={[styles.emptyDesc, { color: colors.icon }]}>
                                    {t("atm_finder.no_results_hint")}
                                </ThemedText>
                            </View>
                        }
                    />
                )}
            </View>

            {/* Detail Modal */}
            {renderDetailModal()}
        </SafeAreaView>
    );
};

// =====================
// Reusable Detail Info Row
// =====================
const DetailInfoRow = ({
    icon,
    iconColor,
    label,
    value,
    colors,
    isDark,
    isLink,
    numberOfLines,
    onPress,
}: {
    icon: any;
    iconColor: string;
    label: string;
    value: string;
    colors: any;
    isDark: boolean;
    isLink?: boolean;
    numberOfLines?: number;
    onPress?: () => void;
}) => (
    <View style={styles.detailInfoItem}>
        <View
            style={[
                styles.detailInfoIcon,
                { backgroundColor: isDark ? `${iconColor}33` : `${iconColor}1A` },
            ]}
        >
            <Ionicons name={icon} size={normalize(18)} color={iconColor} />
        </View>
        <View style={styles.detailInfoContent}>
            <ThemedText style={[styles.detailInfoLabel, { color: colors.icon }]}>{label}</ThemedText>
            {onPress ? (
                <TouchableOpacity onPress={onPress}>
                    <ThemedText
                        style={[styles.detailInfoValue, { color: colors.tint }]}
                        numberOfLines={numberOfLines}
                    >
                        {value}
                    </ThemedText>
                </TouchableOpacity>
            ) : (
                <ThemedText
                    style={[styles.detailInfoValue, { color: colors.text }]}
                    numberOfLines={numberOfLines}
                >
                    {value}
                </ThemedText>
            )}
        </View>
    </View>
);

// =====================
// Styles
// =====================
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    // Loading
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

    // Error
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: wp(10),
        gap: normalize(12),
    },
    errorTitle: {
        fontSize: normalize(18),
        fontFamily: Fonts.bold,
        textAlign: "center",
    },
    errorDesc: {
        fontSize: normalize(14),
        fontFamily: Fonts.regular,
        textAlign: "center",
        lineHeight: normalize(20),
    },
    retryButton: {
        paddingHorizontal: normalize(32),
        paddingVertical: normalize(12),
        borderRadius: normalize(12),
        marginTop: normalize(8),
    },
    retryButtonText: {
        fontSize: normalize(15),
        fontFamily: Fonts.bold,
        color: "#FFFFFF",
    },

    // Map
    mapContainer: {
        height: hp(30),
    },
    map: {
        flex: 1,
    },
    floatingButton: {
        position: "absolute",
        bottom: normalize(16),
        width: normalize(44),
        height: normalize(44),
        borderRadius: normalize(22),
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
    floatingButtonRight: {
        right: normalize(16),
    },
    floatingButtonLeft: {
        right: normalize(68),
    },

    // Bottom Sheet
    bottomSheet: {
        flex: 1,
        borderTopLeftRadius: normalize(20),
        borderTopRightRadius: normalize(20),
        marginTop: normalize(-12),
        overflow: "hidden",
    },

    // Search
    searchSection: {
        paddingHorizontal: wp(5),
        paddingTop: normalize(16),
        paddingBottom: normalize(8),
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: normalize(12),
        paddingHorizontal: normalize(14),
        paddingVertical: normalize(10),
        gap: normalize(10),
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: normalize(14),
        fontFamily: Fonts.regular,
        padding: 0,
    },

    // Filters
    filtersRow: {
        paddingHorizontal: wp(5),
        paddingBottom: normalize(6),
    },
    typeFilterSection: {
        flexDirection: "row",
        gap: normalize(8),
    },
    typeFilterButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: normalize(5),
        paddingVertical: normalize(9),
        borderRadius: normalize(10),
        borderWidth: 1,
    },
    typeFilterText: {
        fontSize: normalize(12),
        fontFamily: Fonts.medium,
    },

    // Radius
    radiusSection: {
        paddingBottom: normalize(6),
    },
    radiusContent: {
        paddingHorizontal: wp(5),
        gap: normalize(8),
        alignItems: "center",
    },
    radiusLabel: {
        fontSize: normalize(12),
        fontFamily: Fonts.medium,
        marginRight: normalize(2),
    },
    radiusChip: {
        paddingHorizontal: normalize(12),
        paddingVertical: normalize(6),
        borderRadius: normalize(16),
        borderWidth: 1,
    },
    radiusChipText: {
        fontSize: normalize(11),
        fontFamily: Fonts.medium,
    },

    // Results Count
    resultsCountSection: {
        paddingHorizontal: wp(5),
        paddingVertical: normalize(4),
    },
    resultsCountText: {
        fontSize: normalize(13),
        fontFamily: Fonts.regular,
    },
    resultsCountHighlight: {
        fontFamily: Fonts.bold,
    },

    // Searching
    searchingContainer: {
        paddingTop: normalize(32),
        alignItems: "center",
    },

    // List
    listContent: {
        paddingHorizontal: wp(5),
        paddingBottom: hp(3),
        gap: normalize(10),
    },

    // Location Card
    locationCard: {
        borderRadius: normalize(14),
        padding: normalize(14),
        gap: normalize(12),
    },
    locationCardTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: normalize(12),
    },
    typeIcon: {
        width: normalize(40),
        height: normalize(40),
        borderRadius: normalize(12),
        alignItems: "center",
        justifyContent: "center",
    },
    locationCardInfo: {
        flex: 1,
        gap: normalize(4),
    },
    locationName: {
        fontSize: normalize(14),
        fontFamily: Fonts.bold,
        lineHeight: normalize(20),
    },
    locationAddress: {
        fontSize: normalize(12),
        fontFamily: Fonts.regular,
        lineHeight: normalize(18),
    },
    locationCardBottom: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    tagsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: normalize(6),
        flexShrink: 1,
        flexWrap: "wrap",
    },
    typeBadge: {
        paddingHorizontal: normalize(8),
        paddingVertical: normalize(4),
        borderRadius: normalize(6),
    },
    typeBadgeText: {
        fontSize: normalize(11),
        fontFamily: Fonts.medium,
    },
    openBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: normalize(4),
        paddingHorizontal: normalize(8),
        paddingVertical: normalize(4),
        borderRadius: normalize(6),
    },
    openDot: {
        width: normalize(6),
        height: normalize(6),
        borderRadius: normalize(3),
    },
    openBadgeText: {
        fontSize: normalize(11),
        fontFamily: Fonts.medium,
    },
    ratingWrapper: {
        flexDirection: "row",
        alignItems: "center",
        gap: normalize(3),
    },
    ratingText: {
        fontSize: normalize(11),
        fontFamily: Fonts.medium,
    },
    distanceWrapper: {
        flexDirection: "row",
        alignItems: "center",
        gap: normalize(4),
    },
    distanceText: {
        fontSize: normalize(13),
        fontFamily: Fonts.bold,
    },

    // Empty
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: hp(6),
        gap: normalize(10),
    },
    emptyTitle: {
        fontSize: normalize(16),
        fontFamily: Fonts.bold,
    },
    emptyDesc: {
        fontSize: normalize(13),
        fontFamily: Fonts.regular,
        textAlign: "center",
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        borderTopLeftRadius: normalize(24),
        borderTopRightRadius: normalize(24),
        padding: normalize(20),
        paddingBottom: normalize(32),
        maxHeight: "80%",
    },
    handleBar: {
        width: normalize(40),
        height: normalize(4),
        borderRadius: normalize(2),
        alignSelf: "center",
        marginBottom: normalize(16),
    },

    // Detail Header
    detailHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: normalize(14),
        marginBottom: normalize(20),
    },
    detailTypeIcon: {
        width: normalize(48),
        height: normalize(48),
        borderRadius: normalize(14),
        alignItems: "center",
        justifyContent: "center",
    },
    detailHeaderInfo: {
        flex: 1,
        gap: normalize(6),
    },
    detailName: {
        fontSize: normalize(17),
        fontFamily: Fonts.bold,
        lineHeight: normalize(24),
    },
    detailBankRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: normalize(6),
        flexWrap: "wrap",
    },
    detailTypeBadge: {
        paddingHorizontal: normalize(8),
        paddingVertical: normalize(3),
        borderRadius: normalize(6),
    },
    detailTypeBadgeText: {
        fontSize: normalize(11),
        fontFamily: Fonts.medium,
    },
    detailRating: {
        flexDirection: "row",
        alignItems: "center",
        gap: normalize(3),
    },
    detailRatingText: {
        fontSize: normalize(13),
        fontFamily: Fonts.bold,
    },
    detailRatingCount: {
        fontSize: normalize(11),
        fontFamily: Fonts.regular,
    },

    // Detail Scroll
    detailScrollView: {
        maxHeight: hp(35),
    },

    // Detail Info
    detailInfoSection: {
        gap: normalize(14),
        paddingBottom: normalize(16),
        borderBottomWidth: 1,
        marginBottom: normalize(16),
    },
    detailInfoItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: normalize(12),
    },
    detailInfoIcon: {
        width: normalize(36),
        height: normalize(36),
        borderRadius: normalize(10),
        alignItems: "center",
        justifyContent: "center",
    },
    detailInfoContent: {
        flex: 1,
        gap: normalize(2),
    },
    detailInfoLabel: {
        fontSize: normalize(11),
        fontFamily: Fonts.regular,
    },
    detailInfoValue: {
        fontSize: normalize(14),
        fontFamily: Fonts.medium,
        lineHeight: normalize(20),
    },
    detailInfoValueSmall: {
        fontSize: normalize(12),
        fontFamily: Fonts.regular,
        lineHeight: normalize(18),
    },
    detailLoadingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: normalize(10),
        paddingVertical: normalize(8),
    },
    detailLoadingText: {
        fontSize: normalize(13),
        fontFamily: Fonts.regular,
    },

    // Actions
    detailActions: {
        flexDirection: "row",
        gap: normalize(12),
    },
    actionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: normalize(8),
        paddingVertical: normalize(14),
        borderRadius: normalize(12),
    },
    callButton: {
        backgroundColor: "#00A651",
    },
    mapButton: {
        backgroundColor: "#3B82F6",
    },
    actionButtonText: {
        fontSize: normalize(15),
        fontFamily: Fonts.bold,
        color: "#FFFFFF",
    },
});

export default ATMFinderScreen;
