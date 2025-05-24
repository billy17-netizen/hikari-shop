'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

export interface ShippingInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  country: string;
}

interface AddressFormData {
  name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

interface ShippingFormProps {
  formData: ShippingInfo;
  onChange: (data: ShippingInfo) => void;
  onSubmit: (data: ShippingInfo) => void;
  loading?: boolean;
  savedAddresses?: Array<{
    id: string;
    name: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }>;
  onAddressSelect?: (addressId: string | null) => void;
  onAddressAdded?: () => Promise<void>;
}

export interface ShippingFormHandle {
  isFormValid: () => boolean;
}

const ShippingForm = forwardRef<ShippingFormHandle, ShippingFormProps>(({ 
  formData, 
  onChange,
  onSubmit, 
  loading = false,
  savedAddresses = [],
  onAddressSelect,
  onAddressAdded
}, ref) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddressErrors, setNewAddressErrors] = useState<Record<string, string>>({});
  const [newAddressData, setNewAddressData] = useState<AddressFormData>({
    name: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    isDefault: false
  });
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    isFormValid: () => {
      const valid = validateForm();
      if (valid) {
        // If valid, we can proceed
        return true;
      }
      return false;
    }
  }));
  
  // Set default address when addresses are loaded
  useEffect(() => {
    if (savedAddresses.length > 0 && !selectedAddressId) {
      const defaultAddress = savedAddresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        fillAddressForm(defaultAddress);
      }
    }
  }, [savedAddresses]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange({ 
      ...formData, 
      [name]: value,
      country: 'Indonesia' // Always keep Indonesia as the country
    });
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Check if an address is selected
    if (!selectedAddressId && savedAddresses.length > 0) {
      newErrors.address = 'Please select an address';
      setErrors(newErrors);
      return false;
    }
    
    // Ensure country is set to Indonesia even if not visible
    formData.country = 'Indonesia';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  // Fill form with selected address
  const fillAddressForm = (address: any) => {
    onChange({
      ...formData,
      fullName: address.name,
      phone: address.phone,
      address: address.address,
      city: address.city,
      province: address.province,
      postalCode: address.postalCode,
      country: address.country
    });
  };
  
  // Updated handle address selection to notify the parent
  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    const selectedAddress = savedAddresses.find(addr => addr.id === addressId);
    if (selectedAddress) {
      fillAddressForm(selectedAddress);
      if (onAddressSelect) {
        onAddressSelect(addressId);
      }
    }
  };
  
  // When clearing the selection, also notify the parent
  const clearAddressSelection = () => {
    setSelectedAddressId(null);
    onChange({
      fullName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      province: '',
      country: 'Indonesia'
    });
    if (onAddressSelect) {
      onAddressSelect(null);
    }
  };
  
  // Handle new address form input changes
  const handleNewAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : false;
    
    setNewAddressData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when field is changed
    if (newAddressErrors[name]) {
      setNewAddressErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate new address form
  const validateNewAddressForm = () => {
    const errors: Record<string, string> = {};
    const requiredFields = ['name', 'phone', 'address', 'city', 'province', 'postalCode'];
    
    requiredFields.forEach(field => {
      const value = newAddressData[field as keyof AddressFormData];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors[field] = 'This field is required';
      }
    });
    
    // Phone validation
    if (newAddressData.phone && !/^\d{10,14}$/.test(newAddressData.phone.replace(/[^0-9]/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    setNewAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add function to start editing an address
  const handleEditAddress = (addressId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent address selection when clicking edit
    const address = savedAddresses.find(addr => addr.id === addressId);
    if (address) {
      // Set up form with address data
      setNewAddressData({
        name: address.name,
        phone: address.phone,
        address: address.address,
        city: address.city,
        province: address.province,
        postalCode: address.postalCode,
        isDefault: address.isDefault
      });
      setEditingAddressId(addressId);
      setShowAddAddressForm(true);
    }
  };
  
  // Modify handleAddNewAddress to handle updates
  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateNewAddressForm()) {
      return;
    }
    
    try {
      setAddingAddress(true);
      
      if (editingAddressId) {
        // Update existing address
        const response = await fetch(`/api/addresses/${editingAddressId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...newAddressData,
            country: 'Indonesia' // Always set country to Indonesia
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update address');
        }
        
        // Reset editing state
        setEditingAddressId(null);
      } else {
        // Add new address
        const response = await fetch('/api/addresses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...newAddressData,
            country: 'Indonesia' // Always set country to Indonesia
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to add address');
        }
        
        const newAddress = await response.json();
        
        // If set as default or it's the first address, select it automatically
        if (newAddressData.isDefault || savedAddresses.length === 0) {
          handleAddressSelect(newAddress.id);
        }
      }
      
      // Reset form
      setNewAddressData({
        name: '',
        phone: '',
        address: '',
        city: '',
        province: '',
        postalCode: '',
        isDefault: false
      });
      
      // Hide form
      setShowAddAddressForm(false);
      
      // Refresh addresses list via parent component
      if (onAddressAdded) {
        await onAddressAdded();
      }
      
    } catch (error) {
      console.error('Error managing address:', error);
      setNewAddressErrors({ form: `Failed to ${editingAddressId ? 'update' : 'add'} address. Please try again.` });
    } finally {
      setAddingAddress(false);
    }
  };
  
  return (
    <div className="bg-white p-4 sm:p-6 border border-neutral-200 rounded overflow-x-hidden">
      <h2 className="text-xl font-semibold mb-6">Shipping Information</h2>
      
      {/* Saved Addresses Section */}
      {savedAddresses.length > 0 ? (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm uppercase tracking-wider text-neutral-500">Saved Addresses</h3>
            <button 
              type="button" 
              onClick={() => {
                setEditingAddressId(null);
                setNewAddressData({
                  name: '',
                  phone: '',
                  address: '',
                  city: '',
                  province: '',
                  postalCode: '',
                  isDefault: false
                });
                setShowAddAddressForm(!showAddAddressForm);
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              {showAddAddressForm ? 'Cancel' : '+ Add New Address'}
            </button>
          </div>
          <p className="text-neutral-600 text-sm mb-4">Please select a shipping address</p>
          
          {/* Add New Address Form */}
          {showAddAddressForm && (
            <div className="mb-6 p-4 border border-neutral-200 rounded bg-neutral-50">
              <h4 className="font-medium mb-4">{editingAddressId ? 'Edit Address' : 'Add New Address'}</h4>
              <form onSubmit={handleAddNewAddress} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm mb-1">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newAddressData.name}
                    onChange={handleNewAddressChange}
                    className={`w-full p-2 border ${newAddressErrors.name ? 'border-red-500' : 'border-neutral-300'} rounded`}
                  />
                  {newAddressErrors.name && <p className="text-red-500 text-xs mt-1">{newAddressErrors.name}</p>}
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={newAddressData.phone}
                    onChange={handleNewAddressChange}
                    className={`w-full p-2 border ${newAddressErrors.phone ? 'border-red-500' : 'border-neutral-300'} rounded`}
                    placeholder="e.g., 08123456789"
                  />
                  {newAddressErrors.phone && <p className="text-red-500 text-xs mt-1">{newAddressErrors.phone}</p>}
                </div>
                
                <div>
                  <label htmlFor="address" className="block text-sm mb-1">Address *</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={newAddressData.address}
                    onChange={handleNewAddressChange}
                    className={`w-full p-2 border ${newAddressErrors.address ? 'border-red-500' : 'border-neutral-300'} rounded`}
                  />
                  {newAddressErrors.address && <p className="text-red-500 text-xs mt-1">{newAddressErrors.address}</p>}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm mb-1">City *</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={newAddressData.city}
                      onChange={handleNewAddressChange}
                      className={`w-full p-2 border ${newAddressErrors.city ? 'border-red-500' : 'border-neutral-300'} rounded`}
                    />
                    {newAddressErrors.city && <p className="text-red-500 text-xs mt-1">{newAddressErrors.city}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="postalCode" className="block text-sm mb-1">Postal Code *</label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={newAddressData.postalCode}
                      onChange={handleNewAddressChange}
                      className={`w-full p-2 border ${newAddressErrors.postalCode ? 'border-red-500' : 'border-neutral-300'} rounded`}
                    />
                    {newAddressErrors.postalCode && <p className="text-red-500 text-xs mt-1">{newAddressErrors.postalCode}</p>}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="province" className="block text-sm mb-1">Province *</label>
                  <input
                    type="text"
                    id="province"
                    name="province"
                    value={newAddressData.province}
                    onChange={handleNewAddressChange}
                    className={`w-full p-2 border ${newAddressErrors.province ? 'border-red-500' : 'border-neutral-300'} rounded`}
                  />
                  {newAddressErrors.province && <p className="text-red-500 text-xs mt-1">{newAddressErrors.province}</p>}
                </div>
                
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    name="isDefault"
                    checked={newAddressData.isDefault}
                    onChange={handleNewAddressChange}
                    className="mr-2"
                  />
                  <label htmlFor="isDefault" className="text-sm">Set as default address</label>
                </div>
                
                {newAddressErrors.form && (
                  <p className="text-red-500 text-sm">{newAddressErrors.form}</p>
                )}
                
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAddressForm(false)}
                    className="px-4 py-2 mr-2 border border-neutral-300 text-sm rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-neutral-900 text-white text-sm rounded hover:bg-neutral-800 transition-colors"
                    disabled={addingAddress}
                  >
                    {addingAddress ? 'Adding...' : 'Save Address'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-3">
            {savedAddresses.map((address) => (
              <div 
                key={address.id}
                className={`border p-3 rounded cursor-pointer overflow-hidden ${
                  selectedAddressId === address.id ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200'
                } ${errors.address ? 'border-red-500' : ''}`}
              >
                <div className="flex justify-between">
                  <div className="flex items-start flex-1 overflow-hidden" onClick={() => handleAddressSelect(address.id)}>
                    <input 
                      type="radio" 
                      id={`address-${address.id}`} 
                      name="savedAddress" 
                      checked={selectedAddressId === address.id} 
                      onChange={() => handleAddressSelect(address.id)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <p className="font-medium text-sm overflow-hidden text-ellipsis">{address.name}</p>
                      <p className="text-sm">{address.phone}</p>
                      <p className="text-sm break-words">{address.address}</p>
                      <p className="text-sm">
                        {address.city}, {address.province}, {address.postalCode}
                      </p>
                      <p className="text-sm">{address.country}</p>
                      {address.isDefault && (
                        <span className="text-xs bg-neutral-200 px-2 py-1 rounded mt-1 inline-block">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleEditAddress(address.id, e)} 
                    className="text-blue-600 text-sm hover:underline p-2 h-8 flex-shrink-0"
                    title="Edit address"
                    type="button"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {errors.address && (
            <p className="text-red-500 text-sm mt-2">{errors.address}</p>
          )}
        </div>
      ) : (
        <div>
          {showAddAddressForm ? (
            <div className="mb-6 p-4 border border-neutral-200 rounded">
              <h4 className="font-medium mb-4">Add New Address</h4>
              <form onSubmit={handleAddNewAddress} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm mb-1">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newAddressData.name}
                    onChange={handleNewAddressChange}
                    className={`w-full p-2 border ${newAddressErrors.name ? 'border-red-500' : 'border-neutral-300'} rounded`}
                  />
                  {newAddressErrors.name && <p className="text-red-500 text-xs mt-1">{newAddressErrors.name}</p>}
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={newAddressData.phone}
                    onChange={handleNewAddressChange}
                    className={`w-full p-2 border ${newAddressErrors.phone ? 'border-red-500' : 'border-neutral-300'} rounded`}
                    placeholder="e.g., 08123456789"
                  />
                  {newAddressErrors.phone && <p className="text-red-500 text-xs mt-1">{newAddressErrors.phone}</p>}
                </div>
                
                <div>
                  <label htmlFor="address" className="block text-sm mb-1">Address *</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={newAddressData.address}
                    onChange={handleNewAddressChange}
                    className={`w-full p-2 border ${newAddressErrors.address ? 'border-red-500' : 'border-neutral-300'} rounded`}
                  />
                  {newAddressErrors.address && <p className="text-red-500 text-xs mt-1">{newAddressErrors.address}</p>}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm mb-1">City *</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={newAddressData.city}
                      onChange={handleNewAddressChange}
                      className={`w-full p-2 border ${newAddressErrors.city ? 'border-red-500' : 'border-neutral-300'} rounded`}
                    />
                    {newAddressErrors.city && <p className="text-red-500 text-xs mt-1">{newAddressErrors.city}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="postalCode" className="block text-sm mb-1">Postal Code *</label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={newAddressData.postalCode}
                      onChange={handleNewAddressChange}
                      className={`w-full p-2 border ${newAddressErrors.postalCode ? 'border-red-500' : 'border-neutral-300'} rounded`}
                    />
                    {newAddressErrors.postalCode && <p className="text-red-500 text-xs mt-1">{newAddressErrors.postalCode}</p>}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="province" className="block text-sm mb-1">Province *</label>
                  <input
                    type="text"
                    id="province"
                    name="province"
                    value={newAddressData.province}
                    onChange={handleNewAddressChange}
                    className={`w-full p-2 border ${newAddressErrors.province ? 'border-red-500' : 'border-neutral-300'} rounded`}
                  />
                  {newAddressErrors.province && <p className="text-red-500 text-xs mt-1">{newAddressErrors.province}</p>}
                </div>
                
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    name="isDefault"
                    checked={newAddressData.isDefault}
                    onChange={handleNewAddressChange}
                    className="mr-2"
                  />
                  <label htmlFor="isDefault" className="text-sm">Set as default address</label>
                </div>
                
                {newAddressErrors.form && (
                  <p className="text-red-500 text-sm">{newAddressErrors.form}</p>
                )}
                
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAddressForm(false)}
                    className="px-4 py-2 mr-2 border border-neutral-300 text-sm rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-neutral-900 text-white text-sm rounded hover:bg-neutral-800 transition-colors"
                    disabled={addingAddress}
                  >
                    {addingAddress ? 'Adding...' : 'Save Address'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-yellow-50 p-4 border border-yellow-200 rounded mb-6">
              <p className="text-yellow-800 mb-4">No saved addresses found. Please add an address to continue.</p>
              <button
                type="button"
                onClick={() => setShowAddAddressForm(true)}
                className="px-4 py-2 bg-neutral-900 text-white text-sm rounded hover:bg-neutral-800 transition-colors"
              >
                Add New Address
              </button>
            </div>
          )}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Submit Button removed as it's now in CheckoutSummary */}
      </form>
    </div>
  );
});

export default ShippingForm; 