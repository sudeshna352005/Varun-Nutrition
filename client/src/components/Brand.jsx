import React from 'react';

const Brand = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: { img: 'h-8', text: 'text-lg' },
    md: { img: 'h-12', text: 'text-2xl' },
    lg: { img: 'h-16', text: 'text-4xl' },
    xl: { img: 'h-24', text: 'text-6xl' }
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/assets/logo.png"
        alt="Varun Nutritions Logo"
        className={`${currentSize.img} w-auto object-contain`}
      />
      <span className={`font-bold tracking-tight text-white ${currentSize.text}`}>
        Varun Nutritions
      </span>
    </div>
  );
};

export default Brand;
