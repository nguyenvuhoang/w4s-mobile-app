import { BASE_URL } from "@/core/api/ApiClient";
import * as signalR from "@microsoft/signalr";
import StorageService from "./StorageService";

const HUB_URL = `${BASE_URL}/signal`;

class SignalRService {
  private static instance: SignalRService;
  private connection: signalR.HubConnection | null = null;
  private connected = false;
  private isConnecting = false;
  private retryCount = 0;
  private readonly MAX_RETRIES = 5;
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;
  private isExplicitlyStopped = false;
  private eventHandlers = new Map<
    string,
    Map<(...args: any[]) => void, (...args: any[]) => void>
  >();

  private constructor() {}

  public static getInstance(): SignalRService {
    if (!SignalRService.instance) {
      SignalRService.instance = new SignalRService();
    }
    return SignalRService.instance;
  }

  private clearRetryTimer() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  public async initConnection(withToken: boolean = true) {
    this.clearRetryTimer();
    this.isExplicitlyStopped = false;

    if (this.connected || this.isConnecting) {
      if (__DEV__) console.log("⚡ SignalR already connected or connecting.");
      return;
    }

    if (
      this.connection &&
      this.connection.state === signalR.HubConnectionState.Connected
    ) {
      this.connected = true;
      return;
    }

    this.isConnecting = true;
    if (__DEV__) console.log("🚀 Initializing SignalR connection:", HUB_URL);

    if (!this.connection) {
      const options: signalR.IHttpConnectionOptions = {};

      if (withToken) {
        options.accessTokenFactory = async () => {
          const session = await StorageService.getUserSession();
          return session?.token || "";
        };
      }

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, options)
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(
          __DEV__ ? signalR.LogLevel.Information : signalR.LogLevel.None
        )
        .build();

      this.registerDefaultEvents();
    }

    try {
      await this.connection.start();
      this.connected = true;
      this.isConnecting = false;
      this.retryCount = 0;
      if (__DEV__) console.log("✅ SignalR connected successfully.");

      if (withToken) {
        const session = await StorageService.getUserSession();
        const token = session?.token ?? null;
        if (token) {
          await this.sendInitToken(token);
        }
      }
    } catch (err: any) {
      this.connected = false;
      this.isConnecting = false;
      if (__DEV__) console.warn("❌ Failed to connect SignalR:", err?.message || err);

      if (!this.isExplicitlyStopped && this.retryCount < this.MAX_RETRIES) {
        this.retryCount++;
        const backoffDelay = Math.min(
          2000 * Math.pow(2, this.retryCount - 1),
          30000
        );
        if (__DEV__) {
          console.log(
            `🔄 SignalR retry scheduled in ${backoffDelay / 1000}s (Attempt ${this.retryCount}/${this.MAX_RETRIES})`
          );
        }
        this.retryTimeout = setTimeout(() => {
          if (!this.isExplicitlyStopped) {
            this.initConnection(withToken);
          }
        }, backoffDelay);
      }
    }
  }

  private registerDefaultEvents() {
    if (!this.connection) return;

    this.connection.on("init", (token: string) => {
      if (__DEV__) console.log("📥 Received init from server:", token);
    });

    this.connection.onclose((err) => {
      if (__DEV__) console.warn("⚠️ SignalR connection closed:", err?.message);
      this.connected = false;
    });

    this.connection.onreconnecting((err) => {
      if (__DEV__) console.log("🔄 Reconnecting SignalR...", err?.message);
      this.connected = false;
    });

    this.connection.onreconnected((id) => {
      if (__DEV__) console.log("✅ SignalR reconnected:", id);
      this.connected = true;
      this.reinitAfterReconnect();
    });
  }

  private async reinitAfterReconnect() {
    const session = await StorageService.getUserSession();
    const token = session?.token ?? null;
    if (token) {
      await this.sendInitToken(token);
    }
  }

  public async sendInitToken(token: string) {
    if (!this.connection) return;
    if (__DEV__) console.log("📨 Sending init token to SignalR server.");
    try {
      await this.connection.invoke("init", token);
      if (__DEV__) {
        console.log(`🎯 Token ${token.slice(0, 10)}... registered successfully.`);
      }
    } catch (err) {
      if (__DEV__) console.warn("❌ Error sending init token:", err);
    }
  }

  public on(eventName: string, callback: (...args: any[]) => void) {
    if (!this.connection) return;

    let eventMap = this.eventHandlers.get(eventName);
    if (!eventMap) {
      eventMap = new Map();
      this.eventHandlers.set(eventName, eventMap);
    }

    const existingWrapper = eventMap.get(callback);
    if (existingWrapper) {
      this.connection.off(eventName, existingWrapper);
    }

    const wrapper = (...args: any[]) => {
      if (__DEV__) {
        console.log(`📩 [SignalR] Event: ${eventName}`, args);
      }
      callback(...args);
    };

    eventMap.set(callback, wrapper);
    this.connection.on(eventName, wrapper);
  }

  public off(eventName: string, callback?: (...args: any[]) => void) {
    if (!this.connection) return;
    if (callback) {
      const eventMap = this.eventHandlers.get(eventName);
      const wrapper = eventMap?.get(callback);
      if (wrapper) {
        this.connection.off(eventName, wrapper);
        eventMap?.delete(callback);
        if (eventMap && eventMap.size === 0) {
          this.eventHandlers.delete(eventName);
        }
      } else {
        this.connection.off(eventName, callback);
      }
    } else {
      this.connection.off(eventName);
      this.eventHandlers.delete(eventName);
    }
  }

  public async stop() {
    this.isExplicitlyStopped = true;
    this.clearRetryTimer();
    this.retryCount = 0;
    this.isConnecting = false;
    if (this.connection) {
      try {
        await this.connection.stop();
        if (__DEV__) console.log("🛑 SignalR stopped.");
      } catch {
        // ignore error during stopping
      }
      this.connected = false;
    }
  }

  public getConnectionState() {
    return this.connection?.state;
  }

  public isConnected() {
    return this.connected;
  }
}

const signalRService = SignalRService.getInstance();
export default signalRService;
