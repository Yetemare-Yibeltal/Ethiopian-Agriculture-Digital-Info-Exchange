// frontend/src/pages/AdminListings.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  DollarSign,
  Weight,
  Building2,
  MoreVertical,
  ArrowUpDown,
  List,
  Grid3x3
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { adminService } from '../services/adminService.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import Badge from '../components/ui/Badge.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import Dialog from '../components/ui/Dialog.jsx'
import Pagination from '../components/Pagination.jsx'
import Separator from '../components/ui/Separator.jsx'
import {
  formatCurrency,
  formatDate,
  formatTimeAgo,
  formatNumber
} from '../utils/formatters.js'
import { LISTING_STATUS, LISTING_STATUS_LABELS } from '../utils/constants.js'

const AdminListings = () => {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { success, error } = useToast()

  // =============================================
  // STATE
  // =============================================
  const [listings, setListings] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortField, setSortField] = useState('created_at')
  const [sortDirection, setSortDirection] = useState('desc')
  const [selectedListing, setSelectedListing] = useState(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [listingToDelete, setListingToDelete] = useState(null)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    reserved: 0,
    completed: 0,
    expired: 0
  })

  const searchTimeoutRef = useRef(null)
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

  const statusChangeOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Reserved', value: 'reserved' },
    { label: 'Completed', value: 'completed' },
    { label: 'Expired', value: 'expired' }
  ]

  // =============================================
  // FETCH LISTINGS
  // =============================================
  const fetchListings = useCallback(async () => {
    if (!isAdmin()) {
      navigate('/')
      return
    }

    setIsLoading(true)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      const result = await adminService.getListings({
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
    currentPage,
    pageSize,
    statusFilter,
    searchQuery,
    sortField,
    sortDirection,
    isAdmin,
    navigate,
    error
  ])

  // =============================================
  // FETCH STATS
  // =============================================
  const fetchStats = useCallback(async () => {
    try {
      const result = await adminService.getSystemStats()
      if (result.success && result.data) {
        setStats({
          total: result.data.listings?.total || 0,
          active: result.data.listings?.active || 0,
          reserved: result.data.listings?.reserved || 0,
          completed: result.data.listings?.completed || 0,
          expired: result.data.listings?.expired || 0
        })
      }
    } catch (err) {
      console.error('Fetch stats error:', err)
    }
  }, [])

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
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [fetchListings, fetchStats, refreshKey])

  // =============================================
  // HANDLE SEARCH INPUT (debounced)
  // =============================================
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
  // HANDLE CHANGE STATUS
  // =============================================
  const handleChangeStatus = listing => {
    setSelectedListing(listing)
    setNewStatus(listing.status)
    setIsStatusModalOpen(true)
  }

  // =============================================
  // HANDLE UPDATE STATUS
  // =============================================
  const handleUpdateStatus = async () => {
    if (!selectedListing || !newStatus) return

    setIsSubmitting(true)
    try {
      // Use adminService or direct update
      const result = (await adminService.updateListingStatus)
        ? adminService.updateListingStatus(selectedListing.id, newStatus)
        : (
            await import('../services/listingService.js')
          ).listingService.updateListingStatus(selectedListing.id, newStatus)

      if (result.success) {
        success(`Listing status updated to ${newStatus}`)
        setIsStatusModalOpen(false)
        setSelectedListing(null)
        setRefreshKey(prev => prev + 1)
        fetchStats()
      } else {
        error(result.error || 'Failed to update status')
      }
    } catch (err) {
      console.error('Update status error:', err)
      error('Failed to update status')
    } finally {
      setIsSubmitting(false)
    }
  }

  // =============================================
  // HANDLE DELETE LISTING
  // =============================================
  const handleDeleteListing = async () => {
    if (!listingToDelete) return

    setIsSubmitting(true)
    try {
      const result = await adminService.forceDeleteListing(listingToDelete)

      if (result.success) {
        success(result.message || 'Listing deleted successfully')
        setIsDeleteModalOpen(false)
        setListingToDelete(null)
        setRefreshKey(prev => prev + 1)
        fetchStats()
      } else {
        error(result.error || 'Failed to delete listing')
      }
    } catch (err) {
      console.error('Delete listing error:', err)
      error('Failed to delete listing')
    } finally {
      setIsSubmitting(false)
    }
  }

  // =============================================
  // RENDER STATS CARDS
  // =============================================
  const renderStats = () => {
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
        icon: <XCircle className='w-4 h-4' />,
        color: 'text-red-500',
        bg: 'bg-red-50 dark:bg-red-900/20'
      }
    ]

    return (
      <div className='grid grid-cols-2 sm:grid-cols-5 gap-3'>
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
  // RENDER TOOLBAR
  // =============================================
  const renderToolbar = () => (
    <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3'>
      <div className='flex-1 w-full sm:w-auto'>
        <Input
          placeholder='Search by product name...'
          value={searchQuery}
          onChange={handleSearchInput}
          leftIcon={<Search className='w-4 h-4' />}
          variant='ethiopianGreen'
          darkMode={false}
          className='w-full sm:min-w-[250px]'
        />
      </div>

      <Select
        options={statusOptions}
        value={statusFilter}
        onChange={handleStatusFilterChange}
        placeholder='All Statuses'
        variant='ethiopianGreen'
        darkMode={false}
        className='w-full sm:w-40'
      />

      <Button
        variant='outline'
        size='sm'
        onClick={() => setRefreshKey(prev => prev + 1)}
        leftIcon={<RefreshCw className='w-3.5 h-3.5' />}
      >
        Refresh
      </Button>
    </div>
  )

  // =============================================
  // RENDER TABLE
  // =============================================
  const renderTable = () => {
    if (listings.length === 0) {
      return (
        <div className='text-center py-12'>
          <Package className='w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3' />
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
            No listings found
          </h3>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            {searchQuery || statusFilter
              ? 'Try adjusting your search or filters'
              : 'No listings created yet'}
          </p>
        </div>
      )
    }

    return (
      <div className='overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='bg-gray-50 dark:bg-gray-800/50'>
              <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                Product
              </th>
              <th
                className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors'
                onClick={() => handleSort('product_name')}
              >
                <div className='flex items-center gap-1'>
                  Details
                  {sortField === 'product_name' &&
                    (sortDirection === 'asc' ? (
                      <ChevronUp className='w-3 h-3' />
                    ) : (
                      <ChevronDown className='w-3 h-3' />
                    ))}
                </div>
              </th>
              <th
                className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors'
                onClick={() => handleSort('status')}
              >
                <div className='flex items-center gap-1'>
                  Status
                  {sortField === 'status' &&
                    (sortDirection === 'asc' ? (
                      <ChevronUp className='w-3 h-3' />
                    ) : (
                      <ChevronDown className='w-3 h-3' />
                    ))}
                </div>
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                Manager
              </th>
              <th
                className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors'
                onClick={() => handleSort('created_at')}
              >
                <div className='flex items-center gap-1'>
                  Created
                  {sortField === 'created_at' &&
                    (sortDirection === 'asc' ? (
                      <ChevronUp className='w-3 h-3' />
                    ) : (
                      <ChevronDown className='w-3 h-3' />
                    ))}
                </div>
              </th>
              <th className='px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 dark:divide-gray-800'>
            {listings.map(l => (
              <tr
                key={l.id}
                className='hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors'
              >
                <td className='px-4 py-3'>
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0'>
                      <Package className='w-4 h-4 text-primary-600' />
                    </div>
                    <div>
                      <p className='font-medium text-gray-900 dark:text-white'>
                        {l.product_name}
                      </p>
                      <p className='text-xs text-gray-500 dark:text-gray-400'>
                        ID: {l.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className='px-4 py-3'>
                  <div className='flex flex-col gap-0.5'>
                    <span className='text-xs text-gray-600 dark:text-gray-300'>
                      {formatNumber(l.quantity_quintals)} q
                    </span>
                    <span className='text-xs font-medium text-primary-600 dark:text-primary-400'>
                      {formatCurrency(l.unit_price)}
                    </span>
                  </div>
                </td>
                <td className='px-4 py-3'>
                  <StatusBadge status={l.status} size='sm' />
                </td>
                <td className='px-4 py-3'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-gray-700 dark:text-gray-300'>
                      {l.manager_name || 'Unknown'}
                    </span>
                  </div>
                </td>
                <td className='px-4 py-3 text-xs text-gray-500 dark:text-gray-400'>
                  {formatTimeAgo(l.created_at)}
                </td>
                <td className='px-4 py-3 text-right'>
                  <div className='flex items-center justify-end gap-1'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='!p-1.5'
                      onClick={() => navigate(`/listings/${l.id}`)}
                      title='View listing'
                    >
                      <Eye className='w-3.5 h-3.5' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='!p-1.5 text-blue-500 hover:text-blue-600'
                      onClick={() => handleChangeStatus(l)}
                      title='Change status'
                    >
                      <RefreshCw className='w-3.5 h-3.5' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='!p-1.5 text-red-500 hover:text-red-600'
                      onClick={() => {
                        setListingToDelete(l.id)
                        setIsDeleteModalOpen(true)
                      }}
                      title='Delete listing'
                    >
                      <Trash2 className='w-3.5 h-3.5' />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
            📦 Listing Management
          </h1>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            Manage all product listings on the platform
          </p>
        </div>
        <Badge variant='ethiopianGreen' size='sm'>
          {formatNumber(totalCount)} total
        </Badge>
      </div>

      {/* Stats */}
      {renderStats()}

      {/* Toolbar */}
      {renderToolbar()}

      {/* Table */}
      <Card variant='ethiopianGreen' className='p-0 overflow-hidden'>
        <div className='p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Package className='w-4 h-4 text-gray-400' />
            <span className='text-sm font-medium text-gray-600 dark:text-gray-400'>
              {totalCount} listing{totalCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className='text-xs text-gray-400 dark:text-gray-500'>
            Showing {listings.length} of {totalCount}
          </div>
        </div>
        {renderTable()}
      </Card>

      {/* Pagination */}
      {totalCount > pageSize && (
        <Pagination
          totalItems={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50, 100]}
          variant='ethiopianGreen'
          darkMode={false}
          className='mt-4'
        />
      )}

      {/* Change Status Modal */}
      <Dialog
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false)
          setSelectedListing(null)
          setNewStatus('')
        }}
        title='Change Listing Status'
        description={`Change status for ${
          selectedListing?.product_name || 'listing'
        }`}
        variant='gondarBlue'
        size='sm'
        showConfirm
        showCancel
        confirmText='Update Status'
        cancelText='Cancel'
        onConfirm={handleUpdateStatus}
        onCancel={() => {
          setIsStatusModalOpen(false)
          setSelectedListing(null)
          setNewStatus('')
        }}
        loading={isSubmitting}
        darkMode={false}
      >
        <div className='space-y-4'>
          <div className='flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl'>
            <Package className='w-5 h-5 text-primary-500' />
            <div>
              <p className='font-medium text-gray-900 dark:text-white'>
                {selectedListing?.product_name}
              </p>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                {formatCurrency(selectedListing?.unit_price)} •{' '}
                {formatNumber(selectedListing?.quantity_quintals)} q
              </p>
            </div>
          </div>

          <Select
            label='New Status'
            value={newStatus}
            onChange={e => setNewStatus(e.target.value)}
            options={statusChangeOptions}
            placeholder='Select status'
            variant='gondarBlue'
            darkMode={false}
          />
        </div>
      </Dialog>

      {/* Delete Modal */}
      <Dialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setListingToDelete(null)
        }}
        title='Delete Listing'
        description='Are you sure you want to delete this listing? This action is permanent and cannot be undone. All associated offers will also be removed.'
        variant='ethiopianRed'
        size='sm'
        showConfirm
        showCancel
        confirmText='Yes, Delete Listing'
        cancelText='Cancel'
        onConfirm={handleDeleteListing}
        onCancel={() => {
          setIsDeleteModalOpen(false)
          setListingToDelete(null)
        }}
        loading={isSubmitting}
        darkMode={false}
      />
    </div>
  )
}

export default AdminListings
