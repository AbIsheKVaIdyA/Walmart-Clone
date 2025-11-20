"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Search,
  ShoppingCart,
  LogOut,
  User,
  Grid2X2,
  LayoutGrid,
} from "lucide-react";
import { FormEvent, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCartStore } from "@/store";
import { useAuthStore } from "@/store/authStore";
import { getCartTotal } from "@/lib/getCartTotal";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { Button } from "@/components/ui/button";
import { getCSRFToken } from "@/lib/security/csrfClient";

function Header() {
  const router = useRouter();
  const pathname = usePathname();
  // Subscribe to cart changes - use the entire state to ensure reactivity
  const cart = useCartStore((state) => state.cart);
  const clearCart = useCartStore((state) => state.clearCart);
  const total = getCartTotal(cart);
  const { user, isAuthenticated, clearAuth, setUser } = useAuthStore();
  const justLoggedOut = useRef(false);

  // Check auth status on mount and when auth state might have changed
  useEffect(() => {
    // Skip auth check if we just logged out
    if (justLoggedOut.current) {
      justLoggedOut.current = false;
      return;
    }

    // Always check auth status to ensure it's in sync
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else if (response.status === 401) {
          // 401 is expected when user is not logged in - silently clear auth
          if (isAuthenticated) {
            clearAuth();
            clearCart();
          }
        } else {
          // Other errors - clear auth but don't log
          if (isAuthenticated) {
            clearAuth();
            clearCart();
          }
        }
      } catch (error) {
        // Network errors - silently clear auth
        if (isAuthenticated) {
          clearAuth();
          clearCart();
        }
      }
    };

    // Small delay to ensure cookies are set after signup/login
    const timeoutId = setTimeout(() => {
      checkAuth();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [setUser, clearAuth, clearCart, isAuthenticated]);

  // Clear cart when user logs out (auth state changes from authenticated to not authenticated)
  useEffect(() => {
    if (!isAuthenticated && !user && cart.length > 0) {
      clearCart();
    }
  }, [isAuthenticated, user, cart.length, clearCart]);

  const handleLogout = async () => {
    // Set flag to skip auth check after logout
    justLoggedOut.current = true;
    
    try {
      const token = await getCSRFToken();
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "X-CSRF-Token": token }),
        },
        credentials: "include",
      });
    } catch (error) {
      // Logout error - user will be logged out anyway
    } finally {
      clearAuth();
      clearCart();
      router.push("/");
    }
  };

  const handlesubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.input.value;
    router.push(`/search?q=${input}`);
  };

  const handleBasketClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Prevent navigation to basket if already on checkout page
    if (pathname === "/checkout") {
      e.preventDefault();
      return;
    }
  };
  return (
    <header className="flex flex-col md:flex-row bg-walmart items-center px-10 py-7 space-x-5">
      <Link href="/" className="mb-5 md:mb-0">
        <Image
          src="https://i.imgur.com/5V4wehM.png"
          alt="Logo"
          width={150}
          height={150}
        />
      </Link>

      <form
        onSubmit={handlesubmit}
        className="flex items-center bg-white rounded-full w-full flex-1"
      >
        <input
          type="text"
          name="input"
          placeholder="Search Everything.."
          className="flex-1 px-4 rounded-full outline-none placeholder:text-sm text-black"
        />
        <button type="submit">
          <Search className="rounded-full h-10 px-2 w-10 bg-yellow-400 cursor-pointer" />
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-3 md:gap-5 mt-5 md:mt-0">
        {isAuthenticated && user?.role === "admin" && (
          <>
            <Link
              href={"/admin/departments"}
              className="flex text-white font-bold items-center space-x-2 text-sm hover:text-yellow-400 transition-colors"
            >
              <Grid2X2 size={20} />
              <span>Department</span>
            </Link>
            <Link
              href={"/admin/services"}
              className="flex text-white font-bold items-center space-x-2 text-sm hover:text-yellow-400 transition-colors"
            >
              <LayoutGrid size={20} />
              <span>Services</span>
            </Link>
          </>
        )}
        <Link
          href={"/"}
          className="flex text-white font-bold items-center space-x-2 text-sm"
        >
          <Heart size={20} />
          <span>My Items</span>
        </Link>

        {isAuthenticated && user ? (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-white text-sm">
              <User size={20} />
              <div className="flex flex-col">
                <p className="font-bold">{user.name}</p>
                <p className="text-xs font-extralight">
                  {user.role === "admin" ? "Admin" : "Customer"}
                </p>
              </div>
            </div>
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="text-white font-bold text-sm hover:text-yellow-400 hover:underline"
              >
                Admin
              </Link>
            )}
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-white hover:text-yellow-400 p-2"
              size="sm"
            >
              <LogOut size={18} />
            </Button>
          </div>
        ) : (
          <LoginDialog>
            <button 
              type="button"
              className="flex text-white font-bold items-center space-x-2 text-sm hover:text-yellow-400 cursor-pointer"
            >
              <p>Sign In</p>
            </button>
          </LoginDialog>
        )}

        <Link
          href={pathname === "/checkout" ? "#" : "/basket"}
          scroll={false}
          onClick={handleBasketClick}
          className="flex text-white font-bold items-center space-x-2 text-sm relative"
        >
          <div className="relative">
            <ShoppingCart size={20} />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-walmart rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {cart.length}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs font-extralight">
              {cart.length > 0 ? `${cart.length} items` : "No items"}
            </p>
            <p className="font-bold">{cart.length > 0 ? `${total}` : "$0.00"}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}

export default Header;
