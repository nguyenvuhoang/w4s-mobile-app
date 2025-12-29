import React, { createContext, useContext, useRef } from "react";

type CallbackFn = (...args: any[]) => void;
type CallbackRegistry = Record<string, CallbackFn>;

const CallbackContext = createContext<{
  setCallback: (key: string, cb: CallbackFn) => void;
  runCallback: (key: string, ...args: any[]) => void;
  removeCallback: (key: string) => void;
}>({
  setCallback: () => {},
  runCallback: () => {},
  removeCallback: () => {},
});

export const CallbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const callbackMap = useRef<CallbackRegistry>({});

  const setCallback = (key: string, cb: CallbackFn) => {
    callbackMap.current[key] = cb;
  };

  const runCallback = (key: string, ...args: any[]) => {
    const cb = callbackMap.current[key];
    if (cb) {
      cb(...args);
      delete callbackMap.current[key]; 
    }
  };

  const removeCallback = (key: string) => {
    delete callbackMap.current[key];
  };

  return (
    <CallbackContext.Provider value={{ setCallback, runCallback, removeCallback }}>
      {children}
    </CallbackContext.Provider>
  );
};

export const useCallbackRegistry = () => useContext(CallbackContext);
