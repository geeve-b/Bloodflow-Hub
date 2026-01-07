import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Droplet, Menu, X, User, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isLanding = location === "/";
  const isDashboard = location === "/dashboard";
  const isHospitalDashboard = location === "/hospital-dashboard";
  const isAdminDashboard = location === "/admin";

  const NavLinks = () => (
    <>
      {!isDashboard && !isHospitalDashboard && !isAdminDashboard && (
        <>
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
            About Us
          </Link>
          <Link href="/contact" className="text-sm font-medium hover:text-primary transition-colors">
            Contact
          </Link>
        </>
      )}
    </>
  );

  return (
    <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="w-full flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="bg-primary/10 p-2 rounded-full">
            <Droplet className="h-5 w-5 text-primary fill-primary" />
          </div>
          <span className="text-foreground">Life<span className="text-primary">Flow</span></span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <NavLinks />
        </div>

        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end text-sm">
                <span className="font-semibold">{user.name}</span>
                <span className="text-muted-foreground text-xs capitalize">{user.role}</span>
              </div>
              <Button variant="outline" size="sm" onClick={logout} data-testid="button-logout">
                Logout
              </Button>
              {user.role === "hospital" && !isHospitalDashboard && (
                <Link href="/hospital-dashboard">
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    Blood Dashboard
                  </Button>
                </Link>
              )}
              {user.role === "admin" && !isAdminDashboard && (
                <Link href="/admin">
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    Admin Center
                  </Button>
                </Link>
              )}
              {user.role !== "hospital" && user.role !== "admin" && user.role !== "guest" && !isDashboard && (
                <Link href="/dashboard">
                  <Button size="sm">Dashboard</Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" data-testid="button-login">
                  Log In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-primary hover:bg-primary/90" data-testid="button-register">
                  Donate Now
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-6 mt-6">
                <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2 font-bold text-xl">
                  <Droplet className="h-5 w-5 text-primary fill-primary" />
                  LifeFlow
                </Link>
                <div className="flex flex-col gap-4">
                  <NavLinks />
                </div>
                <div className="border-t pt-4 flex flex-col gap-3">
                  <ThemeToggle />
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                        </div>
                      </div>
                      {user.role === "admin" ? (
                        <Link href="/admin" onClick={() => setIsOpen(false)}>
                          <Button className="w-full bg-primary hover:bg-primary/90">Admin Center</Button>
                        </Link>
                      ) : user.role === "hospital" ? (
                        <Link href="/hospital-dashboard" onClick={() => setIsOpen(false)}>
                          <Button className="w-full bg-primary hover:bg-primary/90">Blood Dashboard</Button>
                        </Link>
                      ) : (
                        <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                          <Button className="w-full">Go to Dashboard</Button>
                        </Link>
                      )}
                      <Button variant="outline" onClick={() => { logout(); setIsOpen(false); }} className="w-full">
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full">Log In</Button>
                      </Link>
                      <Link href="/register" onClick={() => setIsOpen(false)}>
                        <Button className="w-full">Donate Now</Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
