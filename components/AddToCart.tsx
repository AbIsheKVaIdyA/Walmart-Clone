"use client";

import { useMemo, useState, useEffect } from "react";
import { useCartStore } from "@/store";
import { useAuthStore } from "@/store/authStore";
import { Product } from "@/typings/productTypings";
import { Button } from "./ui/button";
import RemoveFromCart from "./RemoveFromCart";
import { LoginDialog } from "./auth/LoginDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

function AddToCart({ product }: { product: Product }) {
  const cart = useCartStore((state) => state.cart);
  const addToCart = useCartStore((state) => state.addToCart);
  const { isAuthenticated } = useAuthStore();
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  // Close login dialog when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && showLoginDialog) {
      setShowLoginDialog(false);
    }
  }, [isAuthenticated, showLoginDialog]);

  // Ensure product has all required fields before adding to cart
  const ensureProductMeta = (prod: Product): Product => {
    // Create a copy to avoid mutating the original
    const productCopy = { ...prod };
    
    // Ensure meta exists
    if (!productCopy.meta) {
      productCopy.meta = { sku: "", gtin: "" };
    }
    
    // Generate SKU if missing
    if (!productCopy.meta.sku) {
      const urlParts = productCopy.url?.split('/') || [];
      const productId = urlParts[urlParts.length - 1] || productCopy.url || `product-${Date.now()}`;
      productCopy.meta.sku = productId.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 50);
    }
    
    // Ensure other required fields
    if (!productCopy.meta.gtin) {
      productCopy.meta.gtin = productCopy.meta.sku;
    }
    
    // Ensure images array exists
    if (!productCopy.images || !Array.isArray(productCopy.images)) {
      productCopy.images = [];
    }
    
    // Ensure price is a number
    if (typeof productCopy.price !== 'number') {
      productCopy.price = 0;
    }
    
    // Ensure currency exists
    if (!productCopy.currency) {
      productCopy.currency = "$";
    }
    
    return productCopy;
  };

  const productWithMeta = ensureProductMeta(product);
  // Use useMemo or direct calculation to ensure it updates
  const howManyInCart = useMemo(() => {
    return cart.filter(
      (item) => item.meta?.sku && productWithMeta.meta?.sku && item.meta.sku === productWithMeta.meta.sku
    ).length;
  }, [cart, productWithMeta.meta?.sku]);

  const handleAdd = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      setShowLoginDialog(true);
      return;
    }

    try {
      const productToAdd = ensureProductMeta(product);
      addToCart(productToAdd);
    } catch (error) {
      console.error("Error adding product to cart:", error);
    }
  };

  // Show count and controls when items are in cart
  if (howManyInCart > 0) {
    return (
      <>
        <div className="flex space-x-5 items-center">
          <RemoveFromCart product={productWithMeta} />
          <span className="font-bold text-lg min-w-[30px] text-center bg-yellow-400 text-walmart px-2 py-1 rounded">
            {howManyInCart}
          </span>
          <Button className="bg-walmart hover:bg-walmart/50" onClick={handleAdd}>
            +
          </Button>
        </div>
        <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Login Required</DialogTitle>
              <DialogDescription>
                Please login to add items to your cart.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <LoginDialog>
                <Button className="bg-walmart hover:bg-walmart/50 w-full">
                  Login / Sign Up
                </Button>
              </LoginDialog>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Button className="bg-walmart hover:bg-walmart/50 w-full" onClick={handleAdd}>
        Add To Cart
      </Button>
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              Please login to add items to your cart.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <LoginDialog>
              <Button className="bg-walmart hover:bg-walmart/50 w-full">
                Login / Sign Up
              </Button>
            </LoginDialog>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AddToCart;
