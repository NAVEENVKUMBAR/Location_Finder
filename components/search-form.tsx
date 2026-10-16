'use client';

import { useState } from 'react';
import { DataSource, HospitalityCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

const categories: HospitalityCategory[] = [
  'All Hospitality',
  'Hotels',
  'Restaurants',
  'PGs',
  'Hostels',
  'Resorts',
  'Lodges',
  'Homestays',
  'Guest Houses',
  'Cafés',
  'Other Hospitality',
];

interface SearchFormProps {
  onSearch: (location: string, category: HospitalityCategory, source: DataSource) => void;
  loading?: boolean;
}

export function SearchForm({ onSearch, loading = false }: SearchFormProps) {
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<HospitalityCategory>('Restaurants');
  const [source, setSource] = useState<DataSource>('Google Maps');
  const sources: DataSource[] = ['Google Maps', 'TomTom', 'Geoapify'];
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim()) {
      onSearch(location, category, source);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">Location</label>
        <input
          type="text"
          placeholder="Enter city, town, area or locality..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full px-4 py-3 border border-input bg-card text-foreground placeholder:text-muted-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">Data source</label>
        <select
          value={source}
          onChange={(event) => setSource(event.target.value as DataSource)}
          disabled={loading}
          className="w-full rounded-md border border-input bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {sources.map((item) => <option key={item} value={item}>{item}{item === 'Google Maps' ? ' (API key required)' : ''}</option>)}
        </select>
        <p className="text-xs text-muted-foreground">Choose which provider supplies the live business records.</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">Category</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            disabled={loading}
            className="w-full px-4 py-3 border border-input bg-card text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring flex items-center justify-between"
          >
            <span>{category}</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {showCategoryDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 border border-input bg-popover rounded-md shadow-lg z-10">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    setShowCategoryDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-accent hover:text-accent-foreground text-foreground text-sm first:rounded-t-md last:rounded-b-md"
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading || !location.trim()}
        className="w-full"
      >
        {loading ? 'Searching...' : 'Search Businesses'}
      </Button>
    </form>
  );
}
