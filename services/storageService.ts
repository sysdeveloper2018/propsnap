import { Property, PropertyType } from '../types';

const STORAGE_KEY = 'propsnap_properties';

export const saveProperties = (properties: Property[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
  } catch (error) {
    console.error('Failed to save properties to local storage', error);
  }
};

export const loadProperties = (): Property[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load properties', error);
    return [];
  }
};

export const exportToCSV = (properties: Property[]): void => {
  if (properties.length === 0) return;

  const headers = [
    'ID', 'Title', 'Address', 'Price', 'Property Type', 'Status', 
    'Latitude', 'Longitude', 'Created At', 'Description',
    'Bedrooms', 'Bathrooms',
    'Legal Description', 'Parcel Number', 'Year Built', 'Square Footage', 
    'HOA Details', 'Zoning', 'Utilities', 'Image Data'
  ];
  
  const rows = properties.map(p => [
    p.id,
    `"${p.title.replace(/"/g, '""')}"`,
    `"${p.address.replace(/"/g, '""')}"`,
    `"${p.price.replace(/"/g, '""')}"`,
    p.propertyType || 'Residential',
    p.status,
    p.latitude || '',
    p.longitude || '',
    new Date(p.createdAt).toISOString(),
    `"${p.description.replace(/"/g, '""')}"`,
    p.bedrooms ?? '',
    p.bathrooms ?? '',
    `"${(p.legalDescription || '').replace(/"/g, '""')}"`,
    `"${(p.parcelNumber || '').replace(/"/g, '""')}"`,
    `"${(p.yearBuilt || '').replace(/"/g, '""')}"`,
    `"${(p.squareFootage || '').replace(/"/g, '""')}"`,
    `"${(p.hoaDetails || '').replace(/"/g, '""')}"`,
    `"${(p.zoning || '').replace(/"/g, '""')}"`,
    `"${(p.utilities || []).join(';').replace(/"/g, '""')}"`,
    `"${(p.imageData || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `propsnap_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- Improved Import Logic ---

const detectDelimiter = (text: string): string => {
  const lines = text.split(/\r\n|\n|\r/);
  // Find first non-empty line to detect delimiter
  const firstLine = lines.find(l => l.trim().length > 0) || '';
  
  const commas = (firstLine.match(/,/g) || []).length;
  const semicolons = (firstLine.match(/;/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;
  
  if (tabs > commas && tabs > semicolons) return '\t';
  if (semicolons > commas && semicolons > tabs) return ';';
  return ',';
};

const parseCSV = (text: string, delimiter: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let insideQuote = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentVal += '"';
        i++; 
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === delimiter && !insideQuote) {
      currentRow.push(currentVal);
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentVal);
      rows.push(currentRow);
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  // Flush last value
  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal);
    rows.push(currentRow);
  }
  return rows;
};

export const importFromCSV = async (file: File): Promise<Property[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rawText = e.target?.result as string;
        const text = rawText.replace(/^\uFEFF/, '').trim();
        
        if (!text) {
             resolve([]);
             return;
        }

        const delimiter = detectDelimiter(text);
        const rows = parseCSV(text, delimiter);

        if (rows.length === 0) {
            resolve([]);
            return;
        }

        const standardHeaders: Record<string, string> = {
            'id': 'id',
            'title': 'title',
            'address': 'address',
            'price': 'price',
            'property type': 'propertyType',
            'propertytype': 'propertyType',
            'status': 'status',
            'latitude': 'latitude',
            'longitude': 'longitude',
            'created at': 'createdAt',
            'createdat': 'createdAt',
            'description': 'description',
            'bedrooms': 'bedrooms',
            'bathrooms': 'bathrooms',
            'legal description': 'legalDescription',
            'legaldescription': 'legalDescription',
            'parcel number': 'parcelNumber',
            'parcelnumber': 'parcelNumber',
            'year built': 'yearBuilt',
            'yearbuilt': 'yearBuilt',
            'square footage': 'squareFootage',
            'squarefootage': 'squareFootage',
            'hoa details': 'hoaDetails',
            'hoadetails': 'hoaDetails',
            'zoning': 'zoning',
            'utilities': 'utilities',
            'image data': 'imageData',
            'imagedata': 'imageData'
        };

        // Normalize first row
        const firstRow = rows[0].map(c => c.toLowerCase().trim().replace(/^"|"$/g, ''));
        
        // Strict check: must contain at least ID and Title or Address to be a header
        const isHeader = firstRow.includes('id') && (firstRow.includes('title') || firstRow.includes('address'));
        
        const colMap: Record<string, number> = {};
        let startIndex = 0;

        // Fallback default order
        const defaultOrder = [
            'id', 'title', 'address', 'price', 'propertyType', 'status',
            'latitude', 'longitude', 'createdAt', 'description',
            'bedrooms', 'bathrooms', 'legalDescription', 'parcelNumber', 
            'yearBuilt', 'squareFootage', 'hoaDetails', 'zoning', 
            'utilities', 'imageData'
        ];

        if (isHeader) {
            startIndex = 1;
            firstRow.forEach((colName, idx) => {
                if (standardHeaders[colName]) {
                    colMap[standardHeaders[colName]] = idx;
                }
            });
            // Safety: If header detection worked but critical columns failed to map, fallback to default
            if (colMap['title'] === undefined && colMap['address'] === undefined) {
                 console.warn("Header detected but no critical columns mapped. Falling back to default order.");
                 defaultOrder.forEach((key, idx) => colMap[key] = idx);
                 startIndex = 1; // Still skip the header row
            }
        } else {
            defaultOrder.forEach((key, idx) => colMap[key] = idx);
        }

        const getValue = (row: string[], key: string): string => {
            const idx = colMap[key];
            if (idx !== undefined && row[idx] !== undefined) return row[idx].trim();
            return '';
        };

        const result: Property[] = [];

        for (let i = startIndex; i < rows.length; i++) {
          const row = rows[i];
          if (row.length <= 1 && !row[0].trim()) continue;

          // If row is too short, pad it (prevents undefined errors if last columns are empty/missing)
          // Not strictly necessary due to row[idx] check in getValue, but good for debugging
          
          const bedrooms = parseFloat(getValue(row, 'bedrooms'));
          const bathrooms = parseFloat(getValue(row, 'bathrooms'));
          
          let createdTime = Date.now();
          const dateStr = getValue(row, 'createdAt');
          if (dateStr) {
             const ts = new Date(dateStr).getTime();
             if (!isNaN(ts)) createdTime = ts;
          }

          result.push({
            id: getValue(row, 'id') || crypto.randomUUID(), 
            title: getValue(row, 'title') || 'Imported Property',
            address: getValue(row, 'address') || '',
            price: getValue(row, 'price') || '',
            propertyType: (getValue(row, 'propertyType') as PropertyType) || 'Residential',
            status: (getValue(row, 'status') as any) || 'Lead',
            latitude: parseFloat(getValue(row, 'latitude')) || null,
            longitude: parseFloat(getValue(row, 'longitude')) || null,
            createdAt: createdTime,
            description: getValue(row, 'description') || '',
            bedrooms: !isNaN(bedrooms) ? bedrooms : undefined,
            bathrooms: !isNaN(bathrooms) ? bathrooms : undefined,
            legalDescription: getValue(row, 'legalDescription'),
            parcelNumber: getValue(row, 'parcelNumber'),
            yearBuilt: getValue(row, 'yearBuilt'),
            squareFootage: getValue(row, 'squareFootage'),
            hoaDetails: getValue(row, 'hoaDetails'),
            zoning: getValue(row, 'zoning'),
            utilities: getValue(row, 'utilities') ? getValue(row, 'utilities').split(';') : [],
            imageData: getValue(row, 'imageData') || null,
            updatedAt: Date.now()
          });
        }
        resolve(result);
      } catch (err) {
        console.error("Import parsing error:", err);
        reject(new Error("Failed to parse CSV file. Please check the format."));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// Test Data Loader for Dev/Demo
export const generateSampleData = (): Property[] => {
    return [
        {
            id: 'sample-1',
            title: 'Modern Loft',
            address: '123 Tech Blvd, San Francisco, CA 94105, USA',
            price: '1500000',
            propertyType: 'Residential',
            status: 'Lead',
            latitude: 37.7858,
            longitude: -122.4008,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            description: 'High-end loft in SoMa. Great potential.',
            bedrooms: 1,
            bathrooms: 1.5,
            legalDescription: 'SOMA BLK 5 LOT 1',
            parcelNumber: 'SF-123-456',
            yearBuilt: '2015',
            squareFootage: '1200',
            hoaDetails: '$850/mo includes gym',
            zoning: 'Res-HighDensity',
            utilities: ['Water', 'Sewer', 'Electric', 'Gas'],
            imageData: null
        },
        {
            id: 'sample-2',
            title: 'Suburban Fixer',
            address: '45 Maple Ln, Austin, TX 78745, USA',
            price: '450000',
            propertyType: 'Residential',
            status: 'Analyzing',
            latitude: 30.2222,
            longitude: -97.7777,
            createdAt: Date.now() - 100000,
            updatedAt: Date.now(),
            description: 'Foundation issues visible. Roof needs replacement.',
            bedrooms: 3,
            bathrooms: 2,
            legalDescription: 'SOUTH AUSTIN SEC 2',
            parcelNumber: 'AUS-999-00',
            yearBuilt: '1980',
            squareFootage: '1800',
            hoaDetails: '',
            zoning: 'Res-SingleFamily',
            utilities: ['Water', 'Electric'],
            imageData: null
        },
        {
            id: 'sample-3',
            title: 'Downtown Retail',
            address: '88 Broad St, Nashville, TN 37203, USA',
            price: '2200000',
            propertyType: 'Commercial',
            status: 'Offer Made',
            latitude: 36.1600,
            longitude: -86.7800,
            createdAt: Date.now() - 200000,
            updatedAt: Date.now(),
            description: 'Prime corner location. Currently vacant.',
            bedrooms: undefined,
            bathrooms: undefined,
            legalDescription: 'NASHVILLE CBD LOT 4',
            parcelNumber: 'NAS-555-12',
            yearBuilt: '1950',
            squareFootage: '4500',
            hoaDetails: '',
            zoning: 'Comm-Retail',
            utilities: ['Water', 'Sewer', 'Electric'],
            imageData: null
        }
    ];
};