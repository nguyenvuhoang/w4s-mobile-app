import CurrencyEventEmitter from "@/services/CurrencyEventEmitter";
import TransactionEventEmitter from "@/services/TransactionEventEmitter";
import { NavigationContext } from "@react-navigation/native";
import { useContext, useEffect, useRef } from "react";

interface UseLazyRefreshOptions {
  transaction?: boolean;
  currency?: boolean;
  onInvalidate?: () => void;
}

/**
 * Mark-dirty & lazy refetch on focus:
 * - Clears/invalidates cache immediately when events fire.
 * - Refetches right away ONLY if the screen is currently focused; otherwise marks dirty
 *   and refetches once when the user next focuses/returns to this screen.
 */
export const useLazyRefreshOnEvents = (
  onRefresh: () => void,
  options: UseLazyRefreshOptions = {}
) => {
  const { transaction = true, currency = true, onInvalidate } = options;
  const navigation = useContext(NavigationContext);

  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const onInvalidateRef = useRef(onInvalidate);
  onInvalidateRef.current = onInvalidate;

  const needsRefreshRef = useRef(false);

  useEffect(() => {
    const handleEvent = () => {
      onInvalidateRef.current?.();

      const isFocused = navigation ? navigation.isFocused() : true;
      if (isFocused) {
        needsRefreshRef.current = false;
        onRefreshRef.current();
      } else {
        needsRefreshRef.current = true;
      }
    };

    if (transaction) {
      TransactionEventEmitter.onTransactionChanged(handleEvent);
    }
    if (currency) {
      CurrencyEventEmitter.onCurrencyChanged(handleEvent);
    }

    const unsubscribeFocus = navigation?.addListener("focus", () => {
      if (needsRefreshRef.current) {
        needsRefreshRef.current = false;
        onRefreshRef.current();
      }
    });

    return () => {
      if (transaction) {
        TransactionEventEmitter.offTransactionChanged(handleEvent);
      }
      if (currency) {
        CurrencyEventEmitter.offCurrencyChanged(handleEvent);
      }
      unsubscribeFocus?.();
    };
  }, [navigation, transaction, currency]);
};
