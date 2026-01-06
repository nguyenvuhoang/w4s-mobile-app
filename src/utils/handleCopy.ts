import { normalize } from "@/utils/layout";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";

export const handleCopy = async (value: string) => {
    await Clipboard.setStringAsync(value);
    Toast.show({
        type: "success",
        position: "bottom",
        text1: "Copied Successfully",
        visibilityTime: 3000,
        autoHide: true,
        bottomOffset: normalize(50),
    });
};