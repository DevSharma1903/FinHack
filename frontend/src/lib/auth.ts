export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type StoredUser = AuthUser & {
  password: string;
};

type DemoCredential = {
  email: string;
  password: string;
  name: string;
};

const USERS_KEY = "finhack_auth_users_v1";
const SESSION_KEY = "finhack_auth_session_user_id_v1";

export const DEMO_CREDENTIALS: DemoCredential[] = [
  { name: "Admin", email: "admin@finhack.dev", password: "admin123" },
  { name: "Demo User", email: "demo@finhack.dev", password: "demo123" },
  { name: "Analyst", email: "analyst@finhack.dev", password: "analyst123" },
];

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function getStoredUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];

  const users = safeJsonParse<StoredUser[]>(localStorage.getItem(USERS_KEY), []);
  return Array.isArray(users) ? users : [];
}

function setStoredUsers(users: StoredUser[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function ensureSeedUsers() {
  if (typeof window === "undefined") return;

  const existing = getStoredUsers();
  if (existing.length > 0) return;

  const seeded: StoredUser[] = DEMO_CREDENTIALS.map((u) => ({
    id: newId(),
    name: u.name,
    email: u.email.toLowerCase(),
    password: u.password,
  }));

  setStoredUsers(seeded);
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  ensureSeedUsers();

  const userId = localStorage.getItem(SESSION_KEY);
  if (!userId) return null;

  const user = getStoredUsers().find((u) => u.id === userId);
  if (!user) return null;

  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export function isAuthenticated() {
  return !!getCurrentUser();
}

function setSessionUserId(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, userId);
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function login(email: string, password: string): AuthUser {
  ensureSeedUsers();

  const normalizedEmail = email.trim().toLowerCase();
  const user = getStoredUsers().find((u) => u.email === normalizedEmail);

  if (!user || user.password !== password) {
    throw new Error("Invalid email or password");
  }

  setSessionUserId(user.id);

  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export function signup(name: string, email: string, password: string): AuthUser {
  ensureSeedUsers();

  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Name is required");
  }

  if (!normalizedEmail) {
    throw new Error("Email is required");
  }

  if (!password) {
    throw new Error("Password is required");
  }

  const users = getStoredUsers();
  const existing = users.find((u) => u.email === normalizedEmail);
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const newUser: StoredUser = {
    id: newId(),
    name: trimmedName,
    email: normalizedEmail,
    password,
  };

  users.push(newUser);
  setStoredUsers(users);
  setSessionUserId(newUser.id);

  const { password: _password, ...safeUser } = newUser;
  return safeUser;
}
