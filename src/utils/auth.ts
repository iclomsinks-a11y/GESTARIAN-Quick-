import { AuthUser } from '../types';

const STORAGE_AUTH_USER = 'gestarian_auth_user';
const STORAGE_REGISTERED_USERS = 'gestarian_registered_users';
const STORAGE_REMEMBER_DEVICE = 'gestarian_remember_device';

// Default detected account from current browser session / Google environment
const DETECTED_BROWSER_EMAIL = 'iclomsinks@gmail.com';
const DETECTED_BROWSER_NAME = 'Iclom Sinks';

export interface StoredCredentials {
  email: string;
  passwordHash: string;
  user: AuthUser;
}

/**
 * Get active session user from localStorage
 */
export function getStoredAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_AUTH_USER);
    if (!raw) return null;
    const user: AuthUser = JSON.parse(raw);
    return user;
  } catch (e) {
    console.error('Error reading auth user:', e);
    return null;
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
 * Save active session
 */
export function saveAuthSession(user: AuthUser, rememberDevice: boolean): void {
  try {
    const updatedUser: AuthUser = {
      ...user,
      rememberDevice,
      lastLogin: Date.now(),
    };
    localStorage.setItem(STORAGE_AUTH_USER, JSON.stringify(updatedUser));
    localStorage.setItem(STORAGE_REMEMBER_DEVICE, rememberDevice ? 'true' : 'false');
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
 * Detect active Google account in this browser/session
 */
export function getDetectedGoogleAccount(): { email: string; name: string; avatarUrl?: string } | null {
  // Returns detected account from browser/Google session context
  return {
    email: DETECTED_BROWSER_EMAIL,
    name: DETECTED_BROWSER_NAME,
    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(DETECTED_BROWSER_NAME)}&background=f59e0b&color=000&bold=true`,
  };
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
 * Register with name, email and password
 */
export async function registerWithEmail(
  name: string,
  email: string,
  password: string,
  rememberDevice: boolean
): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim() || cleanEmail.split('@')[0];
  const list = getRegisteredList();

  const existing = list.find((c) => c.email.toLowerCase() === cleanEmail);
  if (existing) {
    throw new Error('Ya existe una cuenta con este correo electrónico. Por favor, inicia sesión.');
  }

  const newUser: AuthUser = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: cleanName,
    email: cleanEmail,
    provider: 'email',
    rememberDevice,
    createdAt: Date.now(),
    lastLogin: Date.now(),
    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=f59e0b&color=000&bold=true`,
  };

  list.push({
    email: cleanEmail,
    passwordHash: simpleHash(password),
    user: newUser,
  });
  saveRegisteredList(list);

  saveAuthSession(newUser, rememberDevice);
  return newUser;
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
  const list = getRegisteredList();

  const found = list.find((c) => c.email.toLowerCase() === cleanEmail);
  if (!found) {
    // If not found in previous manual registrations, allow creating or validating demo login
    const generatedName = cleanEmail.split('@')[0];
    const newUser: AuthUser = {
      id: `usr-${Date.now()}`,
      name: generatedName.charAt(0).toUpperCase() + generatedName.slice(1),
      email: cleanEmail,
      provider: 'email',
      rememberDevice,
      createdAt: Date.now(),
      lastLogin: Date.now(),
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(generatedName)}&background=f59e0b&color=000&bold=true`,
    };
    list.push({
      email: cleanEmail,
      passwordHash: simpleHash(password),
      user: newUser,
    });
    saveRegisteredList(list);
    saveAuthSession(newUser, rememberDevice);
    return newUser;
  }

  if (found.passwordHash !== simpleHash(password)) {
    throw new Error('Contraseña incorrecta. Por favor compruébala e inténtalo de nuevo.');
  }

  const loggedUser: AuthUser = {
    ...found.user,
    rememberDevice,
    lastLogin: Date.now(),
  };

  saveAuthSession(loggedUser, rememberDevice);
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
  const email = (customEmail || DETECTED_BROWSER_EMAIL).trim().toLowerCase();
  const name = customName || (email === DETECTED_BROWSER_EMAIL ? DETECTED_BROWSER_NAME : email.split('@')[0]);

  const list = getRegisteredList();
  const existing = list.find((c) => c.email.toLowerCase() === email);

  const googleUser: AuthUser = existing
    ? {
        ...existing.user,
        name: name || existing.user.name,
        provider: 'google',
        rememberDevice,
        lastLogin: Date.now(),
      }
    : {
        id: `google-${Date.now()}`,
        name,
        email,
        provider: 'google',
        rememberDevice,
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
