import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { Product } from "./typings/productTypings";
// import type {} from '@redux-devtools/extension' // required for devtools typing

interface CartState {
  cart: Product[];
  addToCart: (product: Product) => void;
  removeFromCraft: (product: Product) => void;
}

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      (set, get) => ({
        cart: [],
        addToCart: (product) => {
          set((state) => ({
            cart: [...state.cart, product],
          }));
        },
        removeFromCraft: (product) => {
          const productToRemove = get().cart.findIndex(
            (p) => p.meta.sku === product.meta.sku
          );

          set((state) => {
            const newCart = [...state.cart];
            newCart.splice(productToRemove, 1);
            return { cart: newCart };
          });
        },
      }),
      {
        name: "shopping-cart-storage",
      }
    )
  )
);
