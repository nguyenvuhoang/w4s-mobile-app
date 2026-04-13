import * as AuthSession from "expo-auth-session";
import * as FileSystem from "expo-file-system";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";

// Required for expo-auth-session on Android
WebBrowser.maybeCompleteAuthSession();

// ─── Constants ────────────────────────────────────────────────────────────────

const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"; // <-- thay bằng client ID của bạn

const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "email",
  "profile",
];

const STORE_KEY_TOKEN = "google_access_token";
const STORE_KEY_EMAIL = "google_user_email";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MimeType =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export interface DriveFile {
  /** URI từ expo-file-system, ví dụ: FileSystem.documentDirectory + "report.pdf" */
  uri: string;
  /** Tên file sẽ hiển thị trên Google Drive */
  fileName: string;
  /** Loại file */
  mimeType: MimeType;
}

export interface UploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
}

export interface UploadProgress {
  fileName: string;
  percent: number; // 0 → 100
}

export interface UseGoogleDriveExportReturn {
  googleEmail: string | null;
  isLinking: boolean;
  isUploading: boolean;
  error: string | null;
  /** Bắt đầu OAuth flow */
  linkGoogleAccount: () => Promise<void>;
  /** Huỷ liên kết và xoá token */
  unlinkGoogleAccount: () => Promise<void>;
  /**
   * Upload một hoặc nhiều file (PDF / Excel) lên Google Drive của người dùng.
   * @param files Danh sách file cần upload
   * @param onProgress Callback tiến trình (optional)
   */
  uploadToDrive: (
    files: DriveFile[],
    onProgress?: (progress: UploadProgress) => void
  ) => Promise<UploadResult[]>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGoogleDriveExport(): UseGoogleDriveExportReturn {
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const discovery = AuthSession.useAutoDiscovery("https://accounts.google.com");
  const redirectUri = AuthSession.makeRedirectUri();

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: SCOPES,
      redirectUri,
      usePKCE: true,
      responseType: AuthSession.ResponseType.Code,
    },
    discovery
  );

  // ── Khôi phục session khi app khởi động ───────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const savedToken = await SecureStore.getItemAsync(STORE_KEY_TOKEN);
        const savedEmail = await SecureStore.getItemAsync(STORE_KEY_EMAIL);
        if (savedToken) setAccessToken(savedToken);
        if (savedEmail) setGoogleEmail(savedEmail);
      } catch {}
    })();
  }, []);

  // ── Xử lý callback OAuth ──────────────────────────────────────────────────
  useEffect(() => {
    if (response?.type !== "success") return;

    (async () => {
      setIsLinking(true);
      setError(null);
      try {
        if (!discovery) {
          throw new Error("Không thể kết nối với dịch vụ Google (Discovery document missing).");
        }

        const { code } = response.params;

        if (!request?.codeVerifier) {
          throw new Error("Không tìm thấy mã xác thực (Code Verifier).");
        }

        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: GOOGLE_CLIENT_ID,
            redirectUri,
            code,
            extraParams: {
              code_verifier: request.codeVerifier,
            },
          },
          discovery!
        );

        const token = tokenResponse.accessToken;
        const userInfo = await fetchUserInfo(token);

        await SecureStore.setItemAsync(STORE_KEY_TOKEN, token);
        await SecureStore.setItemAsync(STORE_KEY_EMAIL, userInfo.email);

        setAccessToken(token);
        setGoogleEmail(userInfo.email);
      } catch (err: any) {
        setError(err?.message ?? "Đăng nhập Google thất bại");
      } finally {
        setIsLinking(false);
      }
    })();
  }, [response, request, discovery, redirectUri]);

  // ── linkGoogleAccount ─────────────────────────────────────────────────────
  const linkGoogleAccount = useCallback(async () => {
    setError(null);
    if (!request) return;
    await promptAsync();
  }, [request, promptAsync]);

  // ── unlinkGoogleAccount ───────────────────────────────────────────────────
  const unlinkGoogleAccount = useCallback(async () => {
    await SecureStore.deleteItemAsync(STORE_KEY_TOKEN);
    await SecureStore.deleteItemAsync(STORE_KEY_EMAIL);
    setAccessToken(null);
    setGoogleEmail(null);
  }, []);

  // ── uploadToDrive ─────────────────────────────────────────────────────────
  const uploadToDrive = useCallback(
    async (
      files: DriveFile[],
      onProgress?: (progress: UploadProgress) => void
    ): Promise<UploadResult[]> => {
      if (!accessToken) {
        throw new Error("Chưa liên kết tài khoản Google.");
      }

      setIsUploading(true);
      setError(null);
      const results: UploadResult[] = [];

      try {
        for (const file of files) {
          // 1. Đọc file từ expo-file-system → base64
          onProgress?.({ fileName: file.fileName, percent: 0 });

          const base64 = await new FileSystem.File(file.uri).base64();

          onProgress?.({ fileName: file.fileName, percent: 30 });

          // 2. Multipart upload lên Google Drive
          //    Part 1: metadata (tên file)
          //    Part 2: nội dung file (binary qua base64)
          const boundary = "expo_drive_boundary_" + Date.now();

          const metadata = JSON.stringify({
            name: file.fileName,
            mimeType: file.mimeType,
          });

          // Tạo body dạng multipart/related
          const body =
            `--${boundary}\r\n` +
            `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
            `${metadata}\r\n` +
            `--${boundary}\r\n` +
            `Content-Type: ${file.mimeType}\r\n` +
            `Content-Transfer-Encoding: base64\r\n\r\n` +
            `${base64}\r\n` +
            `--${boundary}--`;

          onProgress?.({ fileName: file.fileName, percent: 50 });

          const uploadRes = await fetch(
            "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": `multipart/related; boundary=${boundary}`,
              },
              body,
            }
          );

          onProgress?.({ fileName: file.fileName, percent: 90 });

          if (!uploadRes.ok) {
            const errBody = await uploadRes.json();
            throw new Error(
              errBody?.error?.message ?? `Upload thất bại: ${file.fileName}`
            );
          }

          const uploaded = await uploadRes.json();

          onProgress?.({ fileName: file.fileName, percent: 100 });

          results.push({
            fileId: uploaded.id,
            fileName: uploaded.name,
            webViewLink: uploaded.webViewLink,
          });
        }

        return results;
      } catch (err: any) {
        const message = err?.message ?? "Upload thất bại";
        setError(message);
        throw new Error(message);
      } finally {
        setIsUploading(false);
      }
    },
    [accessToken]
  );

  return {
    googleEmail,
    isLinking,
    isUploading,
    error,
    linkGoogleAccount,
    unlinkGoogleAccount,
    uploadToDrive,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchUserInfo(token: string): Promise<{ email: string }> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Không lấy được thông tin tài khoản Google");
  return res.json();
}