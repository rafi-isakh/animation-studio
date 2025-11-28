const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const DRIVE_UPLOAD_ENDPOINT =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

const DRIVE_SETTINGS_KEY = "driveApiSettings";

interface DriveSettingsData {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  folderId: string;
}

interface TokenData {
  accessToken: string;
  expiresAt: number;
}

let tokenData: TokenData | null = null;

export function getDriveSettings(): DriveSettingsData {
  const savedSettings = localStorage.getItem(DRIVE_SETTINGS_KEY);
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      if (
        parsed &&
        typeof parsed.clientId === "string" &&
        typeof parsed.clientSecret === "string" &&
        typeof parsed.refreshToken === "string" &&
        typeof parsed.folderId === "string"
      ) {
        return parsed;
      }
    } catch (e) {
      console.error("Failed to parse Drive settings from localStorage", e);
    }
  }
  return {
    clientId: "",
    clientSecret: "",
    refreshToken: "",
    folderId: "",
  };
}

async function getAccessToken(): Promise<string> {
  if (tokenData && Date.now() < tokenData.expiresAt) {
    return tokenData.accessToken;
  }

  const { clientId, clientSecret, refreshToken } = getDriveSettings();

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Google Drive API information has not been set. Please enter the API information in Drive settings and save."
    );
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Google authentication failed: ${errorData.error_description || response.statusText}`
    );
  }

  const data = await response.json();
  tokenData = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000, // 5분 버퍼
  };

  return tokenData.accessToken;
}

export async function uploadFileToDrive(
  fileBlob: Blob,
  fileName: string
): Promise<void> {
  const { folderId } = getDriveSettings();

  if (!folderId) {
    throw new Error(
      "Google Drive folder ID has not been set. Please enter the folder ID in Drive settings and save."
    );
  }

  const accessToken = await getAccessToken();

  const metadata = {
    name: fileName,
    parents: [folderId],
  };

  const formData = new FormData();
  formData.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  formData.append("file", fileBlob);

  const response = await fetch(DRIVE_UPLOAD_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Google Drive file upload failed (${fileName}): ${errorData.error?.message || response.statusText}`
    );
  }
}
