"use client";

import Link from "next/link";
import { Shield } from "lucide-react";

export default function AdminAccessLink() {
  return (
    <Link 
      href="/admin/login"
      className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors duration-200 z-50"
      title="Admin Access"
    >
      <Shield size={20} />
    </Link>
  );
}
