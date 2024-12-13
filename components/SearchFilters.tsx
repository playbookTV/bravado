import React from 'react'
import * as Select from '@radix-ui/react-select'
import { motion } from 'framer-motion'
import {
  FunnelIcon,
  ClockIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'

interface SearchFiltersProps {
  filters: {
    timeRange: string
    language: string
    safeSearch: string
    resultCount: number
  }
  onFilterChange: (key: string, value: string | number) => void
}

const SelectItem = React.forwardRef<
  HTMLDivElement,
  Select.SelectItemProps & { icon?: React.ReactNode }
>(({ children, icon, ...props }, forwardedRef) => {
  return (
    <Select.Item
      {...props}
      ref={forwardedRef}
      className="relative flex items-center px-6 py-2 text-sm text-gray-700 dark:text-gray-200 outline-none hover:bg-gray-100 dark:hover:bg-dark-hover data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-dark-hover cursor-pointer"
    >
      <Select.ItemIndicator className="absolute left-2">
        <CheckIcon className="w-4 h-4" />
      </Select.ItemIndicator>
      {icon && <span className="mr-2">{icon}</span>}
      <Select.ItemText>{children}</Select.ItemText>
    </Select.Item>
  )
})

SelectItem.displayName = 'SelectItem'

export default function SearchFilters({ filters, onFilterChange }: SearchFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <FunnelIcon className="w-5 h-5 text-gray-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
      </div>

      <div className="flex flex-wrap gap-4">
        {/* Time Range Filter */}
        <Select.Root value={filters.timeRange} onValueChange={(value) => onFilterChange('timeRange', value)}>
          <Select.Trigger
            className="inline-flex items-center justify-between px-3 py-2 text-sm bg-gray-50 dark:bg-dark-hover rounded-md border-0 focus:ring-2 focus:ring-primary min-w-[140px]"
            aria-label="Time Range"
          >
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-gray-400" />
              <Select.Value />
            </div>
            <Select.Icon>
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            </Select.Icon>
          </Select.Trigger>

          <Select.Portal>
            <Select.Content className="overflow-hidden bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <Select.Viewport>
                <SelectItem value="any">Any time</SelectItem>
                <SelectItem value="day">Past 24 hours</SelectItem>
                <SelectItem value="week">Past week</SelectItem>
                <SelectItem value="month">Past month</SelectItem>
                <SelectItem value="year">Past year</SelectItem>
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>

        {/* Language Filter */}
        <Select.Root value={filters.language} onValueChange={(value) => onFilterChange('language', value)}>
          <Select.Trigger
            className="inline-flex items-center justify-between px-3 py-2 text-sm bg-gray-50 dark:bg-dark-hover rounded-md border-0 focus:ring-2 focus:ring-primary min-w-[140px]"
            aria-label="Language"
          >
            <div className="flex items-center gap-2">
              <GlobeAltIcon className="w-4 h-4 text-gray-400" />
              <Select.Value />
            </div>
            <Select.Icon>
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            </Select.Icon>
          </Select.Trigger>

          <Select.Portal>
            <Select.Content className="overflow-hidden bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <Select.Viewport>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="it">Italian</SelectItem>
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>

        {/* Safe Search Filter */}
        <Select.Root value={filters.safeSearch} onValueChange={(value) => onFilterChange('safeSearch', value)}>
          <Select.Trigger
            className="inline-flex items-center justify-between px-3 py-2 text-sm bg-gray-50 dark:bg-dark-hover rounded-md border-0 focus:ring-2 focus:ring-primary min-w-[140px]"
            aria-label="Safe Search"
          >
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-gray-400" />
              <Select.Value />
            </div>
            <Select.Icon>
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            </Select.Icon>
          </Select.Trigger>

          <Select.Portal>
            <Select.Content className="overflow-hidden bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <Select.Viewport>
                <SelectItem value="strict">Strict</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="off">Off</SelectItem>
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>

        {/* Results Count Filter */}
        <Select.Root
          value={filters.resultCount.toString()}
          onValueChange={(value) => onFilterChange('resultCount', parseInt(value))}
        >
          <Select.Trigger
            className="inline-flex items-center justify-between px-3 py-2 text-sm bg-gray-50 dark:bg-dark-hover rounded-md border-0 focus:ring-2 focus:ring-primary min-w-[100px]"
            aria-label="Results Count"
          >
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Results:</span>
              <Select.Value />
            </div>
            <Select.Icon>
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            </Select.Icon>
          </Select.Trigger>

          <Select.Portal>
            <Select.Content className="overflow-hidden bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <Select.Viewport>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>
    </div>
  )
} 