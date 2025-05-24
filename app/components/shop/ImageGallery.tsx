'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ImageGalleryProps {
  images: string[];
  altText: string;
  thumbnailMode?: boolean;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, altText, thumbnailMode = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  
  // Use first image or fallback
  const mainImage = images && images.length > 0 ? images[0] : '/images/placeholder-product.jpg';
  const displayedImage = images && images.length > 0 ? images[currentIndex] : '/images/placeholder-product.jpg';

  const nextImage = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const openPreview = () => {
    setShowPreview(true);
    document.body.style.overflow = 'hidden';
  };

  const closePreview = () => {
    setShowPreview(false);
    document.body.style.overflow = '';
  };

  // Thumbnail mode for slide-up sheet
  if (thumbnailMode) {
    return (
      <>
        <div 
          className="relative aspect-square w-20 h-20 bg-neutral-100 rounded-md overflow-hidden flex-shrink-0 cursor-pointer"
          onClick={openPreview}
        >
          <Image
            src={mainImage}
            alt={`${altText} - 1`}
            fill
            className="object-cover hover:scale-110 transition-transform duration-300"
            sizes="80px"
          />
        </div>

        {/* Full screen preview for thumbnail */}
        {showPreview && (
          <div 
            className="fixed inset-0 z-[10000] bg-black flex items-center justify-center"
            onClick={closePreview}
          >
            {/* Close button */}
            <button 
              className="absolute top-4 right-4 text-white z-20 p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70"
              onClick={(e) => {
                e.stopPropagation();
                closePreview();
              }}
              aria-label="Close preview"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation arrows (only if multiple images) */}
            {images.length > 1 && (
              <>
                <button 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-50 p-3 rounded-full text-white hover:bg-opacity-70"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  aria-label="Previous image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button 
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-50 p-3 rounded-full text-white hover:bg-opacity-70"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  aria-label="Next image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            
            {/* Main preview image */}
            <div className="absolute inset-0">
              <Image
                src={images[currentIndex] || '/images/placeholder-product.jpg'}
                alt={`${altText} - ${currentIndex + 1}`}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
              
              {/* Image counter */}
              {images.length > 1 && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                  {currentIndex + 1} / {images.length}
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }
  
  // Full gallery mode for modal
  return (
    <div className="relative aspect-square w-full rounded-md overflow-hidden">
      <Image
        src={displayedImage}
        alt={`${altText} - ${currentIndex + 1}`}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      
      {/* Navigation arrows (only if multiple images) */}
      {images.length > 1 && (
        <>
          <button 
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 p-2 rounded-full text-white hover:bg-opacity-70"
            onClick={prevImage}
            aria-label="Previous image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 p-2 rounded-full text-white hover:bg-opacity-70"
            onClick={nextImage}
            aria-label="Next image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Image counter */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
};

export default ImageGallery; 