/**
 * Format a number as Indonesian Rupiah (IDR)
 * @param price - Price value as number or string
 * @returns Formatted price string with Rp symbol and thousand separators
 */
export function formatRupiah(price: string | number): string {
  // Convert to number if it's a string
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // Format with Indonesian locale (id-ID)
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numPrice);
} 