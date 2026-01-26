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
    this.listeners.forEach((listener) => {
      try {
        listener(currencyId);
      } catch (error) {
        console.error("[CurrencyEventEmitter] Listener error:", error);
      }
    });
  }

  onCurrencyChanged(callback: Listener) {
    this.listeners.push(callback);
  }

  offCurrencyChanged(callback: Listener) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  removeAllListeners() {
    this.listeners = [];
  }
}

export default CurrencyEventEmitter.getInstance();
