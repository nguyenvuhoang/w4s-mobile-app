import AppHeader from '@/components/base/AppHeader';
import AppIcon from '@/components/base/AppIcon';
import CustomText from '@/components/base/CustomText';
import STORAGE_KEY from '@/constants/StorageKey';
import { useNotification } from '@/contexts/NotificationContext';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { useCategory } from '@/hooks/useCategory';
import StorageService from '@/services/StorageService';
import { hp, normalize, wp } from '@/utils/layout';
import { createMultilingualCategoryName, translateText } from '@/utils/translation';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ParentCategory {
    id: string;
    category_name: string;
    icon: string;
    color: string;
    category_type: string;
}

type CategoryType = 'INCOME' | 'EXPENSE';

const getBaseType = (categoryType: string): CategoryType => {
    if (categoryType.startsWith('INCOME')) return 'INCOME';
    if (categoryType.startsWith('EXPENSE')) return 'EXPENSE';
    return 'EXPENSE';
};

const CreateCategoryScreen: React.FC = () => {
    const { colors } = useAppTheme();
    const params = useLocalSearchParams();
    const { t, i18n } = useTranslation();
    const { createCategory, creating } = useCategory({ autoFetch: false });
    const { showNotification } = useNotification();

    // Ngôn ngữ hiện tại của app
    const currentLang = i18n.language as 'vi' | 'en';
    const otherLang = currentLang === 'vi' ? 'en' : 'vi';

    const [icon, setIcon] = useState('list');
    const [iconColor, setIconColor] = useState('#3B82F6');
    const [loading, setLoading] = useState(false);

    // Category name - Multilingual
    const [primaryName, setPrimaryName] = useState(''); // Tên theo ngôn ngữ hiện tại
    const [translatedName, setTranslatedName] = useState(''); // Tên đã dịch
    const [isTranslating, setIsTranslating] = useState(false);
    const [showTranslation, setShowTranslation] = useState(false);
    const [isEditingTranslation, setIsEditingTranslation] = useState(false);

    // Debounce timer ref
    const translateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Category type
    const [selectedType, setSelectedType] = useState<CategoryType>('EXPENSE');

    // Parent category
    const [parentCategory, setParentCategory] = useState<ParentCategory | null>(null);

    // Auto translate khi người dùng ngừng nhập
    useEffect(() => {
        // Clear timeout cũ
        if (translateTimeoutRef.current) {
            clearTimeout(translateTimeoutRef.current);
        }

        // Chỉ dịch khi có text và không đang edit translation
        if (primaryName.trim() && !isEditingTranslation) {
            setIsTranslating(true);

            // Debounce 800ms
            translateTimeoutRef.current = setTimeout(async () => {
                try {
                    const result = await translateText(
                        primaryName.trim(),
                        currentLang,
                        otherLang
                    );

                    if (result.success) {
                        setTranslatedName(result.translatedText);
                        setShowTranslation(true);
                    }
                } catch (error) {
                    console.error('[CreateCategory] Translation failed:', error);
                } finally {
                    setIsTranslating(false);
                }
            }, 800);
        } else {
            setIsTranslating(false);
            if (!primaryName.trim()) {
                setTranslatedName('');
                setShowTranslation(false);
            }
        }

        return () => {
            if (translateTimeoutRef.current) {
                clearTimeout(translateTimeoutRef.current);
            }
        };
    }, [primaryName, currentLang, otherLang, isEditingTranslation]);

    useFocusEffect(
        useCallback(() => {
            const loadSelectedData = async () => {
                try {
                    // Load selected icon
                    const selectedIcon = await StorageService.getItem(STORAGE_KEY.TEMP_ICON_STORAGE);
                    if (selectedIcon) {
                        setIcon(selectedIcon);
                        await StorageService.removeItem(STORAGE_KEY.TEMP_ICON_STORAGE);
                    }

                    // Load selected color
                    const selectedColor = await StorageService.getItem(STORAGE_KEY.TEMP_COLOR_STORAGE);
                    if (selectedColor) {
                        setIconColor(selectedColor);
                        await StorageService.removeItem(STORAGE_KEY.TEMP_COLOR_STORAGE);
                    }

                    // Load selected parent category (sử dụng getItem vì dữ liệu được lưu tạm trong AsyncStorage)
                    const selectedParentStr = await StorageService.getItem(STORAGE_KEY.TEMP_CATEGORY_STORAGE);
                    console.log('[CreateCategory] Raw parent from storage:', selectedParentStr);

                    if (selectedParentStr) {
                        try {
                            const selectedParent = JSON.parse(selectedParentStr);
                            console.log('[CreateCategory] Parsed parent:', selectedParent);

                            // 🔥 Set parent category
                            setParentCategory(selectedParent);

                            if (selectedParent.category_type) {
                                setSelectedType(getBaseType(selectedParent.category_type));
                            }

                            await StorageService.removeItem(STORAGE_KEY.TEMP_CATEGORY_STORAGE);
                        } catch (parseError) {
                            console.error('[CreateCategory] Failed to parse parent category:', parseError);
                        }
                    }
                } catch (error) {
                    console.error('[CreateCategory] Failed to load selected data:', error);
                }
            };

            loadSelectedData();
        }, [])
    );

    const handleCreate = async () => {
        if (!primaryName.trim()) {
            showNotification(t('category.please_enter_name'), 'warning');
            return;
        }

        // Tạo tên multilingual
        const viName = currentLang === 'vi' ? primaryName.trim() : translatedName.trim() || primaryName.trim();
        const enName = currentLang === 'en' ? primaryName.trim() : translatedName.trim() || primaryName.trim();

        const categoryNameJson = createMultilingualCategoryName(viName, enName);

        console.log('[CreateCategory] Creating category with data:', {
            type: selectedType,
            name: categoryNameJson,
            icon,
            iconColor,
            parentCategoryId: parentCategory?.id || null,
        });

        try {
            setLoading(true);


            const categoryGroup = parentCategory
                ? parentCategory.category_type as 'EXPENSE' | 'INCOME' | 'LOAN'
                : selectedType;
            const categoryType = selectedType;

            const result = await createCategory({
                category_group: categoryType,
                category_type: categoryType,
                category_name: categoryNameJson,
                icon: icon,
                color: iconColor,
                parent_category_id: parentCategory?.id || undefined,
            });

            if (result.success) {
                console.log('[CreateCategory] Category created successfully');
                showNotification(t('category.create_success') || 'Tạo danh mục thành công', 'success');
                router.back();
            } else {
                console.error('[CreateCategory] API returned error:', result.message);
                showNotification(result.message || t('category.create_failed'), 'error');
            }
        } catch (error) {
            console.error('[CreateCategory] Create category failed:', error);
            showNotification(t('category.create_failed'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectIcon = () => {
        router.push({
            pathname: '/(protected)/select-icon',
            params: {
                color: iconColor,
            }
        });
    };

    const handleSelectColor = () => {
        router.push({
            pathname: '/(protected)/select-color',
            params: {
                icon,
            }
        });
    };

    const handleSelectParent = () => {
        router.push({
            pathname: "/(protected)/select-category",
            params: { selectedType, isSelectParent: 'true' },
        })
    };

    const parseCategoryName = (nameJson: string) => {
        try {
            const parsed = JSON.parse(nameJson);
            return parsed[currentLang] || parsed.vi || parsed.en || '';
        } catch {
            return nameJson;
        }
    };

    // 🔥 Handle type change - Reset parent nếu type khác (giống AddTransactionScreen)
    const handleTypeChange = (type: CategoryType) => {
        setSelectedType(type);

        // Reset parent category nếu type không khớp
        if (parentCategory && parentCategory.category_type !== type) {
            setParentCategory(null);
        }
    };

    // Retry translation
    const handleRetryTranslation = async () => {
        if (!primaryName.trim()) return;

        setIsTranslating(true);
        try {
            const result = await translateText(
                primaryName.trim(),
                currentLang,
                otherLang
            );

            if (result.success) {
                setTranslatedName(result.translatedText);
                setShowTranslation(true);
            }
        } catch (error) {
            console.error('[CreateCategory] Retry translation failed:', error);
        } finally {
            setIsTranslating(false);
        }
    };

    // Get language labels
    const getPrimaryLabel = () => {
        return currentLang === 'vi' ? t('category.name_vietnamese') : t('category.name_english');
    };

    const getSecondaryLabel = () => {
        return currentLang === 'vi' ? t('category.name_english') : t('category.name_vietnamese');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <AppHeader title={t('category.create_category')} showBackButton />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Preview Icon */}
                    <View style={styles.iconPreview}>
                        <View style={[styles.iconCircle, { backgroundColor: iconColor }]}>
                            <AppIcon name={icon as any} size={normalize(33)} color="#fff" />
                        </View>
                    </View>

                    {/* Icon & Color Selector */}
                    <View style={styles.selectorRow}>
                        <TouchableOpacity
                            style={[styles.selectorCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                            onPress={handleSelectIcon}
                        >
                            <CustomText style={[styles.selectorLabel, { color: colors.text }]}>{t('category.icon')}</CustomText>
                            <View style={styles.selectorValue}>
                                <AppIcon name={icon as any} size={normalize(20)} color={colors.text} />
                                <AppIcon name="chevron-right" size={normalize(14)} color={colors.icon} />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.selectorCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                            onPress={handleSelectColor}
                        >
                            <CustomText style={[styles.selectorLabel, { color: colors.text }]}>{t('category.color')}</CustomText>
                            <View style={styles.selectorValue}>
                                <View style={[styles.colorDot, { backgroundColor: iconColor }]} />
                                <AppIcon name="chevron-right" size={normalize(14)} color={colors.icon} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Category Type Selector */}
                    <View style={styles.section}>
                        <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                            {t('category.category_type')} *
                        </CustomText>
                        <View style={styles.typeContainer}>
                            {[
                                { type: 'INCOME' as const, label: t('transaction.type_income') },
                                { type: 'EXPENSE' as const, label: t('transaction.type_expense') },
                            ].map(({ type, label }) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.typeButton,
                                        {
                                            backgroundColor: selectedType === type ? colors.tint : colors.card,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                    onPress={() => handleTypeChange(type)}
                                >
                                    <CustomText
                                        style={[
                                            styles.typeText,
                                            {
                                                color: selectedType === type ? '#fff' : colors.text,
                                            },
                                        ]}
                                        type={selectedType === type ? 'semiBold' : 'regular'}
                                    >
                                        {label}
                                    </CustomText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Primary Category Name (Current Language) */}
                    <View style={styles.section}>
                        <View style={styles.labelRow}>
                            <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                                {getPrimaryLabel()} *
                            </CustomText>
                            <View style={styles.langBadge}>
                                <CustomText style={styles.langBadgeText}>
                                    {currentLang.toUpperCase()}
                                </CustomText>
                            </View>
                        </View>
                        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder={currentLang === 'vi'
                                    ? "Ví dụ: Ăn uống, Giải trí, Lương..."
                                    : "E.g: Food, Entertainment, Salary..."
                                }
                                placeholderTextColor={colors.icon}
                                value={primaryName}
                                onChangeText={(text) => {
                                    setPrimaryName(text);
                                    setIsEditingTranslation(false);
                                }}
                            />
                            {isTranslating && (
                                <ActivityIndicator size="small" color={colors.tint} />
                            )}
                        </View>
                    </View>

                    {/* Translated Name (Other Language) - Show after primary name is entered */}
                    {showTranslation && primaryName.trim() && (
                        <View style={styles.section}>
                            <View style={styles.labelRow}>
                                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                                    {getSecondaryLabel()}
                                </CustomText>
                                <View style={[styles.langBadge, { backgroundColor: colors.border }]}>
                                    <CustomText style={[styles.langBadgeText, { color: colors.text }]}>
                                        {otherLang.toUpperCase()}
                                    </CustomText>
                                </View>
                                <TouchableOpacity
                                    style={styles.autoTranslateTag}
                                    onPress={handleRetryTranslation}
                                >
                                    <AppIcon name="language" size={normalize(14)} color={colors.tint} type="Ionicons" />
                                    <CustomText style={[styles.autoTranslateText, { color: colors.tint }]}>
                                        {t('category.auto_translated')}
                                    </CustomText>
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder={otherLang === 'vi'
                                        ? "Tên tiếng Việt..."
                                        : "English name..."
                                    }
                                    placeholderTextColor={colors.icon}
                                    value={translatedName}
                                    onChangeText={(text) => {
                                        setTranslatedName(text);
                                        setIsEditingTranslation(true);
                                    }}
                                />
                                {isEditingTranslation && (
                                    <TouchableOpacity
                                        onPress={handleRetryTranslation}
                                        style={styles.refreshButton}
                                    >
                                        <AppIcon name="refresh" size={normalize(18)} color={colors.tint} type="Ionicons" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <CustomText style={[styles.hintText, { color: colors.icon }]}>
                                {t('category.translation_hint')}
                            </CustomText>
                        </View>
                    )}

                    {/* Parent Category Selector - Optional */}
                    <View style={styles.section}>
                        <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                            {t('category.parent_category')}
                        </CustomText>
                        <TouchableOpacity
                            style={[
                                styles.field,
                                { backgroundColor: colors.card, borderColor: colors.border },
                            ]}
                            onPress={handleSelectParent}
                        >
                            <View style={styles.fieldLeft}>
                                {parentCategory ? (
                                    <>
                                        <View
                                            style={[
                                                styles.categoryIcon,
                                                { backgroundColor: parentCategory.color },
                                            ]}
                                        >
                                            <AppIcon
                                                name={parentCategory.icon as any}
                                                size={normalize(18)}
                                                color="#fff"
                                            />
                                        </View>
                                        <CustomText
                                            style={[styles.fieldText, { color: colors.text }]}
                                        >
                                            {parseCategoryName(parentCategory.category_name)}
                                        </CustomText>
                                    </>
                                ) : (
                                    <>
                                        <View
                                            style={[
                                                styles.categoryIcon,
                                                { backgroundColor: colors.border },
                                            ]}
                                        />
                                        <CustomText
                                            style={[styles.fieldText, { color: colors.icon }]}
                                        >
                                            {t('category.select_parent_optional')}
                                        </CustomText>
                                    </>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Bottom spacing */}
                    <View style={{ height: hp(2) }} />
                </ScrollView>

                {/* Bottom Buttons */}
                <View style={[styles.bottomButtons, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                    <TouchableOpacity
                        style={[styles.cancelButton, { borderColor: colors.border }]}
                        onPress={() => router.back()}
                        disabled={loading}
                    >
                        <CustomText style={[styles.cancelButtonText, { color: colors.text }]} type="semiBold">
                            {t('common.cancel')}
                        </CustomText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.createButton,
                            {
                                backgroundColor: colors.tint,
                                opacity: loading || !primaryName.trim() ? 0.5 : 1
                            }
                        ]}
                        onPress={handleCreate}
                        disabled={loading || !primaryName.trim()}
                    >
                        <CustomText style={styles.createButtonText} type="bold">
                            {loading ? t('category.creating') : t('category.create')}
                        </CustomText>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    iconPreview: {
        alignItems: 'center',
        paddingVertical: hp(3),
    },
    iconCircle: {
        width: normalize(80),
        height: normalize(80),
        borderRadius: normalize(20),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    selectorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        gap: normalize(12),
        marginTop: hp(1),
    },
    selectorCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: normalize(16),
        borderRadius: normalize(12),
        borderWidth: 1,
    },
    selectorLabel: {
        fontSize: normalize(15),
    },
    selectorValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(8),
    },
    colorDot: {
        width: normalize(24),
        height: normalize(24),
        borderRadius: normalize(12),
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    section: {
        paddingHorizontal: wp(5),
        marginTop: hp(2.5),
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: normalize(8),
        gap: normalize(8),
    },
    label: {
        fontSize: normalize(14),
        marginBottom: normalize(8),
    },
    langBadge: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: normalize(8),
        paddingVertical: normalize(2),
        borderRadius: normalize(4),
    },
    langBadgeText: {
        fontSize: normalize(11),
        fontWeight: '600',
        color: '#fff',
    },
    autoTranslateTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(4),
        marginLeft: 'auto',
    },
    autoTranslateText: {
        fontSize: normalize(12),
    },
    typeContainer: {
        flexDirection: 'row',
        gap: normalize(12),
    },
    typeButton: {
        flex: 1,
        paddingVertical: normalize(12),
        borderRadius: normalize(12),
        alignItems: 'center',
        borderWidth: 1,
    },
    typeText: {
        fontSize: normalize(15),
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: normalize(16),
        paddingVertical: normalize(14),
        borderRadius: normalize(12),
        borderWidth: 1,
        gap: normalize(8),
    },
    input: {
        flex: 1,
        fontSize: normalize(16),
        padding: 0,
        fontFamily: 'Quicksand-Regular',
    },
    refreshButton: {
        padding: normalize(4),
    },
    hintText: {
        fontSize: normalize(12),
        marginTop: normalize(6),
        fontStyle: 'italic',
    },
    field: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: normalize(16),
        paddingVertical: normalize(14),
        borderRadius: normalize(12),
        borderWidth: 1,
    },
    fieldLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(12),
        flex: 1,
    },
    categoryIcon: {
        width: normalize(36),
        height: normalize(36),
        borderRadius: normalize(10),
        alignItems: 'center',
        justifyContent: 'center',
    },
    fieldText: {
        fontSize: normalize(15),
    },
    bottomButtons: {
        flexDirection: 'row',
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
        gap: normalize(12),
        borderTopWidth: 1,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: normalize(14),
        borderRadius: normalize(12),
        alignItems: 'center',
        borderWidth: 1.5,
    },
    cancelButtonText: {
        fontSize: normalize(16),
    },
    createButton: {
        flex: 1,
        paddingVertical: normalize(14),
        borderRadius: normalize(12),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    createButtonText: {
        fontSize: normalize(16),
        color: '#fff',
    },
});

export default CreateCategoryScreen;
