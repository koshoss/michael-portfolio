import { Link, useLocation } from "react-router-dom";
import { Home, FolderOpen, DollarSign, Star, FileText, User, Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { path: "/", label: "Home", icon: Home },
  { path: "/portfolio", label: "Portfolio", icon: FolderOpen },
  { path: "/pricing", label: "Pricing", icon: DollarSign },
  { path: "/reviews", label: "Reviews", icon: Star },
  { path: "/terms", label: "Terms", icon: FileText },
];

export function Navigation() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-sm border-b border-dark-700">
      <div className="container-custom h-14 flex items-center justify-between">
        <Link to="/" className="text-primary font-bold text-base sm:text-lg">
          Michael's 3D Portfolio
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const Icon = l.icon;
            const active = pathname === l.path;
            return (
              <Link
                key={l.path}
                to={l.path}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-primary text-white"
                    : "text-gray-400 hover:text-white hover:bg-dark-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {l.label}
              </Link>
            );
          })}
          <Link
            to="/admin"
            className="ml-2 p-2 rounded-full bg-dark-700 hover:bg-dark-600 transition-colors"
          >
            <User className="w-5 h-5" />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {open && (
        <div className="md:hidden bg-dark-800 border-t border-dark-700 p-4 space-y-1">
          {links.map((l) => {
            const Icon = l.icon;
            const active = pathname === l.path;
            return (
              <Link
                key={l.path}
                to={l.path}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                  active ? "bg-primary text-white" : "text-gray-400"
                }`}
              >
                <Icon className="w-5 h-5" />
                {l.label}
              </Link>
            );
          })}
          <Link
            to="/admin"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400"
          >
            <User className="w-5 h-5" />
            Admin
          </Link>
        </div>
      )}
    </nav>
  );
}
