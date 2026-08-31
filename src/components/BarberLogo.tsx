import React from 'react';

interface BarberLogoProps {
  className?: string;
  variant?: 'full' | 'emblem';
}

export default function BarberLogo({ className = 'h-16', variant = 'full' }: BarberLogoProps) {
  const imageUrl = "https://github.com/barbeariadowarley/barbeariawarleyarquivos-/blob/main/logo%20warley.png?raw=true";

  if (variant === 'emblem') {
    // When rendering as an emblem (just the head silhouette), we crop the left side of the full logo image.
    return (
      <div className={`overflow-hidden relative inline-block ${className}`} style={{ aspectRatio: '1/1' }}>
        <img
          src={imageUrl}
          alt="Barbearia do Warley Emblem"
          referrerPolicy="no-referrer"
          className="absolute max-w-none"
          style={{
            height: '100%',
            width: 'auto',
            left: '-2%', // Slight adjustment to center the head silhouette nicely
            top: '50%',
            transform: 'translate(0, -50%) scale(1.05)', // Boost scale slightly to focus on the silhouette
            objectFit: 'cover'
          }}
        />
      </div>
    );
  }

  // Full brand logo containing silhouette + typography + banner
  return (
    <img
      src={imageUrl}
      alt="Barbearia do Warley Logo"
      referrerPolicy="no-referrer"
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}
