import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { Product } from "./typings/productTypings";

interface CartState {
  cart: Product[];
  addToCart: (product: Product) => void;
  removeFromCraft: (product: Product) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      (set, get) => ({
        cart: [],
        addToCart: (product) => {
          set((state) => {
            const currentCart = Array.isArray(state.cart) ? state.cart : [];
            const newCart = [...currentCart, product];
            return { cart: newCart };
          });
        },
        removeFromCraft: (product) => {
          const productToRemove = get().cart.findIndex(
            (p) => p.meta?.sku && product.meta?.sku && p.meta.sku === product.meta.sku
          );

          if (productToRemove === -1) {
            return; // Product not found in cart
          }

          set((state) => {
            const newCart = [...state.cart];
            newCart.splice(productToRemove, 1);
            return { cart: newCart };
          });
        },
        clearCart: () => {
          set({ cart: [] });
        },
      }),
      {
        name: "shopping-cart-storage",
        partialize: (state) => ({ cart: state.cart }),
        // Prevent rehydration from overwriting current state
        merge: (persistedState, currentState) => {
          if (currentState.cart && Array.isArray(currentState.cart) && currentState.cart.length > 0) {
            return currentState;
          }
          const persistedCart = (persistedState as any)?.cart || [];
          return {
            ...currentState,
            cart: persistedCart,
          };
        },
      }
    )
  )
);
