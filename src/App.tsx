import React, { useState } from 'react';
import Canvas from './components/Canvas';
import ImageCatalog from './components/ImageCatalog';

const App: React.FC = () => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const handleSelectImage = (src: string) => {
    setSelectedImages((prevImages) => [...prevImages, src]);
  };

  return (
    <div>
      <h1>Siluetas de PNGs</h1>
      <ImageCatalog onSelectImage={handleSelectImage} />
      <Canvas lineWidth={20} color="#00FF00" imageSrcs={selectedImages} />
    </div>
  );
};

export default App;
