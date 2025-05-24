'use client';

import React, { useState, useEffect } from 'react';

// Address type without ID
interface AddressData {
  name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

// Full address type with ID
interface Address extends AddressData {
  id: string;
}

interface AddressFormProps {
  onSave: (address: Address | AddressData) => void;
  onCancel: () => void;
  initialData?: Address | null;
}

export default function AddressForm({ onSave, onCancel, initialData }: AddressFormProps) {
  const [formData, setFormData] = useState<AddressData>({
    name: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'Indonesia', // Default country
    isDefault: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load initial data if editing an existing address
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        phone: initialData.phone,
        address: initialData.address,
        city: initialData.city,
        province: initialData.province,
        postalCode: initialData.postalCode,
        country: initialData.country,
        isDefault: initialData.isDefault,
      });
    }
  }, [initialData]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const requiredFields = ['name', 'phone', 'address', 'city', 'province', 'postalCode'];

    // Check required fields
    requiredFields.forEach(field => {
      if (!formData[field as keyof AddressData]) {
        newErrors[field] = 'This field is required';
      }
    });

    // Validate phone number format
    if (formData.phone && !/^[0-9+\-\s()]{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Set errors and return validation result
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      if (initialData?.id) {
        // If editing an existing address, include the ID
        onSave({
          ...formData,
          id: initialData.id,
        });
      } else {
        // For new address, just pass the form data
        onSave(formData);
      }
    }
  };

  return (
    <div className="bg-white border border-neutral-200 p-6 rounded-sm">
      <h3 className="font-medium mb-4">
        {initialData ? 'Edit Address' : 'Add New Address'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label htmlFor="name" className="block text-sm mb-1">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full p-2 border ${errors.name ? 'border-red-500' : 'border-neutral-300'} rounded-sm`}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phone" className="block text-sm mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`w-full p-2 border ${errors.phone ? 'border-red-500' : 'border-neutral-300'} rounded-sm`}
            placeholder="e.g., 08123456789"
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        {/* Street Address */}
        <div>
          <label htmlFor="address" className="block text-sm mb-1">
            Street Address *
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className={`w-full p-2 border ${errors.address ? 'border-red-500' : 'border-neutral-300'} rounded-sm`}
          />
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
        </div>

        {/* City */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm mb-1">
              City *
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className={`w-full p-2 border ${errors.city ? 'border-red-500' : 'border-neutral-300'} rounded-sm`}
            />
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
          </div>

          {/* Postal Code */}
          <div>
            <label htmlFor="postalCode" className="block text-sm mb-1">
              Postal Code *
            </label>
            <input
              type="text"
              id="postalCode"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              className={`w-full p-2 border ${errors.postalCode ? 'border-red-500' : 'border-neutral-300'} rounded-sm`}
            />
            {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
          </div>
        </div>

        {/* Province */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="province" className="block text-sm mb-1">
              Province *
            </label>
            <input
              type="text"
              id="province"
              name="province"
              value={formData.province}
              onChange={handleChange}
              className={`w-full p-2 border ${errors.province ? 'border-red-500' : 'border-neutral-300'} rounded-sm`}
            />
            {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province}</p>}
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country" className="block text-sm mb-1">
              Country *
            </label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full p-2 border border-neutral-300 rounded-sm"
            >
              <option value="Indonesia">Indonesia</option>
              <option value="Malaysia">Malaysia</option>
              <option value="Singapore">Singapore</option>
              <option value="Thailand">Thailand</option>
            </select>
          </div>
        </div>

        {/* Default Address Checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isDefault"
            name="isDefault"
            checked={formData.isDefault}
            onChange={handleChange}
            className="h-4 w-4 text-neutral-900 border-neutral-300 rounded"
          />
          <label htmlFor="isDefault" className="ml-2 block text-sm text-neutral-700">
            Set as default address
          </label>
        </div>

        {/* Form Buttons */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-neutral-300 hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
          >
            {initialData ? 'Update Address' : 'Save Address'}
          </button>
        </div>
      </form>
    </div>
  );
} 