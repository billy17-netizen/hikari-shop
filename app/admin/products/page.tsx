'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Product } from '../../../types/product';
import { formatRupiah } from '../../../lib/utils/format';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // States
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Build API URL with filters
  const buildApiUrl = () => {
    const url = new URL('/api/admin/products', window.location.origin);
    
    // Add query parameters
    if (searchTerm) url.searchParams.append('search', searchTerm);
    if (stockFilter !== 'all') url.searchParams.append('stock', stockFilter);
    url.searchParams.append('sortField', sortField);
    url.searchParams.append('sortOrder', sortDirection);
    url.searchParams.append('page', currentPage.toString());
    url.searchParams.append('limit', itemsPerPage.toString());
    
    return url.toString();
  };
  
  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      
      const apiUrl = buildApiUrl();
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setProducts(data.products);
      setFilteredProducts(data.products);
      setTotalItems(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
      setCurrentPage(data.pagination.page);
    } catch (error) {
      console.error('Error fetching products:', error);
      setErrorMessage('Failed to load products. Please try again.');
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch products initially and when filters change
  useEffect(() => {
    fetchProducts();
  }, [searchTerm, stockFilter, sortField, sortDirection, currentPage, itemsPerPage]);
  
  // Apply URL parameters on initial load
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam) {
      setStockFilter(filterParam);
    }
    
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [searchParams]);
  
  // Handle sort change
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and reset to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };
  
  // Handle pagination
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Handle bulk selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProducts(filteredProducts.map(product => product.id));
    } else {
      setSelectedProducts([]);
    }
  };
  
  const handleSelectProduct = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
    if (e.target.checked) {
      setSelectedProducts([...selectedProducts, id]);
    } else {
      setSelectedProducts(selectedProducts.filter(productId => productId !== id));
    }
  };
  
  // Handle delete
  const handleDeleteClick = (id: number) => {
    setProductToDelete(id);
    setIsDeleteModalOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    
    const toastId = toast.loading('Deleting product...');
    
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/admin/products/${productToDelete}`, { 
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // Refresh products list after successful deletion
      await fetchProducts();
      
      // Reset state
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      setSelectedProducts(selectedProducts.filter(id => id !== productToDelete));
      
      toast.success('Product deleted successfully', { id: toastId });
    } catch (error) {
      console.error('Error deleting product:', error);
      setErrorMessage('Failed to delete product. Please try again.');
      toast.error('Failed to delete product', { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    
    const toastId = toast.loading(`Deleting ${selectedProducts.length} products...`);
    
    try {
      setIsDeleting(true);
      
      const response = await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedProducts })
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // Refresh products list after successful deletion
      await fetchProducts();
      
      // Reset selected products
      setSelectedProducts([]);
      
      toast.success(`${selectedProducts.length} products deleted successfully`, { id: toastId });
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      setErrorMessage('Failed to delete products. Please try again.');
      toast.error('Failed to delete products', { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="py-10 font-karla">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 font-karla">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-monument mb-4">Product Management</h1>
          <p className="text-neutral-500">Manage your product inventory</p>
        </div>

        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm">
            {errorMessage}
            <button 
              className="ml-2 font-medium underline"
              onClick={() => fetchProducts()}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Product controls */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h2 className="text-lg font-medium">All Products</h2>
            <p className="text-sm text-neutral-500">{totalItems} products found</p>
          </div>
          <div className="flex space-x-3">
            {selectedProducts.length > 0 && (
              <button 
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="bg-red-600 text-white px-4 py-2 text-sm hover:bg-red-700 disabled:bg-red-400"
              >
                {isDeleting ? 'Deleting...' : `Delete Selected (${selectedProducts.length})`}
              </button>
            )}
            <Link 
              href="/admin/products/new" 
              className="bg-neutral-900 text-white px-4 py-2 text-sm hover:bg-neutral-800"
            >
              Add New Product
            </Link>
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-sm shadow-sm border border-neutral-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-neutral-700 mb-1">
                Search Products
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by name, ID, or slug..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>
            
            <div>
              <label htmlFor="stockFilter" className="block text-sm font-medium text-neutral-700 mb-1">
                Filter by Stock
              </label>
              <select
                id="stockFilter"
                value={stockFilter}
                onChange={(e) => {
                  setStockFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                <option value="all">All Products</option>
                <option value="inStock">In Stock</option>
                <option value="outOfStock">Out of Stock</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="perPage" className="block text-sm font-medium text-neutral-700 mb-1">
                Items Per Page
              </label>
              <select
                id="perPage"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products table */}
        <div className="bg-white rounded-sm shadow-sm border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-3 py-3">
                    <input 
                      type="checkbox" 
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                    />
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center">
                      ID
                      {sortField === 'id' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Name
                      {sortField === 'name' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center">
                      Price
                      {sortField === 'price' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                      No products found. Try changing your filters or <Link href="/admin/products/new" className="text-blue-600 hover:underline">add a new product</Link>.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-neutral-50">
                      <td className="px-3 py-4">
                        <input 
                          type="checkbox" 
                          checked={selectedProducts.includes(product.id)}
                          onChange={(e) => handleSelectProduct(e, product.id)}
                          className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {product.id}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-neutral-900 flex items-center space-x-3">
                        {product.images && product.images.length > 0 && (
                          <img 
                            src={product.images[0]} 
                            alt={product.name} 
                            className="h-10 w-10 object-cover rounded"
                            onError={(e) => {
                              // Set fallback image if loading fails
                              e.currentTarget.src = `/placeholder-product.jpg`;
                              e.currentTarget.onerror = null;
                            }}
                          />
                        )}
                        <span>{product.name}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {formatRupiah(product.price)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${
                          product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <Link 
                            href={`/admin/products/edit/${product.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </Link>
                          <Link 
                            href={`/product/${product.slug}`}
                            className="text-neutral-600 hover:text-neutral-900"
                            target="_blank"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-200 sm:px-6 flex justify-between items-center">
              <div className="text-sm text-neutral-700">
                Showing page {currentPage} of {totalPages} ({totalItems} total products)
              </div>
              <div className="flex space-x-1">
                <button 
                  onClick={() => paginate(currentPage - 1)} 
                  disabled={currentPage === 1}
                  className={`px-3 py-1 border border-neutral-300 rounded ${
                    currentPage === 1 ? 'text-neutral-400 cursor-not-allowed' : 'hover:bg-neutral-100'
                  }`}
                >
                  Previous
                </button>
                {/* Show limited page numbers to avoid too many buttons */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Calculate which page numbers to show
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button 
                      key={i}
                      onClick={() => paginate(pageNum)}
                      className={`px-3 py-1 border ${
                        currentPage === pageNum 
                          ? 'bg-neutral-900 text-white border-neutral-900' 
                          : 'border-neutral-300 hover:bg-neutral-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button 
                  onClick={() => paginate(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 border border-neutral-300 rounded ${
                    currentPage === totalPages ? 'text-neutral-400 cursor-not-allowed' : 'hover:bg-neutral-100'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete confirmation modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-neutral-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-sm p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Delete Product</h3>
            <p className="text-neutral-600 mb-6">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-neutral-300 rounded-sm hover:bg-neutral-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-sm hover:bg-red-700 disabled:bg-red-400"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 