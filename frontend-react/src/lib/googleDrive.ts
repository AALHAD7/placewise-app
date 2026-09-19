// Google Drive resume upload - real OAuth (Google Identity Services) + the
// Google Picker API, not a stub. Requires a Google Cloud project with the
// "Google Picker API" enabled and an OAuth 2.0 Web client + API key, with
// this site's origin added to "Authorized JavaScript origins". Fill in the
// two values below from https://console.cloud.google.com/apis/credentials -
// until they're real, fromDrive() fails fast with a clear error instead of
// silently faking a filename. Ported verbatim from frontend/index.html
// lines 1873-1974 - port the fail-fast behavior exactly, don't stub it
// differently (see migration plan, Resume phase notes).

const GOOGLE_DRIVE_CLIENT_ID = "YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com";
const GOOGLE_DRIVE_API_KEY = "YOUR_GOOGLE_API_KEY";
const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

declare global {
  interface Window {
    gapi?: { load: (api: string, opts: { callback: () => void; onerror: (err: unknown) => void }) => void };
    google?: {
      accounts: { oauth2: { initTokenClient: (opts: { client_id: string; scope: string; callback: (resp: { error?: string; access_token: string }) => void }) => GoogleTokenClient } };
      picker: {
        DocsView: new (viewId: unknown) => { setMimeTypes: (mimeTypes: string) => unknown };
        ViewId: { DOCS: unknown };
        PickerBuilder: new () => GooglePickerBuilder;
        Action: { PICKED: string; CANCEL: string };
      };
    };
  }
}
interface GoogleTokenClient {
  callback: (resp: { error?: string; access_token: string }) => void;
  requestAccessToken: (opts: { prompt: string }) => void;
}
interface GoogleDriveDoc {
  id: string;
  name: string;
  mimeType: string;
}
interface GooglePickerBuilder {
  addView: (view: unknown) => GooglePickerBuilder;
  setOAuthToken: (token: string) => GooglePickerBuilder;
  setDeveloperKey: (key: string) => GooglePickerBuilder;
  setCallback: (cb: (data: { action: string; docs: GoogleDriveDoc[] }) => void) => GooglePickerBuilder;
  build: () => { setVisible: (visible: boolean) => void };
}

let _driveTokenClient: GoogleTokenClient | null = null;
let _drivePickerReady = false;
let _driveAccessToken: string | null = null;

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src="' + src + '"]')) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load " + src + " - check your connection."));
    document.head.appendChild(s);
  });
}

export async function ensureGoogleDriveReady(): Promise<void> {
  if (GOOGLE_DRIVE_CLIENT_ID.startsWith("YOUR_") || GOOGLE_DRIVE_API_KEY.startsWith("YOUR_")) {
    throw new Error("Google Drive isn't configured yet - add a Client ID and API key from Google Cloud Console.");
  }
  await Promise.all([loadScriptOnce("https://apis.google.com/js/api.js"), loadScriptOnce("https://accounts.google.com/gsi/client")]);
  if (!_drivePickerReady) {
    await new Promise<void>((resolve, reject) => window.gapi!.load("picker", { callback: resolve, onerror: reject }));
    _drivePickerReady = true;
  }
  if (!_driveTokenClient) {
    _driveTokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_DRIVE_CLIENT_ID,
      scope: GOOGLE_DRIVE_SCOPE,
      callback: () => {} // overridden per-request in requestDriveAccessToken()
    });
  }
}

export function requestDriveAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    _driveTokenClient!.callback = (resp) => {
      if (resp.error) return reject(new Error("Google Drive access was not granted."));
      _driveAccessToken = resp.access_token;
      resolve(resp.access_token);
    };
    _driveTokenClient!.requestAccessToken({ prompt: _driveAccessToken ? "" : "consent" });
  });
}

// Resolves with the picked Drive file's metadata, or null if the user closed
// the picker without choosing anything (not an error).
export function openDrivePicker(accessToken: string): Promise<GoogleDriveDoc | null> {
  return new Promise((resolve, reject) => {
    try {
      const view = new window.google!.picker.DocsView(window.google!.picker.ViewId.DOCS).setMimeTypes(
        ["application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.google-apps.document"].join(",")
      );
      const picker = new window.google!.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(accessToken)
        .setDeveloperKey(GOOGLE_DRIVE_API_KEY)
        .setCallback((data) => {
          if (data.action === window.google!.picker.Action.PICKED) resolve(data.docs[0]);
          else if (data.action === window.google!.picker.Action.CANCEL) resolve(null);
        })
        .build();
      picker.setVisible(true);
    } catch (err) {
      reject(err);
    }
  });
}

// Native Google Docs have no raw bytes to download - they're exported as
// plain text instead. Everything else (PDF/DOCX/TXT actually stored in
// Drive) is downloaded as-is and handed to the same /api/resume/upload
// parser the local-file path already uses, so there's exactly one parsing
// code path regardless of where the file came from.
export async function fetchDriveFileAsFile(doc: GoogleDriveDoc, accessToken: string): Promise<File> {
  const isGoogleDoc = doc.mimeType === "application/vnd.google-apps.document";
  const url = isGoogleDoc
    ? "https://www.googleapis.com/drive/v3/files/" + doc.id + "/export?mimeType=text%2Fplain"
    : "https://www.googleapis.com/drive/v3/files/" + doc.id + "?alt=media";
  const res = await fetch(url, { headers: { Authorization: "Bearer " + accessToken } });
  if (!res.ok) throw new Error('Could not download "' + doc.name + '" from Google Drive.');
  const blob = await res.blob();
  const name = isGoogleDoc ? (doc.name || "resume") + ".txt" : doc.name || "resume";
  return new File([blob], name, { type: blob.type });
}

export {};
