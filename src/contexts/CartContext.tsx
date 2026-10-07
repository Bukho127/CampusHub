import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";
import type { Listing } from "../models/marketplace";

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
  getQuantity: (listingId: string) => number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<CartItem[]>([]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((total, item) => total + item.quantity, 0);
    const subtotalCents = items.reduce((total, item) => total + item.listing.priceCents * item.quantity, 0);

    return {
      items,
      itemCount,
      subtotalCents,
      addItem: (listing) => {
        if (listing.type === "service") return;
        setItems((current) => {
          const existing = current.find((item) => item.listing.id === listing.id);
          if (existing) {
            return current.map((item) =>
              item.listing.id === listing.id
                ? { ...item, quantity: item.quantity + 1 }
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
      getQuantity: (listingId) => items.find((item) => item.listing.id === listingId)?.quantity ?? 0
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
