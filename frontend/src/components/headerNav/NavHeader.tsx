import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CiSearch } from "react-icons/ci";
import { Menu } from '@headlessui/react';
import NotificationMenu from "../../components/headerNav/NotificationMenu";
import logo from "../../assets/logo.png";
import { searchAll } from "../../api/search.api";
import type { SearchResult } from "../../api/search.api";

const NavHeader = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await searchAll(query);
        setResults(res.data);
        setShowDropdown(true);
      } catch {
        setResults(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (type: "products" | "clients", id: number) => {
    setShowDropdown(false);
    setQuery("");
    if (type === "products") {
      navigate(`/inventario?edit=${id}`);
    } else {
      navigate(`/clientes?edit=${id}`);
    }
  };

  const hasResults = results && (results.products.length > 0 || results.clients.length > 0);

  return (
    <nav className="flex items-center justify-between gap-x-2 w-full">
      <Menu>
        <div className="flex gap-2 w-auto items-center">
          <img
            className="rounded-lg size-9 h-8 w-auto cursor-pointer"
            src={logo}
            alt="logo"
          />
          <button className="font-bold text-xl tracking-tight text-text-primary cursor-pointer">
            FiadoApp
          </button>
        </div>
      </Menu>

      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block" ref={searchRef}>
          <CiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-outline size-5" />
          <input
            type="search"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              if (!e.target.value.trim()) setShowDropdown(false);
            }}
            onFocus={() => { if (hasResults) setShowDropdown(true); }}
            className="bg-surface-container-low border-none outline-none pl-10 pr-4 py-2 rounded-full text-xs text-nav w-64 focus:outline-none focus:ring-2 focus:ring-secondary md:text-sm"
            placeholder="Buscar producto o cliente..."
          />
          {showDropdown && hasResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-outline-variant rounded-lg shadow-lg max-h-72 overflow-y-auto z-50">
              {results!.products.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider bg-surface-container-lowest">
                    Productos
                  </div>
                  {results!.products.map(p => (
                    <button
                      key={`p-${p.id}`}
                      onClick={() => handleSelect("products", p.id)}
                      className="w-full text-left px-3 py-2 text-sm text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
              {results!.clients.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider bg-surface-container-lowest">
                    Clientes
                  </div>
                  {results!.clients.map(c => (
                    <button
                      key={`c-${c.id}`}
                      onClick={() => handleSelect("clients", c.id)}
                      className="w-full text-left px-3 py-2 text-sm text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <Menu>
          <NotificationMenu />
        </Menu>
      </div>
    </nav>
  );
};
export default NavHeader;
