import React from 'react';

const PlaceImg = ({ place, index = 0, className = '' }) => {
  if (!place.photos || place.photos.length === 0) {
    return <div className={`bg-gray-200 ${className}`}>No image</div>;
  }

  const src = place.photos[index]; // backend now sends full URL

  return (
    <img
      className={`object-cover w-full h-full rounded-xl ${className}`}
      src={src}
      alt={place.title || 'Place image'}
    />
  );
};

export default PlaceImg;
