'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BsSearch } from 'react-icons/bs';
import { formatRupiah } from '../../../lib/utils/format';
import { Product } from '../../../types/product';

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search products
  async function searchProducts(query: string) {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsOpen(false);
      router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
    }
  }

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Icon */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-1 focus:outline-none"
        aria-label="Search"
      >
        <BsSearch size={20} />
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-screen max-w-md bg-white shadow-lg z-50 border border-neutral-200 font-karla">
          <form onSubmit={handleSubmit} className="p-4 border-b border-neutral-100">
            <div className="flex items-center">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search products..."
                className="w-full p-2 focus:outline-none text-neutral-900 font-karla"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit" 
                className="ml-2 p-2 bg-neutral-900 text-white"
                aria-label="Submit search"
              >
                <BsSearch size={16} />
              </button>
            </div>
          </form>

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-center items-center p-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-neutral-900"></div>
            </div>
          )}

          {/* Results */}
          {!isLoading && searchResults.length > 0 && (
            <div className="max-h-96 overflow-y-auto">
              <div className="p-4 text-sm text-neutral-500 font-monument">
                {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
              </div>
              <ul>
                {searchResults.map((product) => (
                  <li key={product.id} className="border-b border-neutral-100 last:border-b-0">
                    <Link
                      href={`/product/${product.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center p-4 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="w-16 h-16 relative flex-shrink-0">
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div className="ml-4 flex-grow">
                        <h4 className="text-sm font-monument text-neutral-900">{product.name}</h4>
                        <p className="text-sm mt-1 text-neutral-700 font-karla">{formatRupiah(product.price)}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="p-4 border-t border-neutral-100">
                <Link
                  href={`/shop?search=${encodeURIComponent(searchQuery)}`}
                  onClick={() => setIsOpen(false)}
                  className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors font-monument"
                >
                  View all results
                </Link>
              </div>
            </div>
          )}

          {/* No results */}
          {!isLoading && searchQuery && searchResults.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-neutral-600 mb-2 font-monument">No products found matching "{searchQuery}"</p>
              <p className="text-sm text-neutral-500 font-karla">Try a different search term or browse our shop.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 