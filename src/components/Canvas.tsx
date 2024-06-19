import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';

interface CanvasProps {
  lineWidth: number;
  color: string;
  imageSrcs: string[];
}

interface ImageItem {
  id: string;
  src: string;
}

const Canvas: React.FC<CanvasProps> = ({ lineWidth, color, imageSrcs }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [loadedImages, setLoadedImages] = useState<ImageItem[]>([]);

  useEffect(() => {
    if (canvasRef.current) {
      fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
        preserveObjectStacking: true,
      });
    }

    return () => {
      fabricCanvasRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (imageSrcs.length > 0) {
      const newImageSrc = imageSrcs[imageSrcs.length - 1];
      const newImage = { id: `${newImageSrc}-${Date.now()}-${Math.random()}`, src: newImageSrc };
      addImageToCanvas(newImage);
      setLoadedImages(prev => [...prev, newImage]);
    }
  }, [imageSrcs]);

  const addImageToCanvas = (image: ImageItem) => {
    const fabricCanvas = fabricCanvasRef.current;

    if (fabricCanvas) {
      fabric.Image.fromURL(image.src, (img) => {
        if (fabricCanvas.width && fabricCanvas.height) {
          img.set({
            left: fabricCanvas.width / 2 - img.width! / 2,
            top: fabricCanvas.height / 2 - img.height! / 2,
            selectable: true, // Hacer que la imagen sea movible y redimensionable
          });
        }

        // Dibujar la silueta antes de añadir la imagen
        const imgElement = img.getElement() as HTMLImageElement;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imgElement.width;
        tempCanvas.height = imgElement.height;
        const tempCtx = tempCanvas.getContext('2d');

        if (tempCtx) {
          tempCtx.drawImage(imgElement, 0, 0);
          const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          const data = imageData.data;

          const gradient = tempCtx.createLinearGradient(0, 0, tempCanvas.width, 0);
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, color);

          tempCtx.strokeStyle = gradient;
          tempCtx.lineWidth = lineWidth;
          tempCtx.beginPath();

          for (let y = 0; y < tempCanvas.height; y++) {
            for (let x = 0; x < tempCanvas.width; x++) {
              const alpha = data[(y * tempCanvas.width + x) * 4 + 3];
              if (alpha > 0 && isEdge(data, tempCanvas.width, tempCanvas.height, x, y)) {
                tempCtx.moveTo(x, y);
                tempCtx.arc(x, y, lineWidth / 2, 0, 2 * Math.PI);
              }
            }
          }
          tempCtx.stroke();

          const tempImage = new Image();
          tempImage.src = tempCanvas.toDataURL();
          tempImage.onload = () => {
            const silhouette = new fabric.Image(tempImage, {
              left: img.left,
              top: img.top,
              selectable: false,
            });

            // Crear un grupo con la imagen y la silueta
            const group = new fabric.Group([silhouette, img], {
              left: img.left,
              top: img.top,
              selectable: true,
            });

            fabricCanvas.add(group);
            fabricCanvas.renderAll();
          };
        }
      });
    }
  };

  const isEdge = (data: Uint8ClampedArray, width: number, height: number, x: number, y: number) => {
    const neighbors = [
      [x - 1, y - 1], [x, y - 1], [x + 1, y - 1],
      [x - 1, y],                 [x + 1, y],
      [x - 1, y + 1], [x, y + 1], [x + 1, y + 1]
    ];

    for (let i = 0; i < neighbors.length; i++) {
      const nx = neighbors[i][0];
      const ny = neighbors[i][1];
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const alpha = data[(ny * width + nx) * 4 + 3];
        if (alpha === 0) {
          return true;
        }
      }
    }

    return false;
  };

  return (
    <canvas ref={canvasRef} width={800} height={400} style={{ border: '1px solid black', marginBottom: '20px' }} />
  );
};

export default Canvas;
