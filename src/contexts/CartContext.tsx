import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";
import type { Listing } from "../models/marketplace";
import { getEffectivePriceCents } from "../utils/pricing";

export type CartItem = {
  listing: Listing;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotalCents: number;
  addItem: (listing: Listing) => void;
  decrementItem: (listingId: string) => void;
  removeItem: (listingId: string) => void;
  clearCart: () => void;
  completeOrder: () => void;
  getAvailableQuantity: (listing: Listing) => number;
  getQuantity: (listingId: string) => number;
  isSoldOut: (listing: Listing) => boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [purchasedQuantities, setPurchasedQuantities] = useState<Record<string, number>>({});

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((total, item) => total + item.quantity, 0);
    const subtotalCents = items.reduce((total, item) => total + getEffectivePriceCents(item.listing) * item.quantity, 0);
    const getAvailableQuantity = (listing: Listing) => {
      if (listing.type === "service") return 0;
      if (listing.status === "sold") return 0;
      const listedQuantity = Number.isFinite(listing.quantityAvailable) ? listing.quantityAvailable : 1;
      return Math.max(0, listedQuantity - (purchasedQuantities[listing.id] ?? 0));
    };

    return {
      items,
      itemCount,
      subtotalCents,
      addItem: (listing) => {
        if (listing.type === "service") return;
        const availableQuantity = getAvailableQuantity(listing);
        if (availableQuantity <= 0) return;

        setItems((current) => {
          const existing = current.find((item) => item.listing.id === listing.id);
          if (existing) {
            return current.map((item) =>
              item.listing.id === listing.id
                ? { ...item, quantity: Math.min(item.quantity + 1, availableQuantity) }
                : item
            );
          }
          return [...current, { listing, quantity: 1 }];
        });
      },
      decrementItem: (listingId) => {
        setItems((current) =>
          current
            .map((item) => (item.listing.id === listingId ? { ...item, quantity: item.quantity - 1 } : item))
            .filter((item) => item.quantity > 0)
        );
      },
      removeItem: (listingId) => {
        setItems((current) => current.filter((item) => item.listing.id !== listingId));
      },
      clearCart: () => {
        setItems([]);
      },
      completeOrder: () => {
        setPurchasedQuantities((current) => {
          const next = { ...current };
          items.forEach((item) => {
            if (item.listing.type === "goods") {
              next[item.listing.id] = (next[item.listing.id] ?? 0) + item.quantity;
            }
          });
          return next;
        });
        setItems([]);
      },
      getAvailableQuantity,
      getQuantity: (listingId) => items.find((item) => item.listing.id === listingId)?.quantity ?? 0,
      isSoldOut: (listing) => listing.type === "goods" && getAvailableQuantity(listing) <= 0
    };
  }, [items, purchasedQuantities]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
