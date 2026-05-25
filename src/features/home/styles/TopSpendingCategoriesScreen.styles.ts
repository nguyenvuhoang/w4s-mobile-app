import { normalize, wp } from "@/utils/layout";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: normalize(100),
    },
    emptyText: {
        marginTop: normalize(12),
        fontSize: normalize(16),
    },
    listContent: {
        paddingHorizontal: wp(5),
        paddingBottom: normalize(20),
        paddingTop: normalize(16),
    },
});
