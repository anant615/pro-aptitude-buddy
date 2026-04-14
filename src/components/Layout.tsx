import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/practice", label: "Practice" },
  { to: "/dpp", label: "DPP" },
  { to: "/pyqs", label: "PYQs" },
  { to: "/mocks", label: "Mock Tests" },
  { to: "/videos", label: "Videos" },
  { to: "/resources", label: "Resources" },
  { to: "/newspaper", label: "Newspaper" },
  { to: "/about", label: "About" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const location = useLocation();

  const toggleDark = () => {
    setDark(!dark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-heading text-xl font-bold">
            <BookOpen className="h-6 w-6 text-accent" />
            <span>Pro <span className="text-gradient-gold">Aptitude</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === l.to
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleDark} className="rounded-full">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="md:hidden border-t bg-card pb-4">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
                className={`block px-6 py-3 text-sm font-medium ${location.pathname === l.to ? "text-accent" : "text-muted-foreground"}`}>
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-card py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2025 Pro Aptitude. Built for serious CAT aspirants.</p>
        </div>
      </footer>
    </div>
  );
}
