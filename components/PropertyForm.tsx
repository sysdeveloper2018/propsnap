import React, { useState } from 'react';
import { Property, PropertyType } from '../types';
import { Camera, MapPin, Loader2, Save, X, CheckSquare, Square, FileText, Home, Ruler, Zap, Bed, Bath, Upload } from 'lucide-react';
import CameraCapture from './CameraCapture';
import { getAddressFromCoordinates } from '../services/geminiService';

interface PropertyFormProps {
  initialData?: Property;
  onSave: (property: Property) => void;
  onCancel: () => void;
}

const UTILITY_OPTIONS = ['Water', 'Sewer', 'Electric', 'Gas'];
const STATUS_OPTIONS: Property['status'][] = ['Lead', 'Analyzing', 'Offer Made', 'Under Contract', 'Closed'];

// Generator for dropdown options
const BEDROOM_OPTIONS = Array.from({ length: 9 }, (_, i) => ({ value: i, label: i === 0 ? 'Studio' : i === 8 ? '8+' : i.toString() }));
const BATHROOM_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6].map(i => ({ value: i, label: i === 6 ? '6+' : i.toString() }));

const PropertyForm: React.FC<PropertyFormProps> = ({ initialData, onSave, onCancel }) => {
  // Basic Info
  const [title, setTitle] = useState(initialData?.title || '');
  const [price, setPrice] = useState(initialData?.price || '');
  const [propertyType, setPropertyType] = useState<PropertyType>(initialData?.propertyType || 'Residential');
  const [status, setStatus] = useState<Property['status']>(initialData?.status || 'Lead');
  
  // Location & Media
  const [address, setAddress] = useState(initialData?.address || '');
  const [imageData, setImageData] = useState<string | null>(initialData?.imageData || null);
  const [latitude, setLatitude] = useState<number | null>(initialData?.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(initialData?.longitude || null);

  // New Fields - Specs
  const [bedrooms, setBedrooms] = useState<number | ''>(initialData?.bedrooms ?? '');
  const [bathrooms, setBathrooms] = useState<number | ''>(initialData?.bathrooms ?? '');
  const [yearBuilt, setYearBuilt] = useState(initialData?.yearBuilt || '');
  const [squareFootage, setSquareFootage] = useState(initialData?.squareFootage || '');
  const [zoning, setZoning] = useState(initialData?.zoning || '');
  
  // New Fields - Legal
  const [parcelNumber, setParcelNumber] = useState(initialData?.parcelNumber || '');
  const [legalDescription, setLegalDescription] = useState(initialData?.legalDescription || '');
  
  // New Fields - Utilities & HOA
  const [utilities, setUtilities] = useState<string[]>(initialData?.utilities || []);
  const [hoaDetails, setHoaDetails] = useState(initialData?.hoaDetails || '');
  
  // Description
  const [description, setDescription] = useState(initialData?.description || '');

  // UI State
  const [showCamera, setShowCamera] = useState(false);
  const [locating, setLocating] = useState(false);

  const handleCapture = (img: string) => {
    setImageData(img);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Resize logic - keep max dimension reasonable (e.g. 1024px for property photos)
            // This prevents localStorage quota issues
            const maxDim = 1024;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxDim) {
                    height *= maxDim / width;
                    width = maxDim;
                }
            } else {
                if (height > maxDim) {
                    width *= maxDim / height;
                    height = maxDim;
                }
            }

            canvas.width = width;
            canvas.height = height;
            
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                // Compress to JPEG 0.7
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                setImageData(dataUrl);
            }
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLocate = async () => {
    setLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lng);

          try {
            const addr = await getAddressFromCoordinates({ lat, lng });
            setAddress(addr);
          } catch (error) {
            console.error(error);
            alert("Could not automatically determine address. Please enter manually.");
          } finally {
            setLocating(false);
          }
        },
        (error) => {
          console.error(error);
          alert("Location permission denied or unavailable.");
          setLocating(false);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
      setLocating(false);
    }
  };

  const handleUtilityToggle = (utility: string) => {
    setUtilities(prev => 
      prev.includes(utility) 
        ? prev.filter(u => u !== utility) 
        : [...prev, utility]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const property: Property = {
      id: initialData?.id || crypto.randomUUID(),
      title: title || 'Untitled Property',
      address,
      price,
      propertyType,
      status,
      description,
      imageData,
      latitude,
      longitude,
      createdAt: initialData?.createdAt || Date.now(),
      updatedAt: Date.now(),
      // New Fields
      bedrooms: bedrooms === '' ? undefined : Number(bedrooms),
      bathrooms: bathrooms === '' ? undefined : Number(bathrooms),
      yearBuilt,
      squareFootage,
      zoning,
      parcelNumber,
      legalDescription,
      utilities,
      hoaDetails,
    };
    onSave(property);
  };

  return (
    <div className="bg-sabia-dark min-h-full pb-20">
      {showCamera && (
        <CameraCapture 
          onCapture={handleCapture} 
          onClose={() => setShowCamera(false)} 
        />
      )}

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
        
        {/* Sticky Header */}
        <div className="sticky top-16 z-30 bg-sabia-dark/95 backdrop-blur-md p-4 -mx-4 border-b border-sabia-olive/20 flex justify-between items-center shadow-md">
          <h2 className="text-xl font-bold text-sabia-frost">
            {initialData ? 'Edit Property' : 'New Property'}
          </h2>
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={onCancel}
              className="p-2 text-sabia-silver hover:bg-white/5 rounded-full"
            >
              <X size={24} />
            </button>
            <button 
              type="submit"
              className="flex items-center gap-2 bg-sabia-olive text-white px-4 py-2 rounded-lg font-medium shadow-lg hover:bg-sabia-olive/90 transition-colors"
            >
              <Save size={18} />
              Save
            </button>
          </div>
        </div>

        {/* Image Section */}
        <div className="bg-black/20 rounded-xl overflow-hidden border border-sabia-olive/10 mx-4 sm:mx-0">
          {imageData ? (
            <div className="relative h-64 w-full">
              <img src={imageData} alt="Property" className="w-full h-full object-cover" />
              <div className="absolute bottom-4 right-4 flex gap-2">
                <label className="bg-black/60 backdrop-blur-md text-white p-2 rounded-full hover:bg-black/80 border border-white/20 cursor-pointer shadow-lg" title="Upload New Photo">
                   <Upload size={20} />
                   <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                <button 
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="bg-black/60 backdrop-blur-md text-white p-2 rounded-full hover:bg-black/80 border border-white/20 shadow-lg"
                  title="Retake Snapshot"
                >
                  <Camera size={20} />
                </button>
              </div>
            </div>
          ) : (
             <div className="w-full h-48 flex flex-col sm:flex-row items-stretch">
                <button 
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="flex-1 flex flex-col items-center justify-center text-sabia-olive hover:bg-sabia-olive/5 transition-colors gap-2 border-b sm:border-b-0 sm:border-r border-sabia-olive/10 p-4"
                >
                  <Camera size={32} />
                  <span className="font-medium text-sm">Take Snapshot</span>
                </button>
                
                <label className="flex-1 flex flex-col items-center justify-center text-sabia-silver hover:bg-white/5 transition-colors gap-2 cursor-pointer p-4 hover:text-sabia-frost">
                  <Upload size={32} />
                  <span className="font-medium text-sm">Upload Photo</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
            </div>
          )}
        </div>

        {/* Form Content Wrapper */}
        <div className="px-4 sm:px-0 space-y-6">

            {/* Basic Info */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-4">
              <div className="flex items-center gap-2 text-sabia-olive mb-2">
                <Home size={20} />
                <h3 className="font-bold text-lg">Basic Info</h3>
              </div>

              <div>
                <label className="block text-xs font-medium text-sabia-silver uppercase tracking-wider mb-1">Property Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 123 Main St Fixer"
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sabia-frost placeholder:text-white/20 focus:outline-none focus:border-sabia-olive transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-sabia-silver uppercase tracking-wider mb-1">Price</label>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="$0.00"
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sabia-frost placeholder:text-white/20 focus:outline-none focus:border-sabia-olive transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-sabia-silver uppercase tracking-wider mb-1">Type</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sabia-frost focus:outline-none focus:border-sabia-olive transition-colors appearance-none"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Land">Land</option>
                    <option value="Multi-Family">Multi-Family</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              
               <div>
                  <label className="block text-xs font-medium text-sabia-silver uppercase tracking-wider mb-1">Pipeline Status</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {STATUS_OPTIONS.map(s => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setStatus(s)}
                            className={`px-2 py-2 rounded-md text-xs font-medium border transition-all ${
                                status === s 
                                ? 'bg-sabia-olive text-white border-sabia-olive' 
                                : 'bg-transparent text-sabia-silver border-white/10 hover:border-white/30'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                  </div>
                </div>
            </div>

            {/* Location */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-4">
               <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2 text-sabia-olive">
                    <MapPin size={20} />
                    <h3 className="font-bold text-lg">Location</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleLocate}
                    disabled={locating}
                    className="text-xs flex items-center gap-1 text-sabia-olive hover:text-sabia-frost disabled:opacity-50"
                  >
                    {locating ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                    {locating ? 'Locating...' : 'Auto-Locate'}
                  </button>
               </div>

              <div>
                <label className="block text-xs font-medium text-sabia-silver uppercase tracking-wider mb-1">Full Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, State, Zip"
                  rows={2}
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sabia-frost placeholder:text-white/20 focus:outline-none focus:border-sabia-olive transition-colors resize-none"
                />
              </div>

              {latitude && longitude && (
                  <div className="text-xs text-sabia-silver/50 font-mono bg-black/20 p-2 rounded">
                      GPS: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </div>
              )}
            </div>

            {/* Layout & Specs */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-4">
               <div className="flex items-center gap-2 text-sabia-olive mb-2">
                 <Ruler size={20} />
                 <h3 className="font-bold text-lg">Layout & Specs</h3>
               </div>
               
               {/* Bedrooms & Bathrooms - Added after Address/Location section */}
               <div className="grid grid-cols-2 gap-4">
                   <div>
                        <div className="flex items-center gap-1.5 mb-1">
                            <Bed size={14} className="text-sabia-silver" />
                            <label className="block text-xs font-medium text-sabia-silver uppercase tracking-wider">Bedrooms</label>
                        </div>
                        <select
                            value={bedrooms}
                            onChange={(e) => setBedrooms(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sabia-frost focus:outline-none focus:border-sabia-olive transition-colors appearance-none"
                        >
                            <option value="">Select...</option>
                            {BEDROOM_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                   </div>
                   <div>
                        <div className="flex items-center gap-1.5 mb-1">
                            <Bath size={14} className="text-sabia-silver" />
                            <label className="block text-xs font-medium text-sabia-silver uppercase tracking-wider">Bathrooms</label>
                        </div>
                        <select
                            value={bathrooms}
                            onChange={(e) => setBathrooms(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sabia-frost focus:outline-none focus:border-sabia-olive transition-colors appearance-none"
                        >
                            <option value="">Select...</option>
                            {BATHROOM_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                   </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                   <div>
                        <label className="block text-xs font-medium text-sabia-silver uppercase tracking-wider mb-1">Year Built</label>
                        <input
                            type="text"
                            value={yearBuilt}
                            onChange={(e) => setYearBuilt(e.target.value)}
                            placeholder="YYYY"
                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sabia-frost placeholder:text-white/20 focus:outline-none focus:border-sabia-olive transition-colors"
                        />
                   </div>
                   <div>
                        <label className="block text-xs font-medium text-sabia-silver uppercase tracking-wider mb-1">Sq Footage</label>
                        <input
                            type="text"
                            value={squareFootage}
                            onChange={(e) => setSquareFootage(e.target.value)}
                            placeholder="e.g. 2,500"
                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sabia-frost placeholder:text-white/20 focus:outline-none focus:border-sabia-olive transition-colors"
                        />
                   </div>
               </div>

               <div>
                    <label className="block text-xs font-medium text-sabia-silver uppercase tracking-wider mb-1">Zoning Classification</label>
                    <input
                        type="text"
                        value={zoning}
                        onChange={(e) => setZoning(e.target.value)}
                        placeholder="e.g. R2, Commercial Mix"
                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sabia-frost placeholder:text-white/20 focus:outline-none focus:border-sabia-olive transition-colors"
                    />
               </div>
            </div>

            {/* Legal */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-4">
               <div className="flex items-center gap-2 text-sabia-olive mb-2">
                 <FileText size={20} />
                 <h3 className="font-bold text-lg">Legal Info</h3>
               </div>
               
               <div>
                    <label className="block text-xs font-medium text-sabia-silver uppercase tracking-wider mb-1">Parcel / Lot Number</label>
                    <input
                        type="text"
                        value={parcelNumber}
                        onChange={(e) => setParcelNumber(e.target.value)}
                        placeholder="APN or Lot Number"
                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sabia-frost placeholder:text-white/20 focus:outline-none focus:border-sabia-olive transition-colors"
                    />
               </div>

               <div>
                    <label className="block text-xs font-medium text-sabia-silver uppercase tracking-wider mb-1">Legal Description</label>
                    <textarea
                        value={legalDescription}
                        onChange={(e) => setLegalDescription(e.target.value)}
                        placeholder="Lot 4, Block 2, Subdivision..."
                        rows={2}
                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sabia-frost placeholder:text-white/20 focus:outline-none focus:border-sabia-olive transition-colors resize-none"
                    />
               </div>
            </div>

            {/* Utilities & HOA */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-sabia-olive mb-2">
                    <Zap size={20} />
                    <h3 className="font-bold text-lg">Utilities & HOA</h3>
                </div>

                <div>
                    <label className="block text-xs font-medium text-sabia-silver uppercase tracking-wider mb-2">Available Utilities</label>
                    <div className="grid grid-cols-2 gap-3">
                        {UTILITY_OPTIONS.map((opt) => (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => handleUtilityToggle(opt)}
                                className="flex items-center gap-3 p-2 rounded-lg bg-black/20 hover:bg-black/30 border border-white/5 transition-colors text-left"
                            >
                                <div className={`text-sabia-olive transition-all ${utilities.includes(opt) ? 'opacity-100 scale-110' : 'opacity-30 scale-100'}`}>
                                    {utilities.includes(opt) ? <CheckSquare size={18} /> : <Square size={18} />}
                                </div>
                                <span className={`text-sm ${utilities.includes(opt) ? 'text-sabia-frost' : 'text-sabia-silver'}`}>
                                    {opt}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-sabia-silver uppercase tracking-wider mb-1">HOA Details</label>
                    <textarea
                        value={hoaDetails}
                        onChange={(e) => setHoaDetails(e.target.value)}
                        placeholder="Fees, contact info, rules..."
                        rows={2}
                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sabia-frost placeholder:text-white/20 focus:outline-none focus:border-sabia-olive transition-colors resize-none"
                    />
                </div>
            </div>

            {/* General Notes */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <label className="block text-xs font-medium text-sabia-silver uppercase tracking-wider mb-1">Notes / Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Property condition, access notes, lockbox code..."
                rows={4}
                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sabia-frost placeholder:text-white/20 focus:outline-none focus:border-sabia-olive transition-colors"
              />
            </div>

        </div>
      </form>
    </div>
  );
};

export default PropertyForm;