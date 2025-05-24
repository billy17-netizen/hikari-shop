'use client';

import React from 'react';
import Link from 'next/link';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-neutral-200 pt-12 pb-8">
      <div className="w-full px-4 sm:px-8 lg:px-16 xl:px-20">
        <div className="max-w-[2400px] mx-auto">
          {/* Main Footer Content */}
          <div className="flex flex-col md:flex-row justify-between gap-10 mb-10">
            {/* Brand Column */}
            <div className="md:w-1/3">
              <Link href="/" className="block text-2xl text-neutral-900 font-karla font-light mb-4">
                HIKARI
              </Link>
              <p className="text-neutral-600 font-karla mb-6 max-w-xs">
                Minimalist, timeless clothing crafted with attention to detail.
              </p>
              <div className="flex space-x-5">
                {['Instagram', 'Pinterest'].map((social) => (
                  <a 
                    key={social} 
                    href={`#${social.toLowerCase()}`} 
                    className="text-neutral-600 hover:text-neutral-900 transition-colors duration-300 font-karla text-sm"
                    aria-label={social}
                  >
                    {social}
                  </a>
                ))}
              </div>
            </div>
            
            {/* Links Column - Simplified */}
            <div className="md:w-1/3">
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                {[
                  { name: 'Shop', path: '/shop' },
                  { name: 'About', path: '/about' },
                  { name: 'Collections', path: '/collections' },
                  { name: 'Contact', path: '/contact' },
                  { name: 'New Arrivals', path: '/new-arrivals' },
                  { name: 'FAQ', path: '/faq' }
                ].map((link) => (
                  <Link 
                    key={link.name}
                    href={link.path} 
                    className="font-karla text-neutral-600 hover:text-neutral-900 transition-colors py-1"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Newsletter Column */}
            <div className="md:w-1/3 md:max-w-xs">
              <h3 className="font-monument text-xs uppercase tracking-wider mb-4 text-neutral-800">Newsletter</h3>
              <form className="flex mb-3">
                <div className="relative flex-grow">
                  <input 
                    type="email" 
                    placeholder="Your email" 
                    className="w-full py-3 px-4 border border-neutral-300 focus:border-neutral-900 outline-none transition font-karla"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="bg-neutral-900 text-white p-3 border border-neutral-900 hover:bg-neutral-800 transition-colors duration-300"
                >
                  <EnvelopeIcon className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
          
          {/* Bottom Footer - Simplified */}
          <div className="pt-6 border-t border-neutral-200">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <p className="text-sm text-neutral-500 font-karla mb-4 sm:mb-0">
                © 2024 HIKARI. All rights reserved.
              </p>
              
              {/* Simplified Legal Links */}
              <div className="flex space-x-6">
                {[
                  { name: 'Privacy', path: '/privacy' },
                  { name: 'Terms', path: '/terms' }
                ].map((link) => (
                  <Link 
                    key={link.name}
                    href={link.path} 
                    className="text-xs text-neutral-500 hover:text-neutral-900 font-karla transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 