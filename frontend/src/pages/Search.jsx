// frontend/src/pages/Search.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Search as SearchIcon,
  MapPin,
  Filter,
  X,
  SlidersHorizontal,
  Grid3x3,
  List,
  ChevronDown,
  RefreshCw,
  Crosshair,
  DollarSign,
  Package,
  Calendar,
  Clock,
  Star,
  Plus,
  Minus,
  ArrowUpDown,
  Eye,
  Heart,
  Share2
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { useLocation as useGeoLocation } from '../hooks/useLocation.js'
import { listingService } from '../services/listingService.js'
import { offerService } from '../services/offerService.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import Badge from '../components/ui/Badge.jsx'
import Map from '../components/Map.jsx'
import ProductCard from '../components/ProductCard.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import Pagination from '../components/Pagination.jsx'
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatDistance
} from '../utils/formatters.js'
import { PRODUCT_SUB_CATEGORIES } from '../utils/constants.js'

const Search = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, isBuyer, isManager, isAdmin } = useAuth()
  const { success, error } = useToast()
  const {
    location: userLocation,
    getLocation,
    loading: locationLoading
  } = useGeoLocation()

  const initialQuery = new URLSearchParams(location.search)
  const initialSearch = initialQuery.get('q') || ''
  const initialView = initialQuery.get('view') || 'grid'

  // =============================================
  // STATE
  // =============================================
  const [searchParams, setSearchParams] = useState({
    query: initialSearch,
    category: '',
    minPrice: '',
    maxPrice: '',
    lat: null,
    lng: null,
    radius: 50,
    sortBy: 'newest',
    status: 'active'
  })

  const [listings, setListings] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [viewMode, setViewMode] = useState(initialView)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [showMap, setShowMap] = useState(true)
  const [selectedListing, setSelectedListing] = useState(null)

  const searchTimeoutRef = useRef(null)
  const isMountedRef = useRef(true)
  const abortControllerRef = useRef(null)

  // =============================================
  // CATEGORY OPTIONS
  // =============================================
  const categoryOptions = Object.keys(PRODUCT_SUB_CATEGORIES).map(cat => ({
    label: cat,
    value: cat
  }))

  const sortOptions = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Nearest First', value: 'distance' },
    { label: 'Most Viewed', value: 'views' }
  ]

  const radiusOptions = [
    { label: '10 km', value: 10 },
    { label: '25 km', value: 25 },
    { label: '50 km', value: 50 },
    { label: '100 km', value: 100 },
    { label: '200 km', value: 200 },
    { label: '500 km', value: 500 }
  ]

  // =============================================
  // FETCH LISTINGS
  // =============================================
  const fetchListings = useCallback(async () => {
    if (!isMountedRef.current) return

    setIsLoading(true)
    setIsSearching(true)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      const filters = {
        page: currentPage,
        limit: pageSize,
        product_name: searchParams.query || null,
        min_price: searchParams.minPrice
          ? parseFloat(searchParams.minPrice)
          : null,
        max_price: searchParams.maxPrice
          ? parseFloat(searchParams.maxPrice)
          : null,
        lat: searchParams.lat || null,
        lng: searchParams.lng || null,
        radius_km: searchParams.radius || 50,
        status: searchParams.status || 'active'
      }

      // If no location provided, try to use user location
      if (!filters.lat && userLocation) {
        filters.lat = userLocation.latitude
        filters.lng = userLocation.longitude
        setSearchParams(prev => ({
          ...prev,
          lat: userLocation.latitude,
          lng: userLocation.longitude
        }))
      }

      const result = await listingService.getListings(filters)

      if (!isMountedRef.current) return

      if (result.success) {
        setListings(result.data || [])
        setTotalCount(result.count || 0)
      } else {
        error(result.error || 'Failed to load listings')
        setListings([])
        setTotalCount(0)
      }
    } catch (err) {
      if (err.name !== 'AbortError' && isMountedRef.current) {
        console.error('Search error:', err)
        error('Failed to search listings')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setIsSearching(false)
      }
    }
  }, [currentPage, pageSize, searchParams, userLocation, error])

  // =============================================
  // DEBOUNCED SEARCH
  // =============================================
  const debouncedSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1)
      fetchListings()
    }, 400)
  }, [fetchListings])

  // =============================================
  // INITIAL FETCH
  // =============================================
  useEffect(() => {
    isMountedRef.current = true

    // Get user location if available
    if (!userLocation && !locationLoading) {
      getLocation()
    }

    // Initial search
    if (initialSearch) {
      fetchListings()
    } else {
      // Load default listings
      fetchListings()
    }

    return () => {
      isMountedRef.current = false
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // =============================================
  // SEARCH ON PARAM CHANGE
  // =============================================
  useEffect(() => {
    if (currentPage > 1 || isSearching) {
      fetchListings()
    }
  }, [currentPage])

  // =============================================
  // HANDLE SEARCH
  // =============================================
  const handleSearch = e => {
    e?.preventDefault()
    setCurrentPage(1)
    fetchListings()
  }

  // =============================================
  // HANDLE PARAM CHANGE (with debounce)
  // =============================================
  const handleParamChange = (key, value) => {
    setSearchParams(prev => ({ ...prev, [key]: value }))
    debouncedSearch()
  }

  // =============================================
  // HANDLE SEARCH INPUT (immediate update)
  // =============================================
  const handleSearchInput = e => {
    const value = e.target.value
    setSearchParams(prev => ({ ...prev, query: value }))
    debouncedSearch()

    // Update URL
    const newUrl = new URL(window.location)
    newUrl.searchParams.set('q', value)
    window.history.pushState({}, '', newUrl)
  }

  // =============================================
  // HANDLE USE CURRENT LOCATION
  // =============================================
  const handleUseLocation = async () => {
    try {
      const pos = await getLocation()
      if (pos && pos.latitude && pos.longitude) {
        setSearchParams(prev => ({
          ...prev,
          lat: pos.latitude,
          lng: pos.longitude,
          radius: 50
        }))
        success('📍 Location updated')
        fetchListings()
      } else {
        error('Could not get location')
      }
    } catch (err) {
      error('Failed to get location. Please allow location access.')
    }
  }

  // =============================================
  // HANDLE MAP MARKER CLICK
  // =============================================
  const handleMarkerClick = listing => {
    setSelectedListing(listing)
    navigate(`/listings/${listing.id}`)
  }

  // =============================================
  // HANDLE CLEAR FILTERS
  // =============================================
  const clearFilters = () => {
    setSearchParams({
      query: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      lat: null,
      lng: null,
      radius: 50,
      sortBy: 'newest',
      status: 'active'
    })
    setCurrentPage(1)
    fetchListings()
  }

  // =============================================
  // UPDATE URL WITH SEARCH PARAMS
  // =============================================
  useEffect(() => {
    const url = new URL(window.location)
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value)
      } else {
        url.searchParams.delete(key)
      }
    })
    window.history.replaceState({}, '', url)
  }, [searchParams])

  // =============================================
  // RENDER FILTERS
  // =============================================
  const renderFilters = () => {
    return (
      <div className='space-y-4'>
        {/* Search Input */}
        <Input
          label='Search Products'
          placeholder='Search by product name...'
          value={searchParams.query}
          onChange={handleSearchInput}
          leftIcon={<SearchIcon className='w-4 h-4' />}
          variant='ethiopianGreen'
          darkMode={false}
        />

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4'>
          {/* Category */}
          <Select
            label='Category'
            options={categoryOptions}
            value={searchParams.category}
            onChange={e => handleParamChange('category', e.target.value)}
            placeholder='All Categories'
            variant='ethiopianGreen'
            darkMode={false}
          />

          {/* Sort By */}
          <Select
            label='Sort By'
            options={sortOptions}
            value={searchParams.sortBy}
            onChange={e => handleParamChange('sortBy', e.target.value)}
            placeholder='Sort By'
            variant='ethiopianGreen'
            darkMode={false}
          />
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          {/* Min Price */}
          <Input
            label='Min Price (Birr)'
            type='number'
            placeholder='Min'
            value={searchParams.minPrice}
            onChange={e => handleParamChange('minPrice', e.target.value)}
            leftIcon={<DollarSign className='w-3.5 h-3.5' />}
            variant='ethiopianGreen'
            darkMode={false}
          />

          {/* Max Price */}
          <Input
            label='Max Price (Birr)'
            type='number'
            placeholder='Max'
            value={searchParams.maxPrice}
            onChange={e => handleParamChange('maxPrice', e.target.value)}
            leftIcon={<DollarSign className='w-3.5 h-3.5' />}
            variant='ethiopianGreen'
            darkMode={false}
          />
        </div>

        {/* Location & Radius */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div>
            <Button
              variant='gondarBlue'
              fullWidth
              size='sm'
              onClick={handleUseLocation}
              isLoading={locationLoading}
              leftIcon={<Crosshair className='w-3.5 h-3.5' />}
            >
              Use My Location
            </Button>
            {searchParams.lat && searchParams.lng && (
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                📍 {searchParams.lat.toFixed(4)}, {searchParams.lng.toFixed(4)}
              </p>
            )}
          </div>
          <Select
            label='Radius'
            options={radiusOptions}
            value={searchParams.radius}
            onChange={e =>
              handleParamChange('radius', parseInt(e.target.value))
            }
            placeholder='Radius'
            variant='ethiopianGreen'
            darkMode={false}
          />
        </div>

        {/* Clear Filters */}
        <Button
          variant='outline'
          fullWidth
          size='sm'
          onClick={clearFilters}
          leftIcon={<RefreshCw className='w-3.5 h-3.5' />}
        >
          Clear Filters
        </Button>
      </div>
    )
  }

  // =============================================
  // RENDER RESULTS
  // =============================================
  const renderResults = () => {
    if (isLoading && !isSearching) {
      return (
        <div className='flex items-center justify-center py-12'>
          <LoadingSpinner
            variant='ethiopianFlag'
            size='lg'
            label='Searching...'
          />
        </div>
      )
    }

    if (listings.length === 0) {
      return (
        <Card variant='axumDark' className='p-8 text-center'>
          <div className='flex flex-col items-center gap-3'>
            <div className='w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center'>
              <SearchIcon className='w-8 h-8 text-gray-400' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
              No listings found
            </h3>
            <p className='text-sm text-gray-500 dark:text-gray-400 max-w-md'>
              Try adjusting your search filters or check back later for new
              listings.
            </p>
            <Button
              variant='ethiopianGreen'
              size='sm'
              onClick={clearFilters}
              className='mt-2'
            >
              Clear Filters
            </Button>
          </div>
        </Card>
      )
    }

    return (
      <>
        {/* Results Count */}
        <div className='flex items-center justify-between mb-4'>
          <div className='text-sm text-gray-500 dark:text-gray-400'>
            Found{' '}
            <span className='font-semibold text-gray-900 dark:text-white'>
              {formatNumber(totalCount)}
            </span>{' '}
            listings
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant={viewMode === 'grid' ? 'ethiopianGreen' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('grid')}
              className='!p-2'
            >
              <Grid3x3 className='w-4 h-4' />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'ethiopianGreen' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('list')}
              className='!p-2'
            >
              <List className='w-4 h-4' />
            </Button>
          </div>
        </div>

        {/* Listings Grid */}
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4'
              : 'space-y-4'
          }
        >
          {listings.map(listing => (
            <ProductCard
              key={listing.id}
              listing={listing}
              variant='ethiopianGreen'
              size='md'
              showActions
              showDistance
              showExpiry
              showLocation
              userLocation={userLocation}
              onViewDetails={() => navigate(`/listings/${listing.id}`)}
              onMakeOffer={() => navigate(`/listings/${listing.id}`)}
              darkMode={false}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalCount > pageSize && (
          <Pagination
            totalItems={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[8, 12, 24, 48]}
            variant='ethiopianGreen'
            darkMode={false}
            className='mt-6'
          />
        )}
      </>
    )
  }

  // =============================================
  // MOBILE FILTER TOGGLE
  // =============================================
  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen)
  }

  // =============================================
  // MAIN RENDER
  // =============================================
  return (
    <div className='max-w-7xl mx-auto space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
            🔍 Discover Products
          </h1>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            Find agricultural products from farmers across Ethiopia
          </p>
        </div>
        <Button
          variant='gondarBlue'
          size='md'
          onClick={toggleFilter}
          className='lg:hidden'
          leftIcon={<Filter className='w-4 h-4' />}
        >
          Filters
        </Button>
      </div>

      <div className='flex flex-col lg:flex-row gap-6'>
        {/* Filters Sidebar (Desktop) */}
        <div className='hidden lg:block w-72 flex-shrink-0'>
          <Card variant='ethiopianGreen' className='p-4 sticky top-24'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='font-semibold text-gray-900 dark:text-white'>
                🔍 Filters
              </h3>
              {(searchParams.query ||
                searchParams.category ||
                searchParams.minPrice ||
                searchParams.maxPrice ||
                searchParams.lat) && (
                <Badge variant='ethiopianRed' size='sm'>
                  Active
                </Badge>
              )}
            </div>
            {renderFilters()}
          </Card>
        </div>

        {/* Mobile Filters Drawer */}
        {isFilterOpen && (
          <div
            className='lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm'
            onClick={toggleFilter}
          >
            <div
              className='absolute bottom-0 left-0 right-0 max-h-[80vh] bg-white dark:bg-gray-900 rounded-t-2xl p-4 overflow-y-auto'
              onClick={e => e.stopPropagation()}
            >
              <div className='flex items-center justify-between mb-4'>
                <h3 className='font-semibold text-gray-900 dark:text-white'>
                  🔍 Filters
                </h3>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={toggleFilter}
                  leftIcon={<X className='w-4 h-4' />}
                >
                  Close
                </Button>
              </div>
              {renderFilters()}
            </div>
          </div>
        )}

        {/* Results Section */}
        <div className='flex-1 min-w-0'>
          {/* Map Toggle */}
          <div className='flex items-center justify-between mb-4'>
            <Button
              variant={showMap ? 'gondarBlue' : 'outline'}
              size='sm'
              onClick={() => setShowMap(!showMap)}
              leftIcon={<MapPin className='w-3.5 h-3.5' />}
            >
              {showMap ? 'Hide Map' : 'Show Map'}
            </Button>
            {showMap && (
              <Badge variant='ethiopianGreen' size='sm'>
                {listings.filter(l => l.latitude && l.longitude).length} on map
              </Badge>
            )}
          </div>

          {/* Map */}
          {showMap && (
            <Card variant='gondarBlue' className='p-0 overflow-hidden mb-6'>
              <div className='h-64 md:h-80 w-full'>
                <Map
                  center={
                    searchParams.lat && searchParams.lng
                      ? [searchParams.lat, searchParams.lng]
                      : userLocation
                      ? [userLocation.latitude, userLocation.longitude]
                      : [9.03, 38.76]
                  }
                  zoom={12}
                  listings={listings}
                  variant='gondarBlue'
                  darkMode={false}
                  onMarkerClick={handleMarkerClick}
                  showUserLocation={true}
                  className='h-full w-full rounded-xl'
                />
              </div>
            </Card>
          )}

          {/* Results */}
          {renderResults()}
        </div>
      </div>
    </div>
  )
}

export default Search
