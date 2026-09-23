import { AuthUser } from '../types';

const STORAGE_AUTH_USER = 'gestarian_auth_user';
const STORAGE_REGISTERED_USERS = 'gestarian_registered_users';
const STORAGE_REMEMBER_DEVICE = 'gestarian_remember_device';
const STORAGE_APP_DOWNLOADED = 'gestarian_app_downloaded';
const STORAGE_SAVED_LOGIN_CREDENTIALS = 'gestarian_saved_login_credentials';

export interface StoredCredentials {
  email: string;
  dni?: string;
  passwordHash: string;
  user: AuthUser;
}

export interface SavedLoginCredentials {
  name: string;
  email: string;
  dni: string;
  savedAt: number;
  isAppDownloaded: boolean;
}

/**
 * Detect whether the application is running as a downloaded / installed PWA / standalone application
 */
export function isAppDownloadedOrStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const isStandaloneDisplay = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    const isIosStandalone = (window.navigator as any).standalone === true;
    const isAndroidTwa = document.referrer && document.referrer.includes('android-app://');
    const isExplicitlyDownloaded = localStorage.getItem(STORAGE_APP_DOWNLOADED) === 'true';

    return Boolean(isStandaloneDisplay || isIosStandalone || isAndroidTwa || isExplicitlyDownloaded);
  } catch (e) {
    return false;
  }
}

/**
 * Set explicit download / installation state
 */
export function setAppDownloadedState(downloaded: boolean): void {
  try {
    localStorage.setItem(STORAGE_APP_DOWNLOADED, downloaded ? 'true' : 'false');
  } catch (e) {
    console.error('Error saving app download state:', e);
  }
}

/**
 * Check if the user has chosen to remember this device
 */
export function isDeviceRemembered(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_REMEMBER_DEVICE);
    return raw === 'true';
  } catch (e) {
    return false;
  }
}

/**
 * Get active session user from localStorage
 * Auto-login: If the user chose to remember and the app is downloaded/standalone,
 * returns the logged-in user without asking again.
 */
export function getStoredAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_AUTH_USER);
    if (!raw) return null;
    const user: AuthUser = JSON.parse(raw);
    const isDownloaded = isAppDownloadedOrStandalone();

    // If device is remembered or app is downloaded, keep user logged in
    if (user.rememberDevice && isDownloaded) {
      return {
        ...user,
        isAppDownloaded: true,
      };
    }

    if (user.rememberDevice) {
      return user;
    }

    return user;
  } catch (e) {
    console.error('Error reading auth user:', e);
    return null;
  }
}

/**
 * Get saved login credentials for quick autofill / auto-access
 */
export function getSavedLoginCredentials(): SavedLoginCredentials | null {
  try {
    const raw = localStorage.getItem(STORAGE_SAVED_LOGIN_CREDENTIALS);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Save active session
 */
export function saveAuthSession(user: AuthUser, rememberDevice: boolean, rawDniOrPassword?: string): void {
  try {
    const isDownloaded = isAppDownloadedOrStandalone();
    const updatedUser: AuthUser = {
      ...user,
      dni: user.dni || rawDniOrPassword,
      rememberDevice,
      isAppDownloaded: isDownloaded,
      lastLogin: Date.now(),
    };
    localStorage.setItem(STORAGE_AUTH_USER, JSON.stringify(updatedUser));
    localStorage.setItem(STORAGE_REMEMBER_DEVICE, rememberDevice ? 'true' : 'false');

    if (rememberDevice) {
      const savedCreds: SavedLoginCredentials = {
        name: user.name,
        email: user.email,
        dni: user.dni || rawDniOrPassword || '',
        savedAt: Date.now(),
        isAppDownloaded: isDownloaded,
      };
      localStorage.setItem(STORAGE_SAVED_LOGIN_CREDENTIALS, JSON.stringify(savedCreds));
    }
  } catch (e) {
    console.error('Error saving auth session:', e);
  }
}

/**
 * Update the "remember in this device" preference explicitly
 */
export function setRememberDevice(remember: boolean): void {
  try {
    localStorage.setItem(STORAGE_REMEMBER_DEVICE, remember ? 'true' : 'false');
    const user = getStoredAuthUser();
    if (user) {
      user.rememberDevice = remember;
      localStorage.setItem(STORAGE_AUTH_USER, JSON.stringify(user));
    }
    if (!remember) {
      localStorage.removeItem(STORAGE_SAVED_LOGIN_CREDENTIALS);
    }
  } catch (e) {
    console.error('Error updating remember device:', e);
  }
}

/**
 * Clear current active session (Logout)
 */
export function logoutAuthUser(): void {
  try {
    localStorage.removeItem(STORAGE_AUTH_USER);
    localStorage.removeItem(STORAGE_REMEMBER_DEVICE);
    localStorage.removeItem(STORAGE_SAVED_LOGIN_CREDENTIALS);
  } catch (e) {
    console.error('Error logging out:', e);
  }
}

/**
 * Get all registered users in database
 */
function getRegisteredList(): StoredCredentials[] {
  try {
    const raw = localStorage.getItem(STORAGE_REGISTERED_USERS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

/**
 * Save registered list
 */
function saveRegisteredList(list: StoredCredentials[]): void {
  try {
    localStorage.setItem(STORAGE_REGISTERED_USERS, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving registered list:', e);
  }
}

/**
 * Detect active Google account in this browser/session if saved locally
 */
export function getDetectedGoogleAccount(): { email: string; name: string; avatarUrl?: string } | null {
  try {
    const creds = getSavedLoginCredentials();
    if (creds && creds.email) {
      return {
        email: creds.email,
        name: creds.name || creds.email.split('@')[0],
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(creds.name || creds.email)}&background=f59e0b&color=000&bold=true`,
      };
    }
    const rawAuth = localStorage.getItem(STORAGE_AUTH_USER);
    if (rawAuth) {
      const user: AuthUser = JSON.parse(rawAuth);
      if (user && user.email) {
        return {
          email: user.email,
          name: user.name || user.email.split('@')[0],
          avatarUrl: user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=f59e0b&color=000&bold=true`,
        };
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Simple hash helper
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash)}`;
}

/**
 * Format and sanitize DNI / CIF / NIE
 */
export function formatDni(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Authenticate with User name, Email and Password (DNI/NIF)
 * Allows registering on first attempt or logging in with matching credentials.
 */
export async function authenticateWithDniAndEmail(
  name: string,
  email: string,
  dniOrPassword: string,
  rememberDevice: boolean
): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanDni = formatDni(dniOrPassword);
  const cleanName = name.trim() || cleanEmail.split('@')[0];

  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Por favor, introduce una dirección de correo electrónico válida.');
  }

  if (!cleanDni || cleanDni.length < 4) {
    throw new Error('Por favor, introduce una contraseña o DNI/NIF válido.');
  }

  const list = getRegisteredList();
  const foundByEmail = list.find((c) => c.email.toLowerCase() === cleanEmail);

  if (foundByEmail) {
    // Verify password hash or DNI match
    const isHashMatch = foundByEmail.passwordHash === simpleHash(cleanDni);
    const isDniMatch = foundByEmail.dni && formatDni(foundByEmail.dni) === cleanDni;

    if (!isHashMatch && !isDniMatch) {
      throw new Error('Contraseña o DNI incorrecto para este correo electrónico.');
    }

    const isDownloaded = isAppDownloadedOrStandalone();
    const loggedUser: AuthUser = {
      ...foundByEmail.user,
      name: cleanName || foundByEmail.user.name,
      dni: cleanDni,
      provider: 'dni',
      rememberDevice,
      isAppDownloaded: isDownloaded,
      lastLogin: Date.now(),
    };

    saveAuthSession(loggedUser, rememberDevice, cleanDni);
    return loggedUser;
  }

  // Create new user with DNI / Email credentials
  const isDownloaded = isAppDownloadedOrStandalone();
  const newUser: AuthUser = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: cleanName,
    email: cleanEmail,
    dni: cleanDni,
    provider: 'dni',
    rememberDevice,
    isAppDownloaded: isDownloaded,
    createdAt: Date.now(),
    lastLogin: Date.now(),
    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=f59e0b&color=000&bold=true`,
  };

  list.push({
    email: cleanEmail,
    dni: cleanDni,
    passwordHash: simpleHash(cleanDni),
    user: newUser,
  });
  saveRegisteredList(list);

  saveAuthSession(newUser, rememberDevice, cleanDni);
  return newUser;
}

/**
 * Register with name, email and password
 */
export async function registerWithEmail(
  name: string,
  email: string,
  password: string,
  rememberDevice: boolean
): Promise<AuthUser> {
  return authenticateWithDniAndEmail(name, email, password, rememberDevice);
}

/**
 * Login with email and password
 */
export async function loginWithEmail(
  email: string,
  password: string,
  rememberDevice: boolean
): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanDni = formatDni(password);
  const list = getRegisteredList();
  const found = list.find((c) => c.email.toLowerCase() === cleanEmail);

  if (!found) {
    // If not registered yet, auto-register
    const generatedName = cleanEmail.split('@')[0];
    return authenticateWithDniAndEmail(generatedName, cleanEmail, cleanDni, rememberDevice);
  }

  if (found.passwordHash !== simpleHash(cleanDni) && found.dni !== cleanDni) {
    throw new Error('Email o CIF/DNI incorrecto.');
  }

  const isDownloaded = isAppDownloadedOrStandalone();
  const loggedUser: AuthUser = {
    ...found.user,
    dni: cleanDni,
    rememberDevice,
    isAppDownloaded: isDownloaded,
    lastLogin: Date.now(),
  };

  saveAuthSession(loggedUser, rememberDevice, cleanDni);
  return loggedUser;
}

/**
 * Login or Sign Up with Google (instant 1-click or detected account)
 */
export async function loginWithGoogle(
  customEmail?: string,
  customName?: string,
  rememberDevice: boolean = true
): Promise<AuthUser> {
  const email = (customEmail || '').trim().toLowerCase();
  if (!email) {
    throw new Error('Por favor introduce una dirección de correo para acceder.');
  }
  const name = customName || email.split('@')[0];

  const list = getRegisteredList();
  const existing = list.find((c) => c.email.toLowerCase() === email);

  const isDownloaded = isAppDownloadedOrStandalone();
  const googleUser: AuthUser = existing
    ? {
        ...existing.user,
        name: name || existing.user.name,
        provider: 'google',
        rememberDevice,
        isAppDownloaded: isDownloaded,
        lastLogin: Date.now(),
      }
    : {
        id: `google-${Date.now()}`,
        name,
        email,
        provider: 'google',
        rememberDevice,
        isAppDownloaded: isDownloaded,
        createdAt: Date.now(),
        lastLogin: Date.now(),
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f59e0b&color=000&bold=true`,
      };

  if (!existing) {
    list.push({
      email,
      passwordHash: 'google_oauth_auth',
      user: googleUser,
    });
    saveRegisteredList(list);
  }

  saveAuthSession(googleUser, rememberDevice);
  return googleUser;
}
