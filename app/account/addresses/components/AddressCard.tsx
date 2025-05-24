'use client';

import React from 'react';

interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface AddressCardProps {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}

export default function AddressCard({ address, onEdit, onDelete, onSetDefault }: AddressCardProps) {
  // Handle delete with confirmation
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      onDelete();
    }
  };

  return (
    <div className={`border ${address.isDefault ? 'border-neutral-400' : 'border-neutral-200'} p-4 rounded-sm bg-white relative`}>
      {/* Default Badge */}
      {address.isDefault && (
        <div className="absolute top-0 right-0 transform translate-x-1 -translate-y-1">
          <span className="bg-neutral-900 text-white text-xs py-1 px-2 rounded-sm">
            Default
          </span>
        </div>
      )}

      {/* Address Content */}
      <div className="mb-4">
        <h4 className="font-medium">{address.name}</h4>
        <p className="text-sm text-neutral-600 mt-1">{address.phone}</p>
        <div className="text-sm text-neutral-600 mt-2">
          <p>{address.address}</p>
          <p>
            {address.city}, {address.province}, {address.postalCode}
          </p>
          <p>{address.country}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mt-4 border-t border-neutral-100 pt-4">
        <button
          onClick={onEdit}
          className="text-xs px-3 py-1 border border-neutral-300 hover:bg-neutral-50 transition-colors rounded-sm"
        >
          Edit
        </button>
        
        <button
          onClick={handleDelete}
          className="text-xs px-3 py-1 border border-red-200 text-red-600 hover:bg-red-50 transition-colors rounded-sm"
        >
          Delete
        </button>
        
        {!address.isDefault && (
          <button
            onClick={onSetDefault}
            className="text-xs px-3 py-1 border border-neutral-300 hover:bg-neutral-50 transition-colors rounded-sm"
          >
            Set as Default
          </button>
        )}
      </div>
    </div>
  );
} 