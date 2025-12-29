import { BASE_URL } from "@/core/api/ApiClient";
import * as signalR from "@microsoft/signalr";
import StorageService from "./StorageService";

const HUB_URL = `${BASE_URL}/signal`;

class SignalRService {
  private static instance: SignalRService;
  private connection: signalR.HubConnection | null = null;
  private connected = false;

  private constructor() {}

  public static getInstance(): SignalRService {
    if (!SignalRService.instance) {
      SignalRService.instance = new SignalRService();
    }
    return SignalRService.instance;
  }

  public async initConnection(withToken: boolean = true) {
    if (this.connection && this.connected) {
      console.log("⚡ SignalR already connected.");
      return;
    }

    console.log("🚀 Initializing SignalR connection:", HUB_URL);

    const options: signalR.IHttpConnectionOptions = {};

    if (withToken) {
      options.accessTokenFactory = async () => {
        const session = await StorageService.getUserSession();
        const token = session?.token ?? null;
        if (token) {
          console.log("🔑 Providing token for SignalR connection.");
        } else {
          console.log("⚠️ No token found for authenticated connection.");
        }
        return token || "";
      };
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, options)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Debug)
      .build();
    
    this.registerDefaultEvents();

    try {
      await this.connection.start();
      this.connected = true;
      console.log("✅ SignalR connected successfully.");

      if (withToken) {
        const session = await StorageService.getUserSession();
        const token = session?.token ?? null;
        if (token) {
          await this.sendInitToken(token);
        }
      }
    } catch (err) {
      console.error("❌ Failed to connect SignalR:", err);
      this.connected = false;
      // retry sau 5s
      setTimeout(() => this.initConnection(withToken), 5000);
    }
  }

  private registerDefaultEvents() {
    if (!this.connection) return;

    this.connection.on("init", (token: string) => {
        console.log("📥 Received init from server:", token);
    });

    this.connection.onclose((err) => {
      console.warn("⚠️ SignalR connection closed:", err?.message);
      this.connected = false;
    });

    this.connection.onreconnecting((err) => {
      console.log("🔄 Reconnecting SignalR...", err?.message);
      this.connected = false;
    });

    this.connection.onreconnected((id) => {
      console.log("✅ SignalR reconnected:", id);
      this.connected = true;
      // Gửi lại token nếu có
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
    console.log("📨 Sending init token to SignalR server.");
    try {
        console.log(` Token: ${token}`);
      await this.connection.invoke("init", token);
      console.log(`🎯 Token ${token.slice(0, 10)}... registered successfully.`);
    } catch (err) {
      console.error("❌ Error sending init token:", err);
    }
  }

  public on(eventName: string, callback: (...args: any[]) => void) {
    if (!this.connection) return;
    this.connection.on(eventName, callback);
  }

  public off(eventName: string) {
    if (!this.connection) return;
    this.connection.off(eventName);
  }

  public async stop() {
    if (this.connection && this.connected) {
      await this.connection.stop();
      console.log("🛑 SignalR stopped.");
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
