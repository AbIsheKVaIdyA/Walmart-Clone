"use client";

import Basket from "@/components/Basket";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function BasketInterception() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>("");

  // Track actual window location pathname
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
      
      const handleLocationChange = () => {
        setCurrentPath(window.location.pathname);
      };
      
      // Listen for popstate events (browser back/forward)
      window.addEventListener("popstate", handleLocationChange);
      
      // Also check on every navigation
      const checkPath = () => {
        setCurrentPath(window.location.pathname);
      };
      window.addEventListener("pushstate", checkPath);
      window.addEventListener("replacestate", checkPath);
      
      return () => {
        window.removeEventListener("popstate", handleLocationChange);
        window.removeEventListener("pushstate", checkPath);
        window.removeEventListener("replacestate", checkPath);
      };
    }
  }, []);

  function onDismiss() {
    setIsOpen(false);
    router.back();
  }

  // Prevent scroll restoration when modal opens
  useEffect(() => {
    if (typeof window !== "undefined") {
      const scrollY = window.scrollY;
      
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }

      window.scrollTo(0, scrollY);

      return () => {
        if ("scrollRestoration" in window.history) {
          window.history.scrollRestoration = "auto";
        }
      };
    }
  }, []);

  useEffect(() => {
    // Check both pathname and actual window location
    const isOnCheckout = pathname === "/checkout" || currentPath === "/checkout";
    
    // Always close modal if we're on checkout page
    if (isOnCheckout) {
      setIsOpen(false);
      return;
    }
    
    // Only open modal if we're actually on the /basket route
    if (pathname === "/basket" || currentPath === "/basket") {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [pathname, currentPath]);

  // Early return - don't render anything if on checkout (AFTER all hooks)
  const isOnCheckout = pathname === "/checkout" || (typeof window !== "undefined" && window.location.pathname === "/checkout");
  if (isOnCheckout) {
    return null;
  }

  // Double-check before rendering Dialog - ensure we're NOT on checkout
  const shouldRender = !isOnCheckout && (pathname === "/basket" || currentPath === "/basket");
  
  if (!shouldRender) {
    return null;
  }

  return (
    <Dialog
      open={isOpen && shouldRender}
      onOpenChange={(open) => {
        // Prevent opening if on checkout
        if (pathname === "/checkout" || currentPath === "/checkout") {
          setIsOpen(false);
          return;
        }
        setIsOpen(open);
        if (!open) {
          onDismiss();
        }
      }}
    >
      <DialogContent className="h-4/5 w-full overflow-scroll max-w-3xl">
        <DialogHeader>
          <DialogTitle>Basket</DialogTitle>
          <DialogDescription>
            Contents of your basket
          </DialogDescription>
        </DialogHeader>
        <Basket />
      </DialogContent>
    </Dialog>
  );
}

export default BasketInterception;
