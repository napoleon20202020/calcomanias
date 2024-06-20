import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';

interface CanvasProps {
  lineWidth: number;
  color: string;
  gradientColor1: string;
  gradientColor2: string;
  useGradient: boolean;
  imageSrcs: string[];
}

interface ImageItem {
  id: string;
  src: string;
}

const Canvas: React.FC<CanvasProps> = ({
  lineWidth,
  color,
  gradientColor1,
  gradientColor2,
  useGradient,
  imageSrcs
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [loadedImages, setLoadedImages] = useState<ImageItem[]>([]);
  const selectedImageRef = useRef<fabric.Image | null>(null);
  const imageMapRef = useRef<Map<fabric.Image, { silhouette: fabric.Image, color: string, gradientColor1: string, gradientColor2: string, useGradient: boolean }>>(new Map());

  useEffect(() => {
    if (canvasRef.current) {
      fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
        preserveObjectStacking: true,
        selection: false, // Desactiva la selección múltiple
      });

      fabricCanvasRef.current.on('mouse:down', (options) => {
        if (options.target && options.target.type === 'image') {
          selectedImageRef.current = options.target as fabric.Image;
        } else {
          selectedImageRef.current = null;
        }
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
      setLoadedImages((prev) => [...prev, newImage]);
    }
  }, [imageSrcs]);

  useEffect(() => {
    if (selectedImageRef.current) {
      updateSilhouette(selectedImageRef.current, color, gradientColor1, gradientColor2, useGradient);
      const currentSilhouette = imageMapRef.current.get(selectedImageRef.current)?.silhouette!;
      imageMapRef.current.set(selectedImageRef.current, {
        silhouette: currentSilhouette,
        color: color,
        gradientColor1: gradientColor1,
        gradientColor2: gradientColor2,
        useGradient: useGradient
      });
    }
  }, [color, gradientColor1, gradientColor2, useGradient]);

  const createSilhouetteImage = (
    imgElement: HTMLImageElement,
    margin = 20,
    silhouetteColor = '#ffffff',
    gradientColor1 = '#ffffff',
    gradientColor2 = '#ffffff',
    useGradient = false
  ): string => {
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = imgElement.width + margin * 2;
    offscreenCanvas.height = imgElement.height + margin * 2;
    const offscreenCtx = offscreenCanvas.getContext('2d');

    if (offscreenCtx) {
      offscreenCtx.drawImage(imgElement, margin, margin);
      const imageData = offscreenCtx.getImageData(margin, margin, imgElement.width, imgElement.height);
      const data = imageData.data;

      offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

      if (useGradient) {
        const gradient = offscreenCtx.createLinearGradient(0, 0, offscreenCanvas.width, 0);
        gradient.addColorStop(0, gradientColor1);
        gradient.addColorStop(1, gradientColor2);
        offscreenCtx.strokeStyle = gradient;
      } else {
        offscreenCtx.strokeStyle = silhouetteColor;
      }

      offscreenCtx.lineWidth = margin * 2;

      const edgePoints: [number, number][] = [];
      for (let y = 1; y < imgElement.height - 1; y++) {
        for (let x = 1; x < imgElement.width - 1; x++) {
          const alpha = data[(y * imgElement.width + x) * 4 + 3];
          if (alpha > 0 && isEdge(data, imgElement.width, imgElement.height, x, y)) {
            edgePoints.push([x + margin, y + margin]);
          }
        }
      }

      offscreenCtx.beginPath();
      edgePoints.forEach(([x, y]) => {
        offscreenCtx.moveTo(x, y);
        offscreenCtx.arc(x, y, margin / 2, 0, 2 * Math.PI);
      });
      offscreenCtx.stroke();
    }

    return offscreenCanvas.toDataURL();
  };

  const isEdge = (data: Uint8ClampedArray, width: number, height: number, x: number, y: number): boolean => {
    const index = (y * width + x) * 4 + 3;
    if (data[index] === 0) return false;
    const neighbors = [
      [-1, -1], [0, -1], [1, -1],
      [-1, 0], [1, 0],
      [-1, 1], [0, 1], [1, 1]
    ];
    return neighbors.some(([dx, dy]) => {
      const ni = (y + dy) * width + (x + dx);
      return data[ni * 4 + 3] === 0;
    });
  };

  const updateSilhouette = (
    image: fabric.Image,
    silhouetteColor: string,
    gradientColor1: string,
    gradientColor2: string,
    useGradient: boolean
  ) => {
    const fabricCanvas = fabricCanvasRef.current;
    const imgElement = image.getElement() as HTMLImageElement;
    const scaleX = image.scaleX || 1;
    const scaleY = image.scaleY || 1;
    const margin = 20 / Math.max(scaleX, scaleY);
    const silhouetteDataURL = createSilhouetteImage(imgElement, margin, silhouetteColor, gradientColor1, gradientColor2, useGradient);
    fabric.Image.fromURL(silhouetteDataURL, (newSilhouetteImg) => {
      const silhouetteImg = imageMapRef.current.get(image)?.silhouette;
      if (silhouetteImg) {
        silhouetteImg.setElement(newSilhouetteImg.getElement());
        silhouetteImg.set({
          left: image.left,
          top: image.top,
          angle: image.angle,
          scaleX: scaleX,
          scaleY: scaleY,
          flipX: image.flipX,
          flipY: image.flipY
        });
        fabricCanvas?.renderAll();
      }
    });
  };

  const addImageToCanvas = (image: ImageItem) => {
    const fabricCanvas = fabricCanvasRef.current;

    if (fabricCanvas) {
      const imgElement = new Image();
      imgElement.src = image.src;
      imgElement.crossOrigin = 'anonymous';
      imgElement.onload = () => {
        fabric.Image.fromURL(image.src, (img) => {
          const canvasCenterX = fabricCanvas.getWidth() / 2;
          const canvasCenterY = fabricCanvas.getHeight() / 2;

          img.set({
            left: canvasCenterX,
            top: canvasCenterY,
            scaleX: 0.5,
            scaleY: 0.5,
            hasBorders: false,
            hasControls: true,
            originX: 'center',
            originY: 'center',
          });

          const silhouetteImg = new fabric.Image(imgElement, {
            left: canvasCenterX,
            top: canvasCenterY,
            scaleX: img.scaleX,
            scaleY: img.scaleY,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            angle: img.angle,
            flipX: img.flipX,
            flipY: img.flipY
          });

          imageMapRef.current.set(img, {
            silhouette: silhouetteImg,
            color: color,
            gradientColor1: gradientColor1,
            gradientColor2: gradientColor2,
            useGradient: useGradient
          });

          function updateSilhouetteTransform() {
            silhouetteImg.set({
              left: img.left,
              top: img.top,
              scaleX: img.scaleX,
              scaleY: img.scaleY,
              angle: img.angle,
              flipX: img.flipX,
              flipY: img.flipY
            });
            fabricCanvas?.renderAll();
          }

          img.on('moving', updateSilhouetteTransform);
          img.on('scaling', updateSilhouetteTransform);
          img.on('rotating', updateSilhouetteTransform);
          img.on('flipping', updateSilhouetteTransform);

          img.on('modified', () => {
            const currentData = imageMapRef.current.get(img);
            if (currentData) {
              updateSilhouette(img, currentData.color, currentData.gradientColor1, currentData.gradientColor2, currentData.useGradient);
            }
          });

          fabricCanvas.add(silhouetteImg);
          fabricCanvas.add(img);
          updateSilhouette(img, color, gradientColor1, gradientColor2, useGradient);
        });
      };
    }
  };

  return (
    <canvas ref={canvasRef} width={800} height={400} style={{ border: '1px solid black', marginBottom: '20px' }} />
  );
};

export default Canvas;
