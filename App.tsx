import React, { useState, useEffect, useMemo } from 'react';
import { Property, ViewState, PropertyType } from './types';
import { loadProperties, saveProperties, exportToCSV, importFromCSV, generateSampleData } from './services/storageService';
import PropertyForm from './components/PropertyForm';
import PropertyCard from './components/PropertyCard';
import Instructions from './components/Instructions';
import { Plus, List, HelpCircle, Download, Upload, Building2, Filter, ArrowUpDown, Database, Settings, X, Image as ImageIcon, Trash2, Loader2, CheckCircle } from 'lucide-react';

const App: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [view, setView] = useState<ViewState>('LIST');
  const [activeProperty, setActiveProperty] = useState<Property | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Branding State
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const [brandingSaved, setBrandingSaved] = useState(false);

  // Filter and Sort State
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [filterType, setFilterType] = useState<PropertyType | 'All'>('All');

  useEffect(() => {
    // Load properties
    const loaded = loadProperties();
    setProperties(loaded);
    
    // Load branding - Independent of properties to ensure it loads even if properties fail
    try {
        const savedBg = localStorage.getItem('propsnap_branding_bg');
        if (savedBg) {
            setBackgroundImage(savedBg);
        }
    } catch (e) {
        console.error("Failed to load branding", e);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      saveProperties(properties);
    }
  }, [properties, loading]);

  const handleSaveProperty = (property: Property) => {
    setProperties(prev => {
      const exists = prev.find(p => p.id === property.id);
      if (exists) {
        return prev.map(p => p.id === property.id ? property : p);
      }
      return [property, ...prev];
    });
    setView('LIST');
    setActiveProperty(undefined);
  };

  const handleDeleteProperty = (id: string) => {
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  const handleEditProperty = (property: Property) => {
    setActiveProperty(property);
    setView('EDIT');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const imported = await importFromCSV(e.target.files[0]);
        if (imported.length === 0) {
            alert('No properties found in CSV. Please check the file format.');
            return;
        }
        setProperties(prev => {
           const existingIds = new Set(prev.map(p => p.id));
           const safeImported = imported.map(p => {
             if (existingIds.has(p.id)) {
               return { ...p, id: crypto.randomUUID() };
             }
             return p;
           });
           return [...safeImported, ...prev];
        });
        
        alert(`Successfully imported ${imported.length} properties.`);
        e.target.value = '';
      } catch (error) {
        alert('Failed to import CSV. ' + (error instanceof Error ? error.message : ''));
        console.error(error);
        e.target.value = '';
      }
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingLogo(true);
    setBrandingSaved(false);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        // Resize logic - Aggressive resizing for background to ensure LocalStorage persistence
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxDim = 300; // significantly reduced to ensure fit in localStorage
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
            
            // Compress using JPEG at 0.5 quality for very small file size (watermark doesn't need HD)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
            
            try {
                // Try to save to local storage
                localStorage.setItem('propsnap_branding_bg', dataUrl);
                setBackgroundImage(dataUrl);
                setBrandingSaved(true);
                // Clear success message after 3 seconds
                setTimeout(() => setBrandingSaved(false), 3000);
            } catch (error) {
                console.error("Storage error", error);
                // Fallback: If storage is full, set state anyway so it works for this session
                setBackgroundImage(dataUrl);
                alert("Logo applied for this session. Storage limit reached - try deleting some properties with images to free up space.");
            } finally {
                setIsProcessingLogo(false);
                e.target.value = '';
            }
        } else {
             setIsProcessingLogo(false);
        }
      };
      img.onerror = () => {
          alert("Invalid image file.");
          setIsProcessingLogo(false);
          e.target.value = '';
      };
      img.src = ev.target?.result as string;
    };
    reader.onerror = () => {
        setIsProcessingLogo(false);
        e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleClearLogo = () => {
    setBackgroundImage(null);
    localStorage.removeItem('propsnap_branding_bg');
  };

  const loadSamples = () => {
    if (window.confirm("Load sample data? This will add test properties to your list.")) {
        const samples = generateSampleData();
        setProperties(prev => [...samples, ...prev]);
    }
  };

  const filteredProperties = useMemo(() => {
    let result = [...properties];

    if (filterType !== 'All') {
      result = result.filter(p => p.propertyType === filterType);
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') return b.createdAt - a.createdAt;
      
      const priceA = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0;
      const priceB = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0;
      
      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      return 0;
    });

    return result;
  }, [properties, filterType, sortBy]);

  return (
    <div className="min-h-screen bg-sabia-dark text-sabia-frost font-sans selection:bg-sabia-olive/30 relative overflow-x-hidden">
      
      {/* Watermark Background */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
         <img 
            // KEY PROP IS CRITICAL: Forces React to destroy and recreate the img element when the source changes.
            key={backgroundImage ? `bg-custom-${backgroundImage.length}` : "bg-default"}
            src={backgroundImage || "/lion-logo.png"}
            onError={(e) => {
                // Only hide if the *current* image fails.
                e.currentTarget.style.display = 'none';
            }}
            alt="Sabia Lion Watermark" 
            className="w-[70vw] max-w-xl opacity-15 object-contain transition-opacity duration-500"
         />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-sabia-dark/95 backdrop-blur-md border-b border-sabia-olive/20 sticky top-0 z-50 shadow-lg shadow-black/20">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="bg-sabia-maroon p-2 rounded-lg shadow-inner shadow-black/30 border border-white/5 shrink-0">
                <Building2 size={24} className="text-sabia-frost" />
              </div>
              <div className="flex flex-col min-w-0">
                <h1 className="text-lg font-bold text-sabia-frost tracking-wide leading-tight">
                  PropSnap!
                </h1>
                <span className="text-[9px] text-sabia-silver/80 font-medium tracking-wider truncate">
                  by Sabia Investments Group Inc.
                </span>
              </div>
            </div>
            
            <div className="flex gap-2 shrink-0">
              <button
                onClick={loadSamples}
                className="p-2 text-sabia-silver hover:text-sabia-olive hover:bg-white/5 rounded-full transition-colors hidden sm:block"
                title="Load Sample Data"
              >
                <Database size={20} />
              </button>
              <label className="p-2 text-sabia-silver hover:text-sabia-olive hover:bg-white/5 rounded-full transition-colors cursor-pointer" title="Import CSV">
                <Upload size={20} />
                <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
              </label>
              <button 
                onClick={() => exportToCSV(properties)}
                className="p-2 text-sabia-silver hover:text-sabia-olive hover:bg-white/5 rounded-full transition-colors"
                title="Export CSV"
              >
                <Download size={20} />
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 text-sabia-silver hover:text-sabia-olive hover:bg-white/5 rounded-full transition-colors"
                title="Settings & Branding"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Settings Modal */}
        {showSettings && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-sabia-dark border border-sabia-olive/30 rounded-xl shadow-2xl w-full max-w-sm p-6 relative">
                    <button 
                        onClick={() => setShowSettings(false)}
                        className="absolute top-4 right-4 text-sabia-silver hover:text-white"
                    >
                        <X size={20} />
                    </button>
                    
                    <h2 className="text-xl font-bold text-sabia-frost mb-6 flex items-center gap-2">
                        <Settings size={24} className="text-sabia-olive" />
                        App Settings
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-medium text-sabia-silver uppercase tracking-wider mb-3">Custom Branding</h3>
                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 bg-black/40 rounded-lg flex items-center justify-center overflow-hidden border border-white/10 relative">
                                        {backgroundImage ? (
                                            <img src={backgroundImage} alt="Preview" className="w-full h-full object-contain" />
                                        ) : (
                                            <ImageIcon size={24} className="text-sabia-silver/20" />
                                        )}
                                        {isProcessingLogo && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <Loader2 size={20} className="text-white animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sabia-frost font-medium text-sm mb-1">Background Logo</p>
                                        <div className="text-xs">
                                          {isProcessingLogo ? (
                                             <span className="text-sabia-olive animate-pulse">Processing...</span>
                                          ) : brandingSaved ? (
                                             <span className="text-green-400 flex items-center gap-1"><CheckCircle size={10} /> Saved Permanently</span>
                                          ) : (
                                             <span className="text-sabia-silver/60">Upload your logo (will be resized)</span>
                                          )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 items-center">
                                    <label className={`flex-1 bg-sabia-olive hover:bg-sabia-olive/90 text-white text-xs font-bold py-2 px-4 rounded-lg text-center cursor-pointer transition-colors shadow-lg flex items-center justify-center gap-2 ${isProcessingLogo ? 'opacity-50 cursor-wait' : ''}`}>
                                        {isProcessingLogo ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Select & Apply Logo
                                                <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={isProcessingLogo} className="hidden" />
                                            </>
                                        )}
                                    </label>
                                    {backgroundImage && !isProcessingLogo && (
                                        <button 
                                            onClick={handleClearLogo}
                                            className="px-3 py-2 bg-sabia-maroon/20 hover:bg-sabia-maroon/40 text-sabia-maroon border border-sabia-maroon/30 rounded-lg transition-colors"
                                            title="Remove Logo"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-sabia-silver/40 text-center pt-4 border-t border-white/5">
                            Sabia Investments Group Inc. <br/> PropSnap v1.1
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 pb-24">
          {view === 'LIST' && (
            <>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6 sticky top-20 z-40 bg-sabia-dark/95 p-2 rounded-xl border border-sabia-olive/10 shadow-xl backdrop-blur-sm">
                 <div className="flex-1 flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                    {['All', 'Residential', 'Commercial', 'Land', 'Multi-Family', 'Other'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type as any)}
                            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                                filterType === type 
                                ? 'bg-sabia-olive text-white border-sabia-olive shadow-md' 
                                : 'bg-transparent text-sabia-silver border-sabia-olive/20 hover:border-sabia-olive/50'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                 </div>
                 
                 <div className="flex items-center gap-2 border-l border-sabia-olive/20 pl-0 sm:pl-4">
                    <button 
                        onClick={() => setSortBy(prev => prev === 'newest' ? 'price_desc' : prev === 'price_desc' ? 'price_asc' : 'newest')}
                        className="flex items-center gap-2 px-3 py-2 text-sabia-silver hover:text-sabia-olive text-sm font-medium"
                    >
                        <ArrowUpDown size={16} />
                        {sortBy === 'newest' ? 'Newest' : sortBy === 'price_desc' ? 'Price: High' : 'Price: Low'}
                    </button>
                 </div>
              </div>

              {properties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                  <div className="w-24 h-24 bg-sabia-olive/10 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-sabia-olive/30">
                    <Building2 size={40} className="text-sabia-olive" />
                  </div>
                  <h3 className="text-xl font-semibold text-sabia-frost mb-2">No Properties Yet</h3>
                  <p className="text-sabia-silver max-w-xs mb-6">Tap the + button below to start building your portfolio.</p>
                  
                  <button 
                    onClick={loadSamples}
                    className="flex items-center gap-2 bg-sabia-olive/20 text-sabia-olive border border-sabia-olive/50 px-4 py-2 rounded-lg hover:bg-sabia-olive/30 transition-colors text-sm font-medium"
                  >
                    <Database size={16} />
                    Load Sample Data
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProperties.map(property => (
                    <PropertyCard 
                      key={property.id} 
                      property={property} 
                      onEdit={handleEditProperty} 
                      onDelete={handleDeleteProperty}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {(view === 'CREATE' || view === 'EDIT') && (
            <PropertyForm 
              initialData={view === 'EDIT' ? activeProperty : undefined}
              onSave={handleSaveProperty}
              onCancel={() => {
                setView('LIST');
                setActiveProperty(undefined);
              }}
            />
          )}

          {view === 'INSTRUCTIONS' && <Instructions />}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 w-full bg-sabia-dark/95 backdrop-blur-md border-t border-sabia-olive/20 pb-safe z-50">
          <div className="max-w-md mx-auto flex justify-around items-center h-16 px-4">
            <button
              onClick={() => setView('LIST')}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${view === 'LIST' ? 'text-sabia-olive' : 'text-sabia-silver hover:text-sabia-frost'}`}
            >
              <List size={24} />
              <span className="text-[10px] font-medium uppercase tracking-wider">List</span>
            </button>

            <button
              onClick={() => {
                setActiveProperty(undefined);
                setView('CREATE');
              }}
              className="flex flex-col items-center justify-center -mt-8"
            >
              <div className="bg-sabia-maroon text-white p-4 rounded-full shadow-lg shadow-black/40 border-4 border-sabia-dark hover:scale-105 active:scale-95 transition-transform">
                <Plus size={28} />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-sabia-silver mt-1">New</span>
            </button>

            <button
              onClick={() => setView('INSTRUCTIONS')}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${view === 'INSTRUCTIONS' ? 'text-sabia-olive' : 'text-sabia-silver hover:text-sabia-frost'}`}
            >
              <HelpCircle size={24} />
              <span className="text-[10px] font-medium uppercase tracking-wider">Help</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default App;