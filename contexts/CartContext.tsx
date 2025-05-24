'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../types/product';

// Define cart item type
export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

// Define cart context type
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity: number, color?: string, size?: string) => void;
  removeFromCart: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  updateOptions: (itemId: number, color?: string, size?: string) => void;
  clearCart: () => void;
  itemCount: number;
  totalPrice: number;
}

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [itemCount, setItemCount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('hikarishop-cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse saved cart:', error);
      }
    }
  }, []);

  // Update localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('hikarishop-cart', JSON.stringify(cartItems));
    
    // Update item count
    const count = cartItems.reduce((total, item) => total + item.quantity, 0);
    setItemCount(count);
    
    // Update total price
    const total = cartItems.reduce((sum, item) => {
      return sum + (parseFloat(item.product.price) * item.quantity);
    }, 0);
    setTotalPrice(total);
  }, [cartItems]);

  // Add item to cart
  const addToCart = (product: Product, quantity: number, color?: string, size?: string) => {
    setCartItems(prevItems => {
      // Check if product already in cart with same options
      const existingItemIndex = prevItems.findIndex(
        item => item.product.id === product.id && 
               item.selectedColor === color && 
               item.selectedSize === size
      );

      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        return updatedItems;
      } else {
        // Add new item
        return [...prevItems, {
          id: Date.now(), // Unique ID for cart item
          product,
          quantity,
          selectedColor: color,
          selectedSize: size
        }];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (itemId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  // Update item quantity
  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity < 1) return;
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };
  
  // Update item color and size
  const updateOptions = (itemId: number, color?: string, size?: string) => {
    setCartItems(prevItems => {
      // Find the item to update
      const itemToUpdate = prevItems.find(item => item.id === itemId);
      if (!itemToUpdate) return prevItems;
      
      // Check if there's already an item with the same product and new options
      const existingItemWithOptions = prevItems.find(
        item => item.id !== itemId && 
               item.product.id === itemToUpdate.product.id && 
               item.selectedColor === color && 
               item.selectedSize === size
      );
      
      if (existingItemWithOptions) {
        // If item with same product and options exists, merge quantities and remove the old item
        const updatedItems = prevItems.map(item => {
          if (item.id === existingItemWithOptions.id) {
            return {
              ...item,
              quantity: item.quantity + itemToUpdate.quantity
            };
          }
          return item;
        }).filter(item => item.id !== itemId);
        
        return updatedItems;
      } else {
        // Otherwise just update the options
        return prevItems.map(item => 
          item.id === itemId 
            ? { ...item, selectedColor: color, selectedSize: size }
            : item
        );
      }
    });
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateOptions,
      clearCart,
      itemCount,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

// Custom hook to use cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 