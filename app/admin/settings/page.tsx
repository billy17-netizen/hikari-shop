'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

// Helper function to parse setting value based on type
const parseSettingValue = (value: string, type: 'string' | 'boolean' | 'number'): string | boolean | number => {
  if (type === 'boolean') {
    return value === 'true';
  } else if (type === 'number') {
    return parseFloat(value);
  }
  return value;
};

// Helper function to format setting value for database
const formatSettingValue = (value: string | boolean | number): string => {
  if (typeof value === 'boolean' || typeof value === 'number') {
    return value.toString();
  }
  return value;
};

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState<string | null>(null);
  
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Hikari Shop',
    siteDescription: 'Modern fashion store with high quality products',
    contactEmail: 'support@hikarishop.com',
    phoneNumber: '+62 123 456 7890'
  });

  const [shippingSettings, setShippingSettings] = useState({
    enableFreeShipping: true,
    freeShippingThreshold: 500000,
    defaultShippingFee: 25000
  });

  const [paymentSettings, setPaymentSettings] = useState({
    enableMidtrans: true,
    enableCashOnDelivery: true,
    maxCODAmount: 5000000
  });
  
  const [storeSettings, setStoreSettings] = useState({
    maintenanceMode: false
  });

  // Fetch settings from the database
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all settings
        const response = await fetch('/api/admin/settings');
        
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        
        const data = await response.json();
        
        // Group settings by category
        const settings = data.settings.reduce((acc: any, setting: any) => {
          if (!acc[setting.category]) {
            acc[setting.category] = {};
          }
          
          // Parse value based on expected type
          let parsedValue;
          
          if (setting.key === 'enableFreeShipping' || setting.key === 'enableMidtrans' || 
              setting.key === 'enableCashOnDelivery' || setting.key === 'maintenanceMode') {
            parsedValue = setting.value === 'true';
          } else if (setting.key === 'freeShippingThreshold' || setting.key === 'defaultShippingFee' || 
                     setting.key === 'maxCODAmount') {
            parsedValue = parseFloat(setting.value);
          } else {
            parsedValue = setting.value;
          }
          
          acc[setting.category][setting.key] = parsedValue;
          return acc;
        }, {});
        
        // Set state with fetched settings
        if (settings.general) setGeneralSettings(settings.general);
        if (settings.shipping) setShippingSettings(settings.shipping);
        if (settings.payment) setPaymentSettings(settings.payment);
        if (settings.store) setStoreSettings(settings.store);
        
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGeneralSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setShippingSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setPaymentSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };
  
  const handleStoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setStoreSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSaveSettings = async (section: string) => {
    try {
      setSaveLoading(section);
      
      let settingsToUpdate: { category: string, key: string, value: string }[] = [];
      
      // Prepare settings based on section
      if (section === 'General') {
        settingsToUpdate = Object.entries(generalSettings).map(([key, value]) => ({
          category: 'general',
          key,
          value: formatSettingValue(value)
        }));
      } else if (section === 'Shipping') {
        settingsToUpdate = Object.entries(shippingSettings).map(([key, value]) => ({
          category: 'shipping',
          key,
          value: formatSettingValue(value)
        }));
      } else if (section === 'Payment') {
        settingsToUpdate = Object.entries(paymentSettings).map(([key, value]) => ({
          category: 'payment',
          key,
          value: formatSettingValue(value)
        }));
      } else if (section === 'Store') {
        settingsToUpdate = Object.entries(storeSettings).map(([key, value]) => ({
          category: 'store',
          key,
          value: formatSettingValue(value)
        }));
      }
      
      // Send update request
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: settingsToUpdate }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      toast.success(`${section} settings saved successfully!`);
    } catch (error) {
      console.error(`Error saving ${section} settings:`, error);
      toast.error(`Failed to save ${section} settings`);
    } finally {
      setSaveLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-monument mb-2">Admin Settings</h1>
        <p className="text-neutral-600">Configure your store settings</p>
      </div>

      {/* General Settings Section */}
      <div className="bg-white p-6 rounded-sm shadow-sm mb-8">
        <h2 className="text-lg font-monument mb-4">General Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Site Name
            </label>
            <input
              type="text"
              name="siteName"
              value={generalSettings.siteName}
              onChange={handleGeneralChange}
              className="w-full p-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-800"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              name="contactEmail"
              value={generalSettings.contactEmail}
              onChange={handleGeneralChange}
              className="w-full p-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-800"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Site Description
            </label>
            <input
              type="text"
              name="siteDescription"
              value={generalSettings.siteDescription}
              onChange={handleGeneralChange}
              className="w-full p-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-800"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              name="phoneNumber"
              value={generalSettings.phoneNumber}
              onChange={handleGeneralChange}
              className="w-full p-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-800"
            />
          </div>
        </div>
        
        <button
          onClick={() => handleSaveSettings('General')}
          disabled={saveLoading === 'General'}
          className={`bg-neutral-900 text-white py-2 px-4 rounded-sm hover:bg-neutral-800 transition-colors ${
            saveLoading === 'General' ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {saveLoading === 'General' ? 'Saving...' : 'Save General Settings'}
        </button>
      </div>

      {/* Shipping Settings Section */}
      <div className="bg-white p-6 rounded-sm shadow-sm mb-8">
        <h2 className="text-lg font-monument mb-4">Shipping Settings</h2>
        
        <div className="mb-4">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="enableFreeShipping"
              name="enableFreeShipping"
              checked={shippingSettings.enableFreeShipping}
              onChange={handleShippingChange}
              className="h-4 w-4 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-800"
            />
            <label htmlFor="enableFreeShipping" className="ml-2 text-sm text-neutral-700">
              Enable Free Shipping
            </label>
          </div>
          
          {shippingSettings.enableFreeShipping && (
            <div className="ml-6 mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Free Shipping Threshold (Rp)
              </label>
              <input
                type="number"
                name="freeShippingThreshold"
                value={shippingSettings.freeShippingThreshold}
                onChange={handleShippingChange}
                className="w-full p-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-800"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Orders above this amount qualify for free shipping
              </p>
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Default Shipping Fee (Rp)
            </label>
            <input
              type="number"
              name="defaultShippingFee"
              value={shippingSettings.defaultShippingFee}
              onChange={handleShippingChange}
              className="w-full p-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-800"
            />
          </div>
        </div>
        
        <button
          onClick={() => handleSaveSettings('Shipping')}
          disabled={saveLoading === 'Shipping'}
          className={`bg-neutral-900 text-white py-2 px-4 rounded-sm hover:bg-neutral-800 transition-colors ${
            saveLoading === 'Shipping' ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {saveLoading === 'Shipping' ? 'Saving...' : 'Save Shipping Settings'}
        </button>
      </div>

      {/* Payment Settings Section */}
      <div className="bg-white p-6 rounded-sm shadow-sm mb-8">
        <h2 className="text-lg font-monument mb-4">Payment Settings</h2>
        
        <div className="mb-4">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="enableMidtrans"
              name="enableMidtrans"
              checked={paymentSettings.enableMidtrans}
              onChange={handlePaymentChange}
              className="h-4 w-4 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-800"
            />
            <label htmlFor="enableMidtrans" className="ml-2 text-sm text-neutral-700">
              Enable Midtrans Payment Gateway
            </label>
          </div>
          
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="enableCashOnDelivery"
              name="enableCashOnDelivery"
              checked={paymentSettings.enableCashOnDelivery}
              onChange={handlePaymentChange}
              className="h-4 w-4 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-800"
            />
            <label htmlFor="enableCashOnDelivery" className="ml-2 text-sm text-neutral-700">
              Enable Cash on Delivery
            </label>
          </div>
          
          {paymentSettings.enableCashOnDelivery && (
            <div className="ml-6 mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Maximum COD Amount (Rp)
              </label>
              <input
                type="number"
                name="maxCODAmount"
                value={paymentSettings.maxCODAmount}
                onChange={handlePaymentChange}
                className="w-full p-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-800"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Orders above this amount cannot be paid with Cash on Delivery
              </p>
            </div>
          )}
        </div>
        
        <button
          onClick={() => handleSaveSettings('Payment')}
          disabled={saveLoading === 'Payment'}
          className={`bg-neutral-900 text-white py-2 px-4 rounded-sm hover:bg-neutral-800 transition-colors ${
            saveLoading === 'Payment' ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {saveLoading === 'Payment' ? 'Saving...' : 'Save Payment Settings'}
        </button>
      </div>

      {/* Store Status Section */}
      <div className="bg-white p-6 rounded-sm shadow-sm mb-8">
        <h2 className="text-lg font-monument mb-4">Store Status</h2>
        
        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-sm">
          <div>
            <h3 className="font-medium">Maintenance Mode</h3>
            <p className="text-sm text-neutral-600">
              Temporarily close your store for maintenance
            </p>
          </div>
          
          <div className="flex items-center">
            <div className="mr-4">
              <input
                type="checkbox"
                id="maintenanceMode"
                name="maintenanceMode"
                checked={storeSettings.maintenanceMode}
                onChange={handleStoreChange}
                className="h-4 w-4 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-800"
              />
              <label htmlFor="maintenanceMode" className="ml-2 text-sm text-neutral-700">
                Enable
              </label>
            </div>
            
            <button
              onClick={() => handleSaveSettings('Store')}
              disabled={saveLoading === 'Store'}
              className={`bg-neutral-600 text-white py-2 px-4 rounded-sm hover:bg-neutral-700 transition-colors ${
                saveLoading === 'Store' ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {saveLoading === 'Store' ? 'Saving...' : 'Save Status'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 