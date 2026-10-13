import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getStoredPrivacyMode,
  PRIVACY_MODE_STORAGE_KEY,
  storePrivacyMode,
} from "../privacyPreference";

export type PrivacyContextValue = {
  /** Privacy mode is switched on in Settings. */
  enabled: boolean;
  /** Figures must be hidden right now: the mode is on and not revealed. */
  hidden: boolean;
  setEnabled: (enabled: boolean) => void;
  reveal: () => void;
  hide: () => void;
};

// Components rendered without a provider (isolated unit tests) behave as if
// Privacy mode were off.
const PrivacyContext = createContext<PrivacyContextValue>({
  enabled: false,
  hidden: false,
  setEnabled: () => undefined,
  reveal: () => undefined,
  hide: () => undefined,
});

type PrivacyProviderProps = {
  children: React.ReactNode;
};

/**
 * Holds Privacy mode for the whole app. The switch is read from and written to
 * localStorage only (../privacyPreference.ts); whether the figures are
 * currently revealed is in memory only, so every launch starts hidden. A
 * reveal also ends when the page is sent to the background.
 * (design/features/privacy-mode/ui/decision.md)
 */
export const PrivacyProvider = ({ children }: PrivacyProviderProps) => {
  const [enabled, setEnabledState] = useState<boolean>(getStoredPrivacyMode);
  const [revealed, setRevealed] = useState(false);

  const setEnabled = useCallback((nextEnabled: boolean) => {
    storePrivacyMode(nextEnabled);
    setEnabledState(nextEnabled);
    setRevealed(false);
  }, []);
  const reveal = useCallback(() => setRevealed(true), []);
  const hide = useCallback(() => setRevealed(false), []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") setRevealed(false);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // A change made in another tab follows here too.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === PRIVACY_MODE_STORAGE_KEY) {
        setEnabledState(getStoredPrivacyMode());
        setRevealed(false);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = useMemo(
    () => ({
      enabled,
      hidden: enabled && !revealed,
      setEnabled,
      reveal,
      hide,
    }),
    [enabled, revealed, setEnabled, reveal, hide]
  );

  return (
    <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>
  );
};

export const usePrivacy = (): PrivacyContextValue =>
  useContext(PrivacyContext);
