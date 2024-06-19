import React from 'react';

interface ImageCatalogProps {
  onSelectImage: (src: string) => void;
}

const ImageCatalog: React.FC<ImageCatalogProps> = ({ onSelectImage }) => {
  const images = [
    process.env.PUBLIC_URL + '/images/MM1.png',
    process.env.PUBLIC_URL + '/images/RM4.png',
  ];

  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
      {images.map((src, index) => (
        <img
          key={index}
          src={src}
          alt={`Imagen ${index + 1}`}
          style={{ cursor: 'pointer', width: '100px', height: '100px', objectFit: 'cover' }}
          onClick={() => onSelectImage(src)}
        />
      ))}
    </div>
  );
};

export default ImageCatalog;
