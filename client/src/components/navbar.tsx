import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { BarChart, FileText, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function Navbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Navigation items
  const navItems = [
    {
      name: "Order Form",
      href: "/",
      icon: <FileText className="h-4 w-4 mr-2" />,
      active: location === "/"
    },
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <BarChart className="h-4 w-4 mr-2" />,
      active: location === "/dashboard"
    },
  ];
  
  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled ? "bg-white shadow-md py-2" : "bg-white/80 backdrop-blur-sm py-4"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <div className="bg-gradient-to-tr from-primary-600 to-primary-500 text-white rounded-md p-1.5 mr-2 shadow-sm">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="h-5 w-5"
                  >
                    <path d="m2 16 6-6 4 4 8-8" />
                    <path d="M4 20h16" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xl text-primary-800">TradePro</span>
                  <span className="text-xs text-primary-500 -mt-1">Trading Management</span>
                </div>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={item.active ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "flex items-center mr-1",
                    item.active 
                      ? "bg-primary-100 text-primary-800 hover:bg-primary-200" 
                      : "text-secondary-700 hover:text-primary-800"
                  )}
                >
                  {item.icon}
                  {item.name}
                </Button>
              </Link>
            ))}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-3 pb-2 border-t mt-2">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={item.active ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "flex items-center justify-start w-full",
                      item.active 
                        ? "bg-primary-100 text-primary-800 hover:bg-primary-200" 
                        : "text-secondary-700 hover:text-primary-800"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.icon}
                    {item.name}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}