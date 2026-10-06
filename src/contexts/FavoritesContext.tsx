import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";

type FavoritesContextValue = {
  favoriteIds: string[];
  isFavorite: (listingId: string) => boolean;
  toggleFavorite: (listingId: string) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: PropsWithChildren) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(["notebook-2-quire"]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favoriteIds,
      isFavorite: (listingId) => favoriteIds.includes(listingId),
      toggleFavorite: (listingId) => {
        setFavoriteIds((current) =>
          current.includes(listingId)
            ? current.filter((id) => id !== listingId)
            : [...current, listingId]
        );
      }
    }),
    [favoriteIds]
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
