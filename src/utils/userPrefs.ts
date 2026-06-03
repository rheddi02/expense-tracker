const PREFS_KEY = "user-prefs";

type UserPrefs = {
  debtTransactions: boolean;
};

const DEFAULTS: UserPrefs = { debtTransactions: false };

export function getUserPrefs(): UserPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function setUserPref<K extends keyof UserPrefs>(key: K, value: UserPrefs[K]) {
  const current = getUserPrefs();
  localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, [key]: value }));
}
