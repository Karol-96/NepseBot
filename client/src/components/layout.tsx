import { ReactNode } from "react";
import { Navbar } from "@/components/navbar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-20">
        {children}
      </main>
      <footer className="py-6 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 text-center text-secondary-500 text-sm">
          © {new Date().getFullYear()} TradePro. All rights reserved.
        </div>
      </footer>
    </div>
  );
}