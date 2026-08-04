// frontend/src/pages/MyListings.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package,
  Plus,
  Search as SearchIcon,
  Filter,
  X,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Download,
  RefreshCw,
  MoreVertical,
  Copy,
  Share2
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { listingService } from '../services/listingService.js'
import { offerService } from '../services/offerService.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import Badge from '../components/ui/Badge.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import Dialog from '../components/ui/Dialog.jsx'
import Pagination from '../components/Pagination.jsx'
import {
  formatCurrency,
  formatDate,
  formatTimeAgo,
  formatNumber,
  formatListingStatus
} from '../utils/formatters.js'
import { LISTING_STATUS, LISTING_STATUS_LABELS } from '../utils/constants.js'

const MyListings = () => {
  const navigate = useNavigate()
  const { user, isAdmin, isManager } = useAuth()
  const { success, error } = useToast()

  // =============================================
  // STATE
  // =============================================
  const [listings, setListings] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortField, setSortField] = useState('created_at')
  const [sortDirection, setSortDirection] = useState('desc')
  const [selectedListings, setSelectedListings] = useState([])
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [listingToDelete, setListingToDelete] = useState(null)
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)
  const [isStatusChangeModalOpen, setIsStatusChangeModalOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    reserved: 0,
    completed: 0,
    expired: 0
  })
  const [isExporting, setIsExporting] = useState(false)

  const abortControllerRef = useRef(null)

  // =============================================
  // STATUS OPTIONS
  // =============================================
  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Reserved', value: 'reserved' },
    { label: 'Completed', value: 'completed' },
    { label: 'Expired', value: 'expired' }
  ]

  // =============================================
  // FETCH LISTINGS
  // =============================================
  const fetchListings = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      const result = await listingService.getMyListings(user.id, {
        page: currentPage,
        limit: pageSize,
        status: statusFilter || null,
        search: searchQuery || null,
        sort_by: sortField,
        sort_order: sortDirection
      })

      if (result.success) {
        setListings(result.data || [])
        setTotalCount(result.count || 0)
      } else {
        error(result.error || 'Failed to load listings')
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Fetch listings error:', err)
        error('Failed to load listings')
      }
    } finally {
      setIsLoading(false)
    }
  }, [
    user,
    currentPage,
    pageSize,
    statusFilter,
    searchQuery,
    sortField,
    sortDirection,
    error
  ])

  // =============================================
  // FETCH STATS
  // =============================================
  const fetchStats = useCallback(async () => {
    if (!user?.id) return

    try {
      const result = await listingService.getListingStats(user.id)
      if (result.success && result.data) {
        setStats(result.data)
      }
    } catch (err) {
      console.error('Fetch stats error:', err)
    }
  }, [user])

  // =============================================
  // INITIAL FETCH
  // =============================================
  useEffect(() => {
    fetchListings()
    fetchStats()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchListings, fetchStats])

  // =============================================
  // HANDLE SEARCH
  // =============================================
  const handleSearch = e => {
    e?.preventDefault()
    setCurrentPage(1)
    fetchListings()
  }

  // =============================================
  // HANDLE SEARCH INPUT (debounced)
  // =============================================
  const searchTimeoutRef = useRef(null)

  const handleSearchInput = e => {
    const value = e.target.value
    setSearchQuery(value)
    setCurrentPage(1)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchListings()
    }, 400)
  }

  // =============================================
  // HANDLE STATUS FILTER CHANGE
  // =============================================
  const handleStatusFilterChange = e => {
    setStatusFilter(e.target.value)
    setCurrentPage(1)
    fetchListings()
  }

  // =============================================
  // HANDLE SORT
  // =============================================
  const handleSort = field => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setCurrentPage(1)
    fetchListings()
  }

  // =============================================
  // HANDLE SELECT LISTING
  // =============================================
  const toggleSelectListing = listingId => {
    setSelectedListings(prev =>
      prev.includes(listingId)
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    )
  }

  // =============================================
  // HANDLE SELECT ALL
  // =============================================
  const handleSelectAll = () => {
    if (selectedListings.length === listings.length) {
      setSelectedListings([])
    } else {
      setSelectedListings(listings.map(l => l.id))
    }
  }

  // =============================================
  // HANDLE DELETE LISTING
  // =============================================
  const handleDeleteListing = async () => {
    if (!listingToDelete) return

    try {
      const result = await listingService.deleteListing(listingToDelete)
      if (result.success) {
        success('Listing deleted successfully')
        setListingToDelete(null)
        setIsDeleteModalOpen(false)
        fetchListings()
        fetchStats()
      } else {
        error(result.error || 'Failed to delete listing')
      }
    } catch (err) {
      console.error('Delete error:', err)
      error('Failed to delete listing')
    }
  }

  // =============================================
  // HANDLE BULK DELETE
  // =============================================
  const handleBulkDelete = async () => {
    if (selectedListings.length === 0) return

    try {
      let successCount = 0
      let failCount = 0

      for (const id of selectedListings) {
        const result = await listingService.deleteListing(id)
        if (result.success) {
          successCount++
        } else {
          failCount++
        }
      }

      if (successCount > 0) {
        success(`${successCount} listing(s) deleted successfully`)
      }
      if (failCount > 0) {
        error(`${failCount} listing(s) failed to delete`)
      }

      setSelectedListings([])
      setIsBulkDeleteModalOpen(false)
      fetchListings()
      fetchStats()
    } catch (err) {
      console.error('Bulk delete error:', err)
      error('Failed to delete listings')
    }
  }

  // =============================================
  // HANDLE STATUS CHANGE
  // =============================================
  const handleStatusChange = async () => {
    if (!newStatus || selectedListings.length === 0) return

    try {
      let successCount = 0
      let failCount = 0

      for (const id of selectedListings) {
        const result = await listingService.updateListingStatus(id, newStatus)
        if (result.success) {
          successCount++
        } else {
          failCount++
        }
      }

      if (successCount > 0) {
        success(`${successCount} listing(s) status updated to ${newStatus}`)
      }
      if (failCount > 0) {
        error(`${failCount} listing(s) failed to update`)
      }

      setSelectedListings([])
      setNewStatus('')
      setIsStatusChangeModalOpen(false)
      fetchListings()
      fetchStats()
    } catch (err) {
      console.error('Status change error:', err)
      error('Failed to update status')
    }
  }

  // =============================================
  // HANDLE EXPORT CSV
  // =============================================
  const handleExportCSV = () => {
    setIsExporting(true)

    try {
      const headers = [
        'Product Name',
        'Quantity (q)',
        'Price (Birr/q)',
        'Status',
        'Harvest Date',
        'Expiry Date',
        'Created At',
        'Views'
      ]

      const rows = listings.map(l => [
        l.product_name,
        l.quantity_quintals,
        l.unit_price,
        formatListingStatus(l.status),
        formatDate(l.harvest_date, 'short'),
        formatDate(l.expiry_date, 'short'),
        formatDate(l.created_at, 'short'),
        l.views || 0
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `my-listings-${formatDate(new Date(), 'short')}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      success('CSV exported successfully')
    } catch (err) {
      console.error('Export error:', err)
      error('Failed to export CSV')
    } finally {
      setIsExporting(false)
    }
  }

  // =============================================
  // STATISTICS CARDS
  // =============================================
  const statCards = [
    {
      label: 'Total',
      value: stats.total,
      icon: <Package className='w-4 h-4' />,
      color: 'text-gray-500',
      bg: 'bg-gray-50 dark:bg-gray-800/50'
    },
    {
      label: 'Active',
      value: stats.active,
      icon: <CheckCircle className='w-4 h-4' />,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      label: 'Reserved',
      value: stats.reserved,
      icon: <Clock className='w-4 h-4' />,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: <CheckCircle className='w-4 h-4' />,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      label: 'Expired',
      value: stats.expired,
      icon: <AlertCircle className='w-4 h-4' />,
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-900/20'
    }
  ]

  // =============================================
  // RENDER STATS
  // =============================================
  const renderStats = () => {
    return (
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3'>
        {statCards.map((stat, index) => (
          <Card
            key={index}
            variant='axumDark'
            className='p-3 text-center hover:shadow-md transition-shadow'
          >
            <div className={`${stat.bg} rounded-lg p-2 inline-block mx-auto`}>
              <span className={stat.color}>{stat.icon}</span>
            </div>
            <p className='text-xl font-bold text-gray-900 dark:text-white mt-1'>
              {stat.value}
            </p>
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              {stat.label}
            </p>
          </Card>
        ))}
      </div>
    )
  }

  // =============================================
  // RENDER LISTING CARD (Grid View)
  // =============================================
  const renderListingCard = listing => {
    const isSelected = selectedListings.includes(listing.id)

    return (
      <Card
        key={listing.id}
        variant='axumDark'
        className={`p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.01] ${
          isSelected ? 'ring-2 ring-primary-500' : ''
        }`}
      >
        <div className='flex items-start justify-between gap-3'>
          <div className='flex items-center gap-3 min-w-0'>
            <input
              type='checkbox'
              checked={isSelected}
              onChange={() => toggleSelectListing(listing.id)}
              className='w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 flex-shrink-0 mt-1'
              onClick={e => e.stopPropagation()}
            />
            <div
              className='w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0 cursor-pointer'
              onClick={() => navigate(`/listings/${listing.id}`)}
            >
              <Package className='w-5 h-5 text-primary-600' />
            </div>
            <div
              className='min-w-0 cursor-pointer'
              onClick={() => navigate(`/listings/${listing.id}`)}
            >
              <p className='font-medium text-gray-900 dark:text-white truncate'>
                {listing.product_name}
              </p>
              <div className='flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
                <span>{formatNumber(listing.quantity_quintals)} q</span>
                <span>•</span>
                <span className='font-medium text-primary-600'>
                  {formatCurrency(listing.unit_price)}
                </span>
                <span>•</span>
                <StatusBadge status={listing.status} size='xs' />
              </div>
            </div>
          </div>
          <div className='flex items-center gap-1 flex-shrink-0'>
            <Button
              variant='ghost'
              size='sm'
              className='!p-1.5'
              onClick={() => navigate(`/listings/${listing.id}`)}
            >
              <Eye className='w-3.5 h-3.5' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              className='!p-1.5'
              onClick={() => navigate(`/new-listing/${listing.id}`)}
            >
              <Edit className='w-3.5 h-3.5' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              className='!p-1.5 text-red-500 hover:text-red-600'
              onClick={() => {
                setListingToDelete(listing.id)
                setIsDeleteModalOpen(true)
              }}
            >
              <Trash2 className='w-3.5 h-3.5' />
            </Button>
          </div>
        </div>

        <div className='flex items-center gap-4 mt-2 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-2'>
          <span className='flex items-center gap-1'>
            <Clock className='w-3 h-3' />
            {formatTimeAgo(listing.created_at)}
          </span>
          <span className='flex items-center gap-1'>
            <Eye className='w-3 h-3' />
            {listing.views || 0} views
          </span>
          {listing.expiry_date && (
            <span className='flex items-center gap-1'>
              <AlertCircle className='w-3 h-3' />
              Exp: {formatDate(listing.expiry_date, 'short')}
            </span>
          )}
        </div>
      </Card>
    )
  }

  // =============================================
  // RENDER LISTING ROW (List View)
  // =============================================
  const renderListingRow = listing => {
    const isSelected = selectedListings.includes(listing.id)

    return (
      <div
        key={listing.id}
        className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:shadow-md ${
          isSelected
            ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        <input
          type='checkbox'
          checked={isSelected}
          onChange={() => toggleSelectListing(listing.id)}
          className='w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 flex-shrink-0'
          onClick={e => e.stopPropagation()}
        />

        <div
          className='flex-1 min-w-0 cursor-pointer'
          onClick={() => navigate(`/listings/${listing.id}`)}
        >
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0'>
              <Package className='w-4 h-4 text-primary-600' />
            </div>
            <div className='min-w-0'>
              <p className='font-medium text-gray-900 dark:text-white text-sm truncate'>
                {listing.product_name}
              </p>
              <div className='flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
                <span>{formatNumber(listing.quantity_quintals)} q</span>
                <span>•</span>
                <span className='font-medium text-primary-600'>
                  {formatCurrency(listing.unit_price)}
                </span>
                <span>•</span>
                <StatusBadge status={listing.status} size='xs' />
                <span>•</span>
                <span>{formatTimeAgo(listing.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className='flex items-center gap-1 flex-shrink-0'>
          <Button
            variant='ghost'
            size='sm'
            className='!p-1.5'
            onClick={() => navigate(`/listings/${listing.id}`)}
          >
            <Eye className='w-3.5 h-3.5' />
          </Button>
          <Button
            variant='ghost'
            size='sm'
            className='!p-1.5'
            onClick={() => navigate(`/new-listing/${listing.id}`)}
          >
            <Edit className='w-3.5 h-3.5' />
          </Button>
          <Button
            variant='ghost'
            size='sm'
            className='!p-1.5 text-red-500 hover:text-red-600'
            onClick={() => {
              setListingToDelete(listing.id)
              setIsDeleteModalOpen(true)
            }}
          >
            <Trash2 className='w-3.5 h-3.5' />
          </Button>
        </div>
      </div>
    )
  }

  // =============================================
  // RENDER TOOLBAR
  // =============================================
  const renderToolbar = () => {
    return (
      <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3'>
        {/* Search */}
        <div className='flex-1 w-full sm:w-auto'>
          <Input
            placeholder='Search by product name...'
            value={searchQuery}
            onChange={handleSearchInput}
            leftIcon={<SearchIcon className='w-4 h-4' />}
            variant='ethiopianGreen'
            darkMode={false}
            className='w-full sm:min-w-[200px]'
          />
        </div>

        {/* Status Filter */}
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={handleStatusFilterChange}
          placeholder='All Statuses'
          variant='ethiopianGreen'
          darkMode={false}
          className='w-full sm:w-40'
        />

        {/* View Mode Toggle */}
        <div className='flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5'>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
            aria-label='Grid view'
          >
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z'
              />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
            aria-label='List view'
          >
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 6h16M4 12h16M4 18h16'
              />
            </svg>
          </button>
        </div>

        {/* Export Button */}
        <Button
          variant='outline'
          size='sm'
          onClick={handleExportCSV}
          isLoading={isExporting}
          leftIcon={<Download className='w-3.5 h-3.5' />}
        >
          Export
        </Button>

        {/* Create New Button */}
        <Button
          variant='ethiopianGreen'
          size='sm'
          onClick={() => navigate('/new-listing')}
          leftIcon={<Plus className='w-3.5 h-3.5' />}
        >
          New Listing
        </Button>
      </div>
    )
  }

  // =============================================
  // RENDER SELECTION ACTIONS
  // =============================================
  const renderSelectionActions = () => {
    if (selectedListings.length === 0) return null

    return (
      <div className='flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800'>
        <span className='text-sm font-medium text-primary-700 dark:text-primary-300'>
          {selectedListings.length} selected
        </span>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setSelectedListings([])}
          leftIcon={<X className='w-3.5 h-3.5' />}
        >
          Clear
        </Button>
        <Select
          options={statusOptions.filter(o => o.value !== '')}
          value={newStatus}
          onChange={e => setNewStatus(e.target.value)}
          placeholder='Change Status'
          variant='gondarBlue'
          darkMode={false}
          className='w-40'
        />
        <Button
          variant='gondarBlue'
          size='sm'
          onClick={() => {
            if (newStatus) {
              setIsStatusChangeModalOpen(true)
            }
          }}
          disabled={!newStatus}
        >
          Apply
        </Button>
        <Button
          variant='danger'
          size='sm'
          onClick={() => setIsBulkDeleteModalOpen(true)}
          leftIcon={<Trash2 className='w-3.5 h-3.5' />}
        >
          Delete Selected
        </Button>
      </div>
    )
  }

  // =============================================
  // LOADING STATE
  // =============================================
  if (isLoading && listings.length === 0) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <LoadingSpinner
          variant='ethiopianFlag'
          size='lg'
          label='Loading listings...'
        />
      </div>
    )
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
            📦 My Listings
          </h1>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            Manage all your product listings in one place
          </p>
        </div>
        <Badge variant='ethiopianGreen' size='sm'>
          {formatNumber(totalCount)} listings
        </Badge>
      </div>

      {/* Stats */}
      {renderStats()}

      {/* Toolbar */}
      {renderToolbar()}

      {/* Selection Actions */}
      {renderSelectionActions()}

      {/* Listings */}
      {listings.length === 0 ? (
        <Card variant='axumDark' className='p-8 text-center'>
          <div className='flex flex-col items-center gap-3'>
            <Package className='w-16 h-16 text-gray-300 dark:text-gray-600' />
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
              No listings found
            </h3>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              {searchQuery || statusFilter
                ? 'Try adjusting your search or filters'
                : 'Start by creating your first listing'}
            </p>
            {!searchQuery && !statusFilter && (
              <Button
                variant='ethiopianGreen'
                onClick={() => navigate('/new-listing')}
                leftIcon={<Plus className='w-4 h-4' />}
              >
                Create New Listing
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <>
          {/* Listings Grid/List */}
          {viewMode === 'grid' ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {listings.map(renderListingCard)}
            </div>
          ) : (
            <div className='space-y-2'>{listings.map(renderListingRow)}</div>
          )}

          {/* Pagination */}
          {totalCount > pageSize && (
            <Pagination
              totalItems={totalCount}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[8, 12, 24, 48, 96]}
              variant='ethiopianGreen'
              darkMode={false}
              className='mt-6'
            />
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setListingToDelete(null)
        }}
        title='Delete Listing'
        description='Are you sure you want to delete this listing? This action cannot be undone.'
        variant='ethiopianRed'
        size='sm'
        showConfirm
        showCancel
        confirmText='Yes, Delete'
        cancelText='Cancel'
        onConfirm={handleDeleteListing}
        onCancel={() => {
          setIsDeleteModalOpen(false)
          setListingToDelete(null)
        }}
        darkMode={false}
      />

      {/* Bulk Delete Confirmation Modal */}
      <Dialog
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        title='Delete Selected Listings'
        description={`Are you sure you want to delete ${selectedListings.length} selected listing(s)? This action cannot be undone.`}
        variant='ethiopianRed'
        size='sm'
        showConfirm
        showCancel
        confirmText='Yes, Delete All'
        cancelText='Cancel'
        onConfirm={handleBulkDelete}
        onCancel={() => setIsBulkDeleteModalOpen(false)}
        darkMode={false}
      />

      {/* Status Change Confirmation Modal */}
      <Dialog
        isOpen={isStatusChangeModalOpen}
        onClose={() => setIsStatusChangeModalOpen(false)}
        title='Change Status'
        description={`Are you sure you want to change the status of ${selectedListings.length} selected listing(s) to "${newStatus}"?`}
        variant='gondarBlue'
        size='sm'
        showConfirm
        showCancel
        confirmText='Yes, Change Status'
        cancelText='Cancel'
        onConfirm={handleStatusChange}
        onCancel={() => setIsStatusChangeModalOpen(false)}
        darkMode={false}
      />
    </div>
  )
}

export default MyListings
