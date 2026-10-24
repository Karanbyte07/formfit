import React, { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { AppState, Slot } from '../types'
import { appReducer, INITIAL_STATE, type AppAction } from './reducer'

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  activeSlot: Slot
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE)
  const activeSlot = state.slots[state.activeSlot]

  return (
    <AppContext.Provider value={{ state, dispatch, activeSlot }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export function useActiveSlot(): Slot {
  return useApp().activeSlot
}
