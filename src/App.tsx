import React, { useState } from 'react';
import Canvas from './components/Canvas';
import ImageCatalog from './components/ImageCatalog';

const App: React.FC = () => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [color, setColor] = useState<string>("#00FF00");
  const [gradientColor1, setGradientColor1] = useState<string>("#FF0000");
  const [gradientColor2, setGradientColor2] = useState<string>("#0000FF");
  const [useGradient, setUseGradient] = useState<boolean>(false);

  const handleSelectImage = (src: string) => {
    setSelectedImages((prevImages) => [...prevImages, src]);
  };

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setColor(event.target.value);
  };

  const handleGradientColor1Change = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGradientColor1(event.target.value);
  };

  const handleGradientColor2Change = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGradientColor2(event.target.value);
  };

  const handleUseGradientChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUseGradient(event.target.checked);
  };

  return (
    <div>
      <h1>Siluetas de PNGs</h1>
      <div>
        <label htmlFor="colorPicker">Elige el color de la silueta:</label>
        <input
          type="color"
          id="colorPicker"
          value={color}
          onChange={handleColorChange}
          disabled={useGradient}
        />
        <label>
          <input
            type="checkbox"
            checked={useGradient}
            onChange={handleUseGradientChange}
          />
          Usar degradado
        </label>
        {useGradient && (
          <div>
            <label htmlFor="gradientColor1Picker">Color del degradado 1:</label>
            <input
              type="color"
              id="gradientColor1Picker"
              value={gradientColor1}
              onChange={handleGradientColor1Change}
            />
            <label htmlFor="gradientColor2Picker">Color del degradado 2:</label>
            <input
              type="color"
              id="gradientColor2Picker"
              value={gradientColor2}
              onChange={handleGradientColor2Change}
            />
          </div>
        )}
      </div>
      <ImageCatalog onSelectImage={handleSelectImage} />
      <Canvas
        lineWidth={20}
        color={color}
        gradientColor1={gradientColor1}
        gradientColor2={gradientColor2}
        useGradient={useGradient}
        imageSrcs={selectedImages}
      />
    </div>
  );
};

export default App;
