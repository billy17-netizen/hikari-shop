'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

// Define a type for product images that can be either a string URL or a temporary image object
type ProductImage = string | {
  url: string;
  isUploading: boolean;
  tempId: string;
};

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    slug: '',
    description: '',
    details: '',
    sizes: '',
    colors: '',
    inStock: true,
  });
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
    }));
  };
  
  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      for (const file of files) {
        // Validate file type
        if (!file.type.match('image.*')) {
          alert('Please select only image files');
          continue;
        }
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          alert('File size should be less than 5MB');
          continue;
        }
        
        // Create a temporary ID for this upload
        const tempId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
        
        try {
          // Create a temporary preview for immediate feedback
          const reader = new FileReader();
          reader.onload = (event) => {
            const target = event.target;
            if (!target || !target.result) return;
            
            // Add a temporary preview with a loading indicator
            setProductImages(prev => [...prev, {
              url: target.result as string,
              isUploading: true,
              tempId
            }]);
          };
          reader.readAsDataURL(file);
          
          // Create form data for upload
          const formData = new FormData();
          formData.append('productImage', file);
          
          // Upload to server
          const response = await fetch('/api/admin/products/upload-image', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to upload image');
          }
          
          const data = await response.json();
          
          // Replace the temporary preview with the actual URL from the server
          setProductImages(prev => prev.map(img => {
            if (typeof img === 'string') return img;
            if (img.isUploading && img.tempId === tempId) {
              return data.imageUrl;
            }
            return img;
          }));
        } catch (error) {
          console.error('Error uploading image:', error);
          alert('Failed to upload image. Please try again.');
          
          // Remove the temporary preview
          setProductImages(prev => prev.filter(img => {
            if (typeof img === 'string') return true;
            return !(img.isUploading && img.tempId === tempId);
          }));
        }
      }
    }
  };
  
  // Remove an image
  const removeImage = (index: number) => {
    const newImages = [...productImages];
    newImages.splice(index, 1);
    setProductImages(newImages);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    
    const toastId = toast.loading('Creating new product...');
    
    try {
      // Convert comma-separated strings to arrays
      const productData = {
        ...formData,
        details: formData.details ? formData.details.split(',').map(item => item.trim()) : [],
        sizes: formData.sizes ? formData.sizes.split(',').map(item => item.trim()) : [],
        colors: formData.colors ? formData.colors.split(',').map(item => item.trim()) : [],
        // Filter out any temporary image objects and keep only string URLs
        images: productImages.filter(img => typeof img === 'string') as string[],
      };
      
      // Send the product data to the API
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      const result = await response.json();
      
      toast.success(`Product "${formData.name}" created successfully`, { id: toastId });
      
      // Redirect back to products list after successful creation
      router.push('/admin/products');
    } catch (error) {
      console.error('Error creating product:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create product');
      toast.error(`Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="py-4 font-karla">
      <div className="mb-8">
        <h1 className="text-2xl font-monument mb-2">Add New Product</h1>
        <p className="text-neutral-500">Create a new product listing</p>
      </div>
      
      {errorMessage && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm">
          {errorMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-sm border border-neutral-200 p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Product Name */}
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleNameChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
              required
            />
          </div>
          
          {/* Price */}
          <div className="md:col-span-2">
            <label htmlFor="price" className="block text-sm font-medium text-neutral-700 mb-1">
              Price (IDR)
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
              placeholder="500000"
              min="0"
              step="1000"
              required
            />
          </div>
          
          {/* Slug */}
          <div className="md:col-span-2">
            <label htmlFor="slug" className="block text-sm font-medium text-neutral-700 mb-1">
              URL Slug
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 border border-r-0 border-neutral-300 bg-neutral-50 text-neutral-500 text-sm rounded-l-sm">
                /product/
              </span>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-r-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                required
              />
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              This will be the URL for your product: /product/{formData.slug}
            </p>
          </div>
          
          {/* Description */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
              required
            ></textarea>
          </div>
          
          {/* Product Details */}
          <div className="md:col-span-2">
            <label htmlFor="details" className="block text-sm font-medium text-neutral-700 mb-1">
              Product Details (comma separated)
            </label>
            <textarea
              id="details"
              name="details"
              value={formData.details}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
              placeholder="Made from 100% cotton, Machine washable, Imported"
            ></textarea>
            <p className="mt-1 text-xs text-neutral-500">
              Enter each detail separated by commas
            </p>
          </div>
          
          {/* Available Sizes */}
          <div>
            <label htmlFor="sizes" className="block text-sm font-medium text-neutral-700 mb-1">
              Available Sizes (comma separated)
            </label>
            <input
              type="text"
              id="sizes"
              name="sizes"
              value={formData.sizes}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
              placeholder="S, M, L, XL"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Enter sizes separated by commas
            </p>
          </div>
          
          {/* Available Colors */}
          <div>
            <label htmlFor="colors" className="block text-sm font-medium text-neutral-700 mb-1">
              Available Colors (comma separated)
            </label>
            <input
              type="text"
              id="colors"
              name="colors"
              value={formData.colors}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
              placeholder="Black, White, Blue"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Enter colors separated by commas
            </p>
          </div>
          
          {/* In Stock */}
          <div className="md:col-span-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="inStock"
                name="inStock"
                checked={formData.inStock}
                onChange={handleInputChange}
                className="h-4 w-4 text-neutral-900 border-neutral-300 rounded"
              />
              <label htmlFor="inStock" className="ml-2 block text-sm text-neutral-700">
                Product is in stock
              </label>
            </div>
          </div>
          
          {/* Product Images */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Product Images
            </label>
            
            <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-sm">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-neutral-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-neutral-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                    <span>Upload images</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handleImageUpload} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-neutral-500">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            </div>
            
            {/* Image preview */}
            {productImages.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {productImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={typeof image === 'string' ? image : image.url} 
                      alt={`Product preview ${index + 1}`} 
                      className={`h-24 w-24 object-cover rounded-sm ${typeof image !== 'string' && image.isUploading ? 'opacity-50' : ''}`}
                      onError={(e) => {
                        console.log("Image failed to load:", image);
                        const fallbackUrl = "/placeholder-product.jpg";
                        e.currentTarget.src = fallbackUrl;
                      }} 
                    />
                    {typeof image !== 'string' && image.isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-neutral-800"></span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                      Image {index + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={typeof image !== 'string' && image.isUploading}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src="/placeholder-product.jpg" 
                      alt={`Product preview ${index + 1}`} 
                      className="h-24 w-24 object-cover rounded-sm"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                      Image {index + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Form actions */}
        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="px-4 py-2 border border-neutral-300 rounded-sm text-neutral-700 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 bg-neutral-900 text-white rounded-sm ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-neutral-800'
            }`}
          >
            {isSubmitting ? 'Saving...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
} 