'use client';

import { useMemo, useState } from 'react';
import { Business, WebsiteStatus } from '@/lib/types';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BusinessTableProps {
  businesses: Business[];
  onSelectBusiness?: (business: Business) => void;
  selectedIds?: string[];
  pipelineIds?: string[];
  onToggleSelection?: (business: Business) => void;
  onToggleAll?: (businesses: Business[]) => void;
  onAddToPipeline?: (business: Business) => void;
}

type SortKey = 'name' | 'rating' | 'websiteStatus' | 'dataCompleteness' | 'category';
type FilterStatus = 'All' | 'No Website' | 'Inactive' | 'Active';

const websiteStatusOrder: Record<WebsiteStatus, number> = {
  'NO_WEBSITE': 0,
  'INACTIVE': 1,
  'ACTIVE': 2,
};

const websiteStatusDisplay: Record<WebsiteStatus, string> = {
  'NO_WEBSITE': 'No Website',
  'INACTIVE': 'Inactive',
  'ACTIVE': 'Active',
};

const websiteStatusColor: Record<WebsiteStatus, string> = {
  'NO_WEBSITE': 'bg-orange-50 text-orange-900 border-orange-200',
  'INACTIVE': 'bg-yellow-50 text-yellow-900 border-yellow-200',
  'ACTIVE': 'bg-green-50 text-green-900 border-green-200',
};

export function BusinessTable({ businesses, onSelectBusiness, selectedIds = [], pipelineIds = [], onToggleSelection, onToggleAll, onAddToPipeline }: BusinessTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('All');

  const filtered = useMemo(() => {
    if (filterStatus === 'All') return businesses;

    const statusMap: Record<Exclude<FilterStatus, 'All'>, WebsiteStatus> = {
      'No Website': 'NO_WEBSITE',
      'Inactive': 'INACTIVE',
      'Active': 'ACTIVE',
    };

    return businesses.filter((business) => business.websiteStatus === statusMap[filterStatus]);
  }, [businesses, filterStatus]);

  const getGoogleMapsUrl = (business: Business) => {
    if (business.mapUrl) return business.mapUrl;
    const query = [business.name, business.address].filter(Boolean).join(', ');
    if (query) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    }
    if (business.latitude !== null && business.longitude !== null) {
      return `https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`;
    }
    return null;
  };

  const sorted = useMemo(() => {
    const copy = [...filtered];

    copy.sort((a, b) => {
      let aVal: any = a[sortKey as keyof Business];
      let bVal: any = b[sortKey as keyof Business];

      if (sortKey === 'websiteStatus') {
        aVal = websiteStatusOrder[a.websiteStatus];
        bVal = websiteStatusOrder[b.websiteStatus];
      }

      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      if (typeof aVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return copy;
  }, [filtered, sortKey, sortOrder]);

  const allVisibleSelected = sorted.length > 0 && sorted.every((business) => selectedIds?.includes(business.id));

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const SortHeader = ({ label, sortKeyVal }: { label: string; sortKeyVal: SortKey }) => (
    <button
      onClick={() => handleSort(sortKeyVal)}
      className="flex items-center gap-1 hover:text-primary transition-colors"
    >
      {label}
      {sortKey === sortKeyVal && (
        <ChevronDown className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
      )}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-muted-foreground">Website Status:</span>
        {(['All', 'No Website', 'Inactive', 'Active'] as FilterStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filterStatus === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="results-table-scroll overflow-auto rounded-md border border-border">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-foreground"><input type="checkbox" aria-label="Select all displayed businesses" checked={allVisibleSelected} onChange={() => onToggleAll?.(sorted)} />
                <SortHeader label="Business Name" sortKeyVal="name" />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">
                <SortHeader label="Category" sortKeyVal="category" />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Address</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Phone</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Website</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Google Maps</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">
                <SortHeader label="Website Status" sortKeyVal="websiteStatus" />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">
                <SortHeader label="Rating" sortKeyVal="rating" />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">
                <SortHeader label="Data %" sortKeyVal="dataCompleteness" />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {!sorted.length && (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No businesses match the “{filterStatus}” website filter.
                  <button type="button" onClick={() => setFilterStatus('All')} className="ml-1 font-medium text-primary hover:underline">
                    Show all results
                  </button>
                </td>
              </tr>
            )}
            {sorted.map((business) => (
              <tr
                key={business.id}
                className="border-b border-border hover:bg-muted/50 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-foreground max-w-xs truncate"><input type="checkbox" aria-label={`Select ${business.name}`} checked={selectedIds.includes(business.id)} onChange={() => onToggleSelection?.(business)} />
                  {business.name}
                </td>
                <td className="px-4 py-3 text-foreground text-xs">{business.category}</td>
                <td
                  className="px-4 py-3 text-muted-foreground text-xs max-w-xs truncate"
                  title={business.address || 'Location not available'}
                >
                  {business.address || 'Location not available'}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {business.phone ? (
                    <a href={`tel:${business.phone}`} className="text-primary hover:underline">
                      {business.phone}
                    </a>
                  ) : (
                    'Not available'
                  )}
                </td>
                <td className="px-4 py-3 text-xs">
                  {business.website ? (
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      Visit
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    'Not available'
                  )}
                </td>
                <td className="px-4 py-3 text-xs">
                  {getGoogleMapsUrl(business) ? (
                    <a
                      href={getGoogleMapsUrl(business) ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                      aria-label={`Open ${business.name} in Google Maps`}
                    >
                      Open map
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    'Not available'
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${websiteStatusColor[business.websiteStatus]}`}
                  >
                    {websiteStatusDisplay[business.websiteStatus]}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground text-xs font-medium">
                  {business.rating ? `${business.rating}⭐` : 'Not available'}
                </td>
                <td className="px-4 py-3 font-medium text-foreground text-xs">
                  {business.dataCompleteness}%
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => onSelectBusiness?.(business)} className="text-xs">View</Button><Button size="sm" variant="outline" onClick={() => onAddToPipeline?.(business)} disabled={pipelineIds.includes(business.id)} className="text-xs">{pipelineIds.includes(business.id) ? 'In pipeline' : 'Add'}</Button></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>Showing {sorted.length} of {businesses.length} businesses</span>
        <span>Sorted by {sortKey === 'websiteStatus' ? 'website status' : sortKey}</span>
      </div>
    </div>
  );
}
