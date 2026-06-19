import { useEffect, useRef, useState } from 'react'
import { readStorage, readStorageSync, writeStorage } from '../services/storage'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const initialValueRef = useRef(initialValue)
  const [value, setValue] = useState<T>(() => readStorageSync(key, initialValueRef.current))

  useEffect(() => {
    let mounted = true
    readStorage(key, initialValueRef.current).then((storedValue) => {
      if (mounted) setValue(storedValue)
    })
    return () => {
      mounted = false
    }
  }, [key])

  useEffect(() => {
    writeStorage(key, value)
  }, [key, value])

  return [value, setValue] as const
}
