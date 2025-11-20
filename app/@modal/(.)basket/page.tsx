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
  const [isOpen, setIsOpen] = useState(true);

  // Don't show modal if we're on checkout page
  useEffect(() => {
    if (pathname === "/checkout") {
      setIsOpen(false);
      // Navigate away from modal route
      if (window.location.pathname === "/basket") {
        router.replace("/checkout");
      }
    }
  }, [pathname, router]);

  function onDismiss() {
    setIsOpen(false);
    router.back();
  }

  // Prevent scroll restoration when modal opens
  useEffect(() => {
    // Prevent Next.js from trying to scroll to fixed/sticky elements
    if (typeof window !== "undefined") {
      // Store original scroll position
      const scrollY = window.scrollY;
      
      // Prevent scroll restoration
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }

      // Restore scroll position to prevent auto-scroll
      window.scrollTo(0, scrollY);

      return () => {
        // Restore scroll restoration on unmount
        if ("scrollRestoration" in window.history) {
          window.history.scrollRestoration = "auto";
        }
      };
    }
  }, []);

  // Don't render modal if on checkout page
  if (pathname === "/checkout") {
    return null;
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
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
            <p>Contents of your basket</p>
          </DialogDescription>
        </DialogHeader>
        <Basket />
      </DialogContent>
    </Dialog>
  );
}

export default BasketInterception;
