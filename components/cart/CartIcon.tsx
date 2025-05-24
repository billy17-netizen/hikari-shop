'use client';

import React from 'react';
import Link from 'next/link';
import { BsCart3 } from 'react-icons/bs';
import { useCart } from '../../contexts/CartContext';

const CartIcon: React.FC = () => {
  const { itemCount } = useCart();
  
  return (
    <Link 
      href="/cart" 
      className="relative inline-block p-1 group"
      aria-label="View shopping cart"
    >
      <BsCart3 size={20} />
      
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-neutral-900 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
      <span className="sr-only">Cart</span>
    </Link>
  );
};

export default CartIcon; 