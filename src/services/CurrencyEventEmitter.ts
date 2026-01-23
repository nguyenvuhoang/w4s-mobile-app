type Listener = (currencyId: string) => void;

class CurrencyEventEmitter {
  private static instance: CurrencyEventEmitter;
  private listeners: Listener[] = [];

  private constructor() {}

  static getInstance(): CurrencyEventEmitter {
    if (!CurrencyEventEmitter.instance) {
      CurrencyEventEmitter.instance = new CurrencyEventEmitter();
    }
    return CurrencyEventEmitter.instance;
  }

  emitCurrencyChanged(currencyId: string) {
    console.log(
      "[CurrencyEventEmitter] Emitting currency changed:",
      currencyId,
    );
    this.listeners.forEach((listener) => {
      try {
        listener(currencyId);
      } catch (error) {
        console.error("[CurrencyEventEmitter] Listener error:", error);
      }
    });
  }

  onCurrencyChanged(callback: Listener) {
    console.log("[CurrencyEventEmitter] Listener registered");
    this.listeners.push(callback);
  }

  offCurrencyChanged(callback: Listener) {
    console.log("[CurrencyEventEmitter] Listener removed");
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  removeAllListeners() {
    console.log("[CurrencyEventEmitter] All listeners removed");
    this.listeners = [];
  }
}

export default CurrencyEventEmitter.getInstance();
