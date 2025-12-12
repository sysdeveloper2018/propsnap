import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, Maximize2 } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

interface CropState {
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  width: number; // Percentage 0-100
  height: number; // Percentage 0-100
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  // Crop State
  const [crop, setCrop] = useState<CropState>({ x: 10, y: 10, width: 80, height: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'resize' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 }); 
  const [cropStart, setCropStart] = useState<CropState>({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    try {
      setError('');
      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Prefer back camera on mobile
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera Error:", err);
      setError('Could not access camera. Please ensure permissions are granted.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Capture full resolution
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
        
        stopCamera();
        setCapturedImage(dataUrl);
        // Reset crop to a centered 80% box
        setCrop({ x: 10, y: 10, width: 80, height: 80 });
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const performCrop = () => {
    if (!capturedImage || !imageRef.current) return capturedImage;
    
    const image = imageRef.current;
    const canvas = document.createElement('canvas');
    
    // Calculate scale factor between displayed image and natural image
    const displayWidth = image.width;
    const displayHeight = image.height;
    
    // Guard against divide by zero if image hasn't rendered dimensions yet
    if (displayWidth === 0 || displayHeight === 0) return capturedImage;

    const scaleX = image.naturalWidth / displayWidth;
    const scaleY = image.naturalHeight / displayHeight;
    
    const cropX = (crop.x / 100) * displayWidth * scaleX;
    const cropY = (crop.y / 100) * displayHeight * scaleY;
    const cropWidth = (crop.width / 100) * displayWidth * scaleX;
    const cropHeight = (crop.height / 100) * displayHeight * scaleY;
    
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
        ctx.drawImage(
            image,
            cropX, cropY, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
        );
        return canvas.toDataURL('image/jpeg', 0.9);
    }
    return capturedImage;
  };

  const handleUsePhoto = () => {
    if (capturedImage) {
      const finalImage = performCrop();
      if (finalImage) {
        onCapture(finalImage);
        onClose();
      }
    }
  };

  // --- Interaction Logic ---

  const handlePointerDown = (e: React.PointerEvent, type: 'move' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
    setDragStart({ x: e.clientX, y: e.clientY });
    setCropStart({ ...crop });
    
    // Capture pointer to track dragging even if cursor leaves the element
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    // Convert pixel delta to percentage delta
    const deltaXPercent = (deltaX / containerWidth) * 100;
    const deltaYPercent = (deltaY / containerHeight) * 100;

    let newCrop = { ...crop };

    if (dragType === 'move') {
        // Move bounds: 0 to (100 - width/height)
        newCrop.x = Math.max(0, Math.min(100 - cropStart.width, cropStart.x + deltaXPercent));
        newCrop.y = Math.max(0, Math.min(100 - cropStart.height, cropStart.y + deltaYPercent));
        newCrop.width = cropStart.width;
        newCrop.height = cropStart.height;
    } else if (dragType === 'resize') {
        // Resize bounds: min 10%, max (100 - x)
        newCrop.width = Math.max(10, Math.min(100 - cropStart.x, cropStart.width + deltaXPercent));
        newCrop.height = Math.max(10, Math.min(100 - cropStart.y, cropStart.height + deltaYPercent));
    }

    setCrop(newCrop);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    setDragType(null);
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-center items-center">
      <div className="absolute top-4 right-4 z-10">
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white backdrop-blur-sm hover:bg-white/20 transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="relative w-full max-w-md flex-1 flex flex-col bg-sabia-dark overflow-hidden rounded-lg shadow-2xl border border-sabia-olive/30 mx-4 my-8">
        {error ? (
           <div className="flex flex-col items-center justify-center h-full text-white p-4 text-center">
             <p className="mb-4 text-sabia-maroon">{error}</p>
             <button onClick={startCamera} className="bg-sabia-olive px-4 py-2 rounded text-white font-medium hover:bg-sabia-olive/80">Retry</button>
           </div>
        ) : capturedImage ? (
           <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden touch-none select-none">
              {/* Container ensures image is centered and overlay matches image size */}
              <div ref={containerRef} className="relative inline-block max-w-full max-h-full">
                  <img 
                    ref={imageRef}
                    src={capturedImage} 
                    alt="Captured" 
                    className="max-w-full max-h-[80vh] object-contain block select-none pointer-events-none" 
                    draggable={false}
                  />
                  
                  {/* Crop Overlay Layer */}
                  <div 
                    className="absolute inset-0 touch-none"
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                  >
                      {/* Dimmed Areas (4 rects) */}
                      {/* Top */}
                      <div className="absolute bg-black/60 top-0 left-0 right-0" style={{ height: `${crop.y}%` }} />
                      {/* Bottom */}
                      <div className="absolute bg-black/60 bottom-0 left-0 right-0" style={{ height: `${100 - (crop.y + crop.height)}%` }} />
                      {/* Left */}
                      <div className="absolute bg-black/60 left-0" style={{ top: `${crop.y}%`, height: `${crop.height}%`, width: `${crop.x}%` }} />
                      {/* Right */}
                      <div className="absolute bg-black/60 right-0" style={{ top: `${crop.y}%`, height: `${crop.height}%`, width: `${100 - (crop.x + crop.width)}%` }} />

                      {/* The Crop Selection Box */}
                      <div 
                        className="absolute cursor-move border-2 border-white shadow-sm touch-none"
                        style={{
                            left: `${crop.x}%`,
                            top: `${crop.y}%`,
                            width: `${crop.width}%`,
                            height: `${crop.height}%`,
                        }}
                        onPointerDown={(e) => handlePointerDown(e, 'move')}
                      >
                         {/* Grid Lines Rule of Thirds */}
                         <div className="absolute inset-0 flex flex-col pointer-events-none opacity-40">
                            <div className="flex-1 border-b border-white/30" />
                            <div className="flex-1 border-b border-white/30" />
                            <div className="flex-1" />
                         </div>
                         <div className="absolute inset-0 flex pointer-events-none opacity-40">
                            <div className="flex-1 border-r border-white/30" />
                            <div className="flex-1 border-r border-white/30" />
                            <div className="flex-1" />
                         </div>

                         {/* Resize Handle (Bottom Right) */}
                         <div 
                            className="absolute -bottom-4 -right-4 w-10 h-10 flex items-center justify-center cursor-nwse-resize z-20 touch-none"
                            onPointerDown={(e) => handlePointerDown(e, 'resize')}
                         >
                            <div className="w-5 h-5 bg-sabia-olive rounded-full shadow-md border-2 border-white" />
                         </div>
                      </div>
                  </div>
              </div>
           </div>
        ) : (
          <div className="w-full h-full relative">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
            />
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="w-full pb-8 pt-4 px-4 flex justify-center bg-black/50 backdrop-blur-md">
        {capturedImage ? (
            <div className="flex gap-4 items-center w-full max-w-sm justify-between px-4">
                <button 
                    onClick={handleRetake}
                    className="flex flex-col items-center gap-1 group"
                >
                    <div className="p-3 bg-white/10 rounded-full border border-white/20 group-hover:bg-white/20 transition-colors">
                        <RefreshCw size={20} className="text-sabia-silver" />
                    </div>
                    <span className="text-[10px] font-bold text-sabia-silver uppercase tracking-widest">Retake</span>
                </button>
                
                <div className="text-sabia-silver text-xs font-medium text-center opacity-60">
                    Drag box to move<br/>Drag dot to resize
                </div>

                <button 
                    onClick={handleUsePhoto}
                    className="flex flex-col items-center gap-1 group"
                >
                    <div className="p-3 bg-sabia-olive rounded-full shadow-lg shadow-black/50 group-hover:bg-sabia-olive/90 transition-colors border border-white/20">
                        <Check size={24} className="text-white" />
                    </div>
                     <span className="text-[10px] font-bold text-sabia-olive uppercase tracking-widest">Use Photo</span>
                </button>
            </div>
        ) : (
            <button 
            onClick={takeSnapshot}
            className="w-20 h-20 bg-transparent rounded-full border-4 border-white flex items-center justify-center shadow-lg active:scale-95 transition-transform hover:bg-white/10"
            aria-label="Take Photo"
            >
              <div className="w-16 h-16 bg-white rounded-full" />
            </button>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;