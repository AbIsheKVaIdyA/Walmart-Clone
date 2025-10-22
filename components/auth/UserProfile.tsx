"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useFirebaseAuthStore } from "@/store/firebaseAuthStore";
import { User, LogOut, Settings, Shield } from "lucide-react";
import { UserRole } from "@/typings/authTypings";
import Link from "next/link";

export default function UserProfile() {
  const { user, isAuthenticated, logout } = useFirebaseAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="flex text-white font-bold items-center space-x-2 text-sm">
          <User size={20} />
          <div>
            <p className="text-xs font-extralight">Welcome</p>
            <p>{user.name}</p>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account Information</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg">{user.name}</h3>
            <p className="text-gray-600">{user.email}</p>
            <div className="flex items-center mt-2">
              <Shield size={16} className="text-walmart mr-2" />
              <span className="text-sm font-medium capitalize">
                {user.role === UserRole.ADMIN ? 'Administrator' : 'Customer'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {user.role === UserRole.ADMIN && (
              <Link href="/admin" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Settings size={16} className="mr-2" />
                  Admin Dashboard
                </Button>
              </Link>
            )}
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
