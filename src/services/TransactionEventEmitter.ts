type Listener = () => void;

class TransactionEventEmitter {
  private static instance: TransactionEventEmitter;
  private listeners: Listener[] = [];

  private constructor() {}

  static getInstance(): TransactionEventEmitter {
    if (!TransactionEventEmitter.instance) {
      TransactionEventEmitter.instance = new TransactionEventEmitter();
    }
    return TransactionEventEmitter.instance;
  }

  /**
   * Emit event when a transaction is created, updated, or deleted
   */
  emitTransactionChanged() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        console.error("[TransactionEventEmitter] Listener error:", error);
      }
    });
  }

  onTransactionChanged(callback: Listener) {
    this.listeners.push(callback);
  }

  offTransactionChanged(callback: Listener) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  removeAllListeners() {
    this.listeners = [];
  }
}

export default TransactionEventEmitter.getInstance();
