"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Grid2X2,
  Heart,
  LayoutGrid,
  Search,
  ShoppingCart,
  LogOut,
  User,
} from "lucide-react";
import { FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store";
import { useAuthStore } from "@/store/authStore";
import { getCartTotal } from "@/lib/getCartTotal";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { Button } from "@/components/ui/button";

function Header() {
  const router = useRouter();
  const cart = useCartStore((state) => state.cart);
  const total = getCartTotal(cart);
  const { user, isAuthenticated, clearAuth, setUser } = useAuthStore();

  // Check auth status on mount - only if we don't already have user data
  useEffect(() => {
    // If we already have user data from persisted store, don't check again
    // This prevents unnecessary API calls and double renders
    if (user && isAuthenticated) {
      return;
    }

    // Only check auth if we don't have user data
    // This prevents clearing auth when we just logged in
    if (!user) {
      const checkAuth = async () => {
        try {
          const response = await fetch("/api/auth/me", {
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            clearAuth();
          }
        } catch (error) {
          clearAuth();
        }
      };

      // Small delay to ensure cookies are set after signup/login
      const timeoutId = setTimeout(() => {
        checkAuth();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [setUser, clearAuth, user, isAuthenticated]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      // Logout error - user will be logged out anyway
    } finally {
      clearAuth();
      router.push("/");
    }
  };

  const handlesubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.input.value;
    router.push(`/search?q=${input}`);
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

      <div className="flex space-x-5 mt-5 md:mt-0">
        <Link
          href={"/"}
          className="hidden xl:flex text-white font-bold items-center space-x-2 text-sm"
        >
          <Grid2X2 size={20} />
          <p>Department</p>
        </Link>

        <Link
          href={"/"}
          className="hidden xl:flex text-white font-bold items-center space-x-2 text-sm"
        >
          <LayoutGrid size={20} />
          <p>Services</p>
        </Link>

        <Link
          href={"/"}
          className="flex text-white font-bold items-center space-x-2 text-sm"
        >
          <Heart size={20} />
          <p>My Items</p>
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
          href={"/basket"}
          scroll={false}
          className="flex text-white font-bold items-center space-x-2 text-sm"
        >
          <ShoppingCart size={20} />
          <div>
            <p className="text-xs font-extralight">
              {cart.length > 0 ? `${cart.length} items` : "No items"}
            </p>
            <p>{cart.length > 0 ? `${total}` : "0"}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}

export default Header;
