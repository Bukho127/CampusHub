import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from "react";
import { addFavoriteApi, getFavoriteIdsApi, removeFavoriteApi } from "../api/favoritesApi";
import { useAuth } from "./AuthContext";

type FavoritesContextValue = {
  favoriteIds: string[];
  isFavorite: (listingId: string) => boolean;
  toggleFavorite: (listingId: string) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: PropsWithChildren) {
  const { token } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const pendingIds = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;

    if (!token) {
      setFavoriteIds([]);
      return () => {
        cancelled = true;
      };
    }

    getFavoriteIdsApi(token)
      .then((ids) => {
        if (!cancelled) setFavoriteIds(ids);
      })
      .catch(() => {
        if (!cancelled) setFavoriteIds([]);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favoriteIds,
      isFavorite: (listingId) => favoriteIds.includes(listingId),
      toggleFavorite: (listingId) => {
        if (pendingIds.current.has(listingId)) return;

        pendingIds.current.add(listingId);
        const wasFavorite = favoriteIds.includes(listingId);
        setFavoriteIds((current) =>
          wasFavorite ? current.filter((id) => id !== listingId) : [...current, listingId]
        );

        if (!token) {
          pendingIds.current.delete(listingId);
          return;
        }

        const request = wasFavorite
          ? removeFavoriteApi(listingId, token)
          : addFavoriteApi(listingId, token);

        void request
          .catch(() => {
            setFavoriteIds((current) => {
              const isCurrentlyFavorite = current.includes(listingId);
              if (wasFavorite && !isCurrentlyFavorite) return [...current, listingId];
              if (!wasFavorite && isCurrentlyFavorite) return current.filter((id) => id !== listingId);
              return current;
            });
          })
          .finally(() => pendingIds.current.delete(listingId));
      }
    }),
    [favoriteIds, token]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used inside FavoritesProvider");
  }
  return context;
}
