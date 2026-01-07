'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface FilterControlsProps {
  onFilterChange: (filters: FilterState) => void;
  onSearchChange: (search: string) => void;
}

export interface FilterState {
  status: 'all' | 'pending' | 'processing' | 'completed' | 'error';
  sortBy: 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc';
}

const FilterControls = ({ onFilterChange, onSearchChange }: FilterControlsProps) => {
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    sortBy: 'date-desc'
  });
  const [searchTerm, setSearchTerm] = useState('');

  const handleStatusChange = (status: FilterState['status']) => {
    const newFilters = { ...filters, status };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSortChange = (sortBy: FilterState['sortBy']) => {
    const newFilters = { ...filters, sortBy };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearchChange(value);
  };

  const statusOptions = [
    { value: 'all', label: 'All Projects', icon: 'RectangleStackIcon' },
    { value: 'pending', label: 'Pending', icon: 'ClockIcon' },
    { value: 'processing', label: 'Processing', icon: 'ArrowPathIcon' },
    { value: 'completed', label: 'Completed', icon: 'CheckCircleIcon' },
    { value: 'error', label: 'Error', icon: 'ExclamationCircleIcon' }
  ];

  const sortOptions = [
    { value: 'date-desc', label: 'Newest First', icon: 'ArrowDownIcon' },
    { value: 'date-asc', label: 'Oldest First', icon: 'ArrowUpIcon' },
    { value: 'title-asc', label: 'Title A-Z', icon: 'BarsArrowUpIcon' },
    { value: 'title-desc', label: 'Title Z-A', icon: 'BarsArrowDownIcon' }
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Icon
              name="MagnifyingGlassIcon"
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground font-caption text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-250"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value as FilterState['status'])}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap
                transition-all duration-250 focus-ring font-caption text-sm font-medium
                ${filters.status === option.value
                  ? 'bg-primary text-primary-foreground shadow-glow-soft'
                  : 'bg-muted text-foreground hover:bg-muted/80'
                }
              `}
            >
              <Icon name={option.icon as any} size={16} />
              <span>{option.label}</span>
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={filters.sortBy}
            onChange={(e) => handleSortChange(e.target.value as FilterState['sortBy'])}
            className="appearance-none w-full lg:w-auto pl-4 pr-10 py-2.5 bg-muted border border-border rounded-lg text-foreground font-caption text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-250 cursor-pointer"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Icon
            name="ChevronDownIcon"
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterControls;