"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { Grid2X2, LayoutGrid, Shield, BarChart3, Users, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/admin/login");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return (
    <div className="w-full flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-100 py-12 px-4 min-h-[calc(100vh-120px)]">
      <div className="w-full max-w-7xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-lg text-gray-600">Welcome back, {user.name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
          <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-walmart w-full h-full flex flex-col min-h-[280px]">
            <CardHeader className="pb-4 flex-grow">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-3 bg-walmart/10 rounded-lg">
                  <Grid2X2 className="h-7 w-7 text-walmart" />
                </div>
                <CardTitle className="text-2xl">Department</CardTitle>
              </div>
              <CardDescription className="text-base">Manage product departments and categories</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button variant="outline" className="w-full border-walmart text-walmart hover:bg-walmart hover:text-white h-11 text-base">
                Manage Departments
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-walmart w-full h-full flex flex-col min-h-[280px]">
            <CardHeader className="pb-4 flex-grow">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-3 bg-walmart/10 rounded-lg">
                  <LayoutGrid className="h-7 w-7 text-walmart" />
                </div>
                <CardTitle className="text-2xl">Services</CardTitle>
              </div>
              <CardDescription className="text-base">Manage services and offerings</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button variant="outline" className="w-full border-walmart text-walmart hover:bg-walmart hover:text-white h-11 text-base">
                Manage Services
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-walmart w-full h-full flex flex-col min-h-[280px]">
            <CardHeader className="pb-4 flex-grow">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-3 bg-walmart/10 rounded-lg">
                  <Users className="h-7 w-7 text-walmart" />
                </div>
                <CardTitle className="text-2xl">Users</CardTitle>
              </div>
              <CardDescription className="text-base">Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button variant="outline" className="w-full border-walmart text-walmart hover:bg-walmart hover:text-white h-11 text-base">
                Manage Users
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-walmart w-full h-full flex flex-col min-h-[280px]">
            <CardHeader className="pb-4 flex-grow">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-3 bg-walmart/10 rounded-lg">
                  <BarChart3 className="h-7 w-7 text-walmart" />
                </div>
                <CardTitle className="text-2xl">Analytics</CardTitle>
              </div>
              <CardDescription className="text-base">View sales and performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button variant="outline" className="w-full border-walmart text-walmart hover:bg-walmart hover:text-white h-11 text-base">
                View Analytics
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-walmart w-full h-full flex flex-col min-h-[280px]">
            <CardHeader className="pb-4 flex-grow">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-3 bg-walmart/10 rounded-lg">
                  <Shield className="h-7 w-7 text-walmart" />
                </div>
                <CardTitle className="text-2xl">Security</CardTitle>
              </div>
              <CardDescription className="text-base">Security logs and monitoring</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Link href="/admin/security">
                <Button variant="outline" className="w-full border-walmart text-walmart hover:bg-walmart hover:text-white h-11 text-base">
                  View Security
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-walmart w-full h-full flex flex-col min-h-[280px]">
            <CardHeader className="pb-4 flex-grow">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-3 bg-walmart/10 rounded-lg">
                  <Settings className="h-7 w-7 text-walmart" />
                </div>
                <CardTitle className="text-2xl">Settings</CardTitle>
              </div>
              <CardDescription className="text-base">Application settings and configuration</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button variant="outline" className="w-full border-walmart text-walmart hover:bg-walmart hover:text-white h-11 text-base">
                Manage Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

