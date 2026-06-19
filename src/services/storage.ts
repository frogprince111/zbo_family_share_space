import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { defaultMembers } from '../data/defaultMembers'
import type { FamilyMember, FamilyProfile } from '../types/member'

export const STORAGE_VERSION = 1

export type AppStorageSnapshot = {
  version: number
  members: unknown[]
  todos: unknown[]
  schedules: unknown[]
  lists: unknown[]
  albums: unknown[]
  financeRecords: unknown[]
  settings: Record<string, unknown>
}

const storageKeys = {
  members: 'family-members',
  todos: 'family-todos',
  schedules: 'family-schedule-events',
  lists: 'family-list-items',
  albumFolders: 'family-album-folders',
  albumPhotos: 'family-album-photos',
  financeRecords: 'family-finance-bills',
  settings: 'family-profile',
}

function isNativeApp() {
  return Capacitor.isNativePlatform()
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function readStorageSync<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    return safeParse(window.localStorage.getItem(key), fallback)
  } catch {
    return fallback
  }
}

export async function readStorage<T>(key: string, fallback: T): Promise<T> {
  try {
    if (isNativeApp()) {
      const result = await Preferences.get({ key })
      if (result.value) return safeParse(result.value, fallback)
    }
  } catch {
    // Fall back to localStorage below.
  }
  return readStorageSync(key, fallback)
}

export async function writeStorage<T>(key: string, value: T) {
  const serialized = JSON.stringify(value)
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, serialized)
  } catch {
    // Ignore write failures so the app does not white-screen.
  }
  try {
    if (isNativeApp()) await Preferences.set({ key, value: serialized })
  } catch {
    // Preferences failures should not break the UI.
  }
}

export async function clearAllData() {
  try {
    if (typeof window !== 'undefined') window.localStorage.clear()
  } catch {
    // Ignore clear failures.
  }
  try {
    if (isNativeApp()) await Preferences.clear()
  } catch {
    // Ignore clear failures.
  }
}

export const getMembers = () => readStorage<FamilyMember[]>(storageKeys.members, defaultMembers)
export const saveMembers = (members: FamilyMember[]) => writeStorage(storageKeys.members, members)
export const getTodos = <T>(fallback: T) => readStorage<T>(storageKeys.todos, fallback)
export const saveTodos = <T>(todos: T) => writeStorage(storageKeys.todos, todos)
export const getSchedules = <T>(fallback: T) => readStorage<T>(storageKeys.schedules, fallback)
export const saveSchedules = <T>(schedules: T) => writeStorage(storageKeys.schedules, schedules)
export const getLists = <T>(fallback: T) => readStorage<T>(storageKeys.lists, fallback)
export const saveLists = <T>(lists: T) => writeStorage(storageKeys.lists, lists)
export const getFinanceRecords = <T>(fallback: T) => readStorage<T>(storageKeys.financeRecords, fallback)
export const saveFinanceRecords = <T>(records: T) => writeStorage(storageKeys.financeRecords, records)
export const getSettings = (fallback: FamilyProfile) => readStorage<FamilyProfile>(storageKeys.settings, fallback)
export const saveSettings = (settings: FamilyProfile) => writeStorage(storageKeys.settings, settings)

export async function getStorageSnapshot(): Promise<AppStorageSnapshot> {
  return {
    version: STORAGE_VERSION,
    members: await readStorage(storageKeys.members, []),
    todos: await readStorage(storageKeys.todos, []),
    schedules: await readStorage(storageKeys.schedules, []),
    lists: await readStorage(storageKeys.lists, []),
    albums: [
      await readStorage(storageKeys.albumFolders, []),
      await readStorage(storageKeys.albumPhotos, []),
    ],
    financeRecords: await readStorage(storageKeys.financeRecords, []),
    settings: await readStorage(storageKeys.settings, {}),
  }
}
