import React from 'react';
import { Property } from '../types';
import { MapPin, DollarSign, Edit, ExternalLink, Home, Bed, Bath, Ruler, Landmark, Trash2, Mail } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onEdit: (property: Property) => void;
  onDelete: (id: string) => void;
}

const statusColors = {
  'Lead': 'bg-blue-900/30 text-blue-200 border-blue-800/50',
  'Analyzing': 'bg-yellow-900/30 text-yellow-200 border-yellow-800/50',
  'Offer Made': 'bg-purple-900/30 text-purple-200 border-purple-800/50',
  'Under Contract': 'bg-orange-900/30 text-orange-200 border-orange-800/50',
  'Closed': 'bg-green-900/30 text-green-200 border-green-800/50',
};

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onEdit, onDelete }) => {
  const getMapUrl = () => {
    // Prioritize address for the map query
    if (property.address && property.address.trim().length > 0) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address)}`;
    }
    // Fallback to coordinates if address is missing
    if (property.latitude && property.longitude) {
      return `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`;
    }
    return null;
  };

  const getAppraiserSearchUrl = () => {
    if (property.address && property.address.trim().length > 0) {
        // Construct a search query targeting the property appraiser for this location
        // Adding "Property Appraiser" typically finds the relevant county/city office
        const query = `${property.address} Property Appraiser data`;
        return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }
    return null;
  };

  const mapUrl = getMapUrl();
  const appraiserUrl = getAppraiserSearchUrl();

  // Helper to convert Base64 to File for sharing
  const dataURLtoFile = (dataurl: string, filename: string) => {
    try {
        let arr = dataurl.split(','), mimeMatch = arr[0].match(/:(.*?);/);
        let mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        let bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, {type:mime});
    } catch (e) {
        console.error("Error converting image to file", e);
        return null;
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    // Immediate deletion as requested
    onDelete(property.id);
  };

  const handleEmail = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const subject = `Property Lead: ${property.title}`;
    const body = `
Property Details:
----------------
Title: ${property.title}
Address: ${property.address}
Price: ${property.price}
Type: ${property.propertyType}
Status: ${property.status}

Specs:
----------------
Bedrooms: ${property.bedrooms ?? 'N/A'}
Bathrooms: ${property.bathrooms ?? 'N/A'}
SqFt: ${property.squareFootage ?? 'N/A'}
Year Built: ${property.yearBuilt ?? 'N/A'}

Notes:
----------------
${property.description}

Location:
https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address)}

Sent via PropSnap
    `.trim();

    // Strategy 1: Try Web Share API with File (Mobile supports this)
    if (property.imageData && navigator.share) {
        const file = dataURLtoFile(property.imageData, `property-${property.id.substring(0,6)}.jpg`);
        if (file) {
            try {
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: subject,
                        text: body,
                        files: [file]
                    });
                    return; // Success, stop here
                }
            } catch (err) {
                // Ignore AbortError (user cancelled share sheet)
                if ((err as Error).name === 'AbortError') return;
                console.log("Share API error, falling back to mailto", err);
            }
        }
    }

    // Strategy 2: Fallback to simple mailto (Text only, no image attachment possible)
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="bg-sabia-dark/80 backdrop-blur-sm relative rounded-xl shadow-lg border border-sabia-olive/30 overflow-hidden flex flex-col hover:border-sabia-olive/60 hover:shadow-xl transition-all group">
      {/* Subtle overlay to lift card from background slightly */}
      <div className="absolute inset-0 bg-white/[0.02] pointer-events-none"></div>
      
      <div className="relative h-48 bg-black/40 z-10">
        {property.imageData ? (
          <img 
            src={property.imageData} 
            alt={property.title} 
            className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-90"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-sabia-olive/40 bg-black/20">
            <Home size={32} className="mb-2" />
            <span className="text-sm font-medium">No Image</span>
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
            <span className={`px-2 py-1 rounded-md text-xs font-semibold border backdrop-blur-md ${statusColors[property.status]}`}>
                {property.status}
            </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-sabia-dark to-transparent p-3 pt-8">
           <span className="text-sabia-silver text-xs font-medium px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-sabia-silver/20">
             {property.propertyType || 'Residential'}
           </span>
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col z-10">
        <h3 className="text-lg font-bold text-sabia-frost mb-1 truncate tracking-tight">{property.title}</h3>
        
        <div className="flex items-start gap-2 text-sabia-silver mb-3 text-sm">
            <MapPin size={16} className="mt-0.5 shrink-0 text-sabia-olive" />
            <p className="line-clamp-2 leading-relaxed opacity-90">{property.address || 'No Address'}</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-xs text-sabia-silver border-t border-b border-white/5 py-2">
            <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 text-sabia-olive mb-0.5">
                    <Bed size={14} />
                    <span className="font-bold">{property.bedrooms !== undefined ? property.bedrooms : '-'}</span>
                </div>
                <span className="opacity-60">Beds</span>
            </div>
            <div className="flex flex-col items-center border-l border-white/5">
                <div className="flex items-center gap-1 text-sabia-olive mb-0.5">
                    <Bath size={14} />
                    <span className="font-bold">{property.bathrooms !== undefined ? property.bathrooms : '-'}</span>
                </div>
                <span className="opacity-60">Baths</span>
            </div>
             <div className="flex flex-col items-center border-l border-white/5">
                <div className="flex items-center gap-1 text-sabia-olive mb-0.5">
                    <Ruler size={14} />
                    <span className="font-bold">{property.squareFootage ? property.squareFootage.replace(/[^0-9]/g, '') : '-'}</span>
                </div>
                <span className="opacity-60">SqFt</span>
            </div>
        </div>

        {property.price && (
            <div className="flex items-center gap-2 text-sabia-frost font-semibold mb-4">
                <div className="bg-sabia-olive/10 p-1 rounded">
                    <DollarSign size={14} className="text-sabia-olive" />
                </div>
                <span>{property.price}</span>
            </div>
        )}

        <div className="mt-auto pt-3 border-t border-sabia-olive/10 flex items-center gap-2">
             {mapUrl && (
                 <a 
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-sabia-olive bg-sabia-olive/10 hover:bg-sabia-olive/20 border border-sabia-olive/30 hover:border-sabia-olive/50 font-medium px-2 py-2 rounded-lg transition-all"
                 >
                    <ExternalLink size={14} />
                 </a>
             )}

             {appraiserUrl && (
                 <a 
                    href={appraiserUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sabia-silver hover:text-sabia-frost bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 font-medium px-2 py-2 rounded-lg transition-all"
                    title="Search County Appraiser"
                 >
                    <Landmark size={14} />
                 </a>
             )}

             <button 
                onClick={handleEmail}
                className="flex items-center gap-1.5 text-xs text-sabia-silver hover:text-sabia-frost bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 font-medium px-2 py-2 rounded-lg transition-all"
                title="Share / Email with Image"
             >
                <Mail size={14} />
             </button>

            <button 
                onClick={() => onEdit(property)}
                className="flex items-center gap-1.5 text-xs text-sabia-silver hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 font-medium px-3 py-2 rounded-lg transition-all ml-auto"
            >
                <Edit size={14} />
                Edit
            </button>

            <button 
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-xs text-sabia-maroon hover:text-red-400 bg-red-900/10 hover:bg-red-900/20 border border-red-900/20 hover:border-red-900/40 font-medium px-3 py-2 rounded-lg transition-all"
                title="Delete Property"
            >
                <Trash2 size={14} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;