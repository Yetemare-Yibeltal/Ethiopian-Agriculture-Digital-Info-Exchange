// frontend/src/pages/MyOffers.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingBag,
  Plus,
  Search as SearchIcon,
  Filter,
  X,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowUpDown,
  Download,
  RefreshCw,
  MoreVertical,
  User,
  Package,
  DollarSign,
  Calendar,
  TrendingUp,
  Check,
  Minus,
  Send,
  MessageSquare
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { offerService } from '../services/offerService.js'
import { listingService } from '../services/listingService.js'
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
  formatOfferStatus
} from '../utils/formatters.js'
import { OFFER_STATUS, OFFER_STATUS_LABELS } from '../utils/constants.js'

const MyOffers = () => {
  const navigate = useNavigate()
  const { user, profile, isAdmin, isManager, isBuyer } = useAuth()
  const { success, error } = useToast()

  // =============================================
  // STATE
  // =============================================
  const [offers, setOffers] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortField, setSortField] = useState('created_at')
  const [sortDirection, setSortDirection] = useState('desc')
  const [selectedOffers, setSelectedOffers] = useState([])
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [offerToWithdraw, setOfferToWithdraw] = useState(null)
  const [isBulkWithdrawModalOpen, setIsBulkWithdrawModalOpen] = useState(false)
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false)
  const [counterData, setCounterData] = useState({
    offerId: null,
    price: '',
    message: ''
  })
  const [viewMode, setViewMode] = useState('list') // 'grid' or 'list'
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    countered: 0,
    withdrawn: 0
  })
  const [isExporting, setIsExporting] = useState(false)

  const abortControllerRef = useRef(null)
  const searchTimeoutRef = useRef(null)

  // =============================================
  // STATUS OPTIONS
  // =============================================
  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Countered', value: 'countered' },
    { label: 'Withdrawn', value: 'withdrawn' }
  ]

  // =============================================
  // FETCH OFFERS
  // =============================================
  const fetchOffers = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      const result = await offerService.getMyOffers({
        page: currentPage,
        limit: pageSize,
        status: statusFilter || null,
        search: searchQuery || null
      })

      if (result.success) {
        setOffers(result.data || [])
        setTotalCount(result.count || 0)
      } else {
        error(result.error || 'Failed to load offers')
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Fetch offers error:', err)
        error('Failed to load offers')
      }
    } finally {
      setIsLoading(false)
    }
  }, [user, currentPage, pageSize, statusFilter, searchQuery, error])

  // =============================================
  // FETCH STATS
  // =============================================
  const fetchStats = useCallback(async () => {
    if (!user?.id) return

    try {
      const result = await offerService.getOfferStats()
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
    fetchOffers()
    fetchStats()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [fetchOffers, fetchStats])

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
      fetchOffers()
    }, 400)
  }

  // =============================================
  // HANDLE STATUS FILTER CHANGE
  // =============================================
  const handleStatusFilterChange = e => {
    setStatusFilter(e.target.value)
    setCurrentPage(1)
    fetchOffers()
  }

  // =============================================
  // HANDLE SELECT OFFER
  // =============================================
  const toggleSelectOffer = offerId => {
    setSelectedOffers(prev =>
      prev.includes(offerId)
        ? prev.filter(id => id !== offerId)
        : [...prev, offerId]
    )
  }

  // =============================================
  // HANDLE SELECT ALL
  // =============================================
  const handleSelectAll = () => {
    if (selectedOffers.length === offers.length) {
      setSelectedOffers([])
    } else {
      setSelectedOffers(offers.map(o => o.id))
    }
  }

  // =============================================
  // HANDLE WITHDRAW OFFER
  // =============================================
  const handleWithdrawOffer = async () => {
    if (!offerToWithdraw) return

    try {
      const result = await offerService.withdrawOffer(offerToWithdraw)
      if (result.success) {
        success('Offer withdrawn successfully')
        setOfferToWithdraw(null)
        setIsWithdrawModalOpen(false)
        fetchOffers()
        fetchStats()
      } else {
        error(result.error || 'Failed to withdraw offer')
      }
    } catch (err) {
      console.error('Withdraw error:', err)
      error('Failed to withdraw offer')
    }
  }

  // =============================================
  // HANDLE BULK WITHDRAW
  // =============================================
  const handleBulkWithdraw = async () => {
    if (selectedOffers.length === 0) return

    try {
      let successCount = 0
      let failCount = 0

      for (const id of selectedOffers) {
        const result = await offerService.withdrawOffer(id)
        if (result.success) {
          successCount++
        } else {
          failCount++
        }
      }

      if (successCount > 0) {
        success(`${successCount} offer(s) withdrawn successfully`)
      }
      if (failCount > 0) {
        error(`${failCount} offer(s) failed to withdraw`)
      }

      setSelectedOffers([])
      setIsBulkWithdrawModalOpen(false)
      fetchOffers()
      fetchStats()
    } catch (err) {
      console.error('Bulk withdraw error:', err)
      error('Failed to withdraw offers')
    }
  }

  // =============================================
  // HANDLE COUNTER OFFER
  // =============================================
  const handleCounterOffer = async () => {
    if (!counterData.offerId || !counterData.price) return

    try {
      const result = await offerService.counterOffer(
        counterData.offerId,
        parseFloat(counterData.price),
        counterData.message || null
      )

      if (result.success) {
        success('Counter offer sent successfully')
        setIsCounterModalOpen(false)
        setCounterData({ offerId: null, price: '', message: '' })
        fetchOffers()
        fetchStats()
      } else {
        error(result.error || 'Failed to send counter offer')
      }
    } catch (err) {
      console.error('Counter offer error:', err)
      error('Failed to send counter offer')
    }
  }

  // =============================================
  // HANDLE EXPORT CSV
  // =============================================
  const handleExportCSV = () => {
    setIsExporting(true)

    try {
      const headers = [
        'Product',
        'Offered Price (Br)',
        'Quantity (q)',
        'Status',
        'Buyer',
        'Created At'
      ]

      const rows = offers.map(o => [
        o.listing?.product_name || 'Unknown',
        o.offered_price,
        o.quantity_quintals || 0,
        formatOfferStatus(o.status),
        o.buyer?.full_name || 'Unknown',
        formatDate(o.created_at, 'short')
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `my-offers-${formatDate(new Date(), 'short')}.csv`
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
      icon: <ShoppingBag className='w-4 h-4' />,
      color: 'text-gray-500',
      bg: 'bg-gray-50 dark:bg-gray-800/50'
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: <Clock className='w-4 h-4' />,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
      label: 'Accepted',
      value: stats.accepted,
      icon: <CheckCircle className='w-4 h-4' />,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      label: 'Rejected',
      value: stats.rejected,
      icon: <XCircle className='w-4 h-4' />,
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      label: 'Countered',
      value: stats.countered,
      icon: <MessageSquare className='w-4 h-4' />,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20'
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
  // RENDER TOOLBAR
  // =============================================
  const renderToolbar = () => {
    const isBuyerRole = isBuyer() || isAdmin()

    return (
      <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3'>
        {/* Search */}
        <div className='flex-1 w-full sm:w-auto'>
          <Input
            placeholder='Search by product or buyer...'
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

        {/* New Offer Button (Buyers) */}
        {isBuyerRole && (
          <Button
            variant='ethiopianGreen'
            size='sm'
            onClick={() => navigate('/search')}
            leftIcon={<Plus className='w-3.5 h-3.5' />}
          >
            Make New Offer
          </Button>
        )}
      </div>
    )
  }

  // =============================================
  // RENDER SELECTION ACTIONS
  // =============================================
  const renderSelectionActions = () => {
    if (selectedOffers.length === 0) return null

    const isBuyerRole = isBuyer() || isAdmin()

    return (
      <div className='flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800'>
        <span className='text-sm font-medium text-primary-700 dark:text-primary-300'>
          {selectedOffers.length} selected
        </span>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setSelectedOffers([])}
          leftIcon={<X className='w-3.5 h-3.5' />}
        >
          Clear
        </Button>
        {isBuyerRole && (
          <Button
            variant='danger'
            size='sm'
            onClick={() => setIsBulkWithdrawModalOpen(true)}
            leftIcon={<XCircle className='w-3.5 h-3.5' />}
          >
            Withdraw Selected
          </Button>
        )}
      </div>
    )
  }

  // =============================================
  // RENDER OFFER CARD (Grid View)
  // =============================================
  const renderOfferCard = offer => {
    const isSelected = selectedOffers.includes(offer.id)
    const isBuyerRole = isBuyer() || isAdmin()
    const isManagerRole = isManager() || isAdmin()
    const isOwner = offer.buyer_id === user?.id
    const canWithdraw =
      (isOwner || isBuyerRole) &&
      (offer.status === 'pending' || offer.status === 'countered')
    const canCounter =
      (isManagerRole || offer.listing?.manager_id === user?.id) &&
      offer.status === 'pending'
    const canAccept =
      (isManagerRole || offer.listing?.manager_id === user?.id) &&
      offer.status === 'pending'
    const canReject =
      (isManagerRole || offer.listing?.manager_id === user?.id) &&
      (offer.status === 'pending' || offer.status === 'countered')

    return (
      <Card
        key={offer.id}
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
              onChange={() => toggleSelectOffer(offer.id)}
              className='w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 flex-shrink-0 mt-1'
              onClick={e => e.stopPropagation()}
            />
            <div
              className='w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0 cursor-pointer'
              onClick={() => navigate(`/listings/${offer.listing_id}`)}
            >
              <Package className='w-5 h-5 text-primary-600' />
            </div>
            <div
              className='min-w-0 cursor-pointer'
              onClick={() => navigate(`/listings/${offer.listing_id}`)}
            >
              <p className='font-medium text-gray-900 dark:text-white truncate'>
                {offer.listing?.product_name || 'Unknown Product'}
              </p>
              <div className='flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
                <span>{formatCurrency(offer.offered_price)}/q</span>
                <span>•</span>
                <span>{formatNumber(offer.quantity_quintals)} q</span>
                {offer.counter_price && (
                  <>
                    <span>•</span>
                    <span className='text-primary-600 font-medium'>
                      Counter: {formatCurrency(offer.counter_price)}
                    </span>
                  </>
                )}
                <span>•</span>
                <StatusBadge status={offer.status} size='xs' />
              </div>
              <div className='flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mt-0.5'>
                <User className='w-3 h-3' />
                {offer.buyer?.full_name || 'Unknown Buyer'}
                <span>•</span>
                <Clock className='w-3 h-3' />
                {formatTimeAgo(offer.created_at)}
              </div>
            </div>
          </div>
          <div className='flex items-center gap-1 flex-shrink-0'>
            <Button
              variant='ghost'
              size='sm'
              className='!p-1.5'
              onClick={() => navigate(`/listings/${offer.listing_id}`)}
            >
              <Eye className='w-3.5 h-3.5' />
            </Button>
            {canWithdraw && (
              <Button
                variant='ghost'
                size='sm'
                className='!p-1.5 text-red-500 hover:text-red-600'
                onClick={() => {
                  setOfferToWithdraw(offer.id)
                  setIsWithdrawModalOpen(true)
                }}
              >
                <XCircle className='w-3.5 h-3.5' />
              </Button>
            )}
            {canCounter && (
              <Button
                variant='ghost'
                size='sm'
                className='!p-1.5 text-blue-500 hover:text-blue-600'
                onClick={() => {
                  setCounterData({
                    offerId: offer.id,
                    price: offer.offered_price.toString(),
                    message: ''
                  })
                  setIsCounterModalOpen(true)
                }}
              >
                <MessageSquare className='w-3.5 h-3.5' />
              </Button>
            )}
            {canAccept && (
              <Button
                variant='ghost'
                size='sm'
                className='!p-1.5 text-emerald-500 hover:text-emerald-600'
                onClick={async () => {
                  try {
                    const result = await offerService.acceptOffer(offer.id)
                    if (result.success) {
                      success('Offer accepted successfully')
                      fetchOffers()
                      fetchStats()
                    } else {
                      error(result.error || 'Failed to accept offer')
                    }
                  } catch (err) {
                    console.error('Accept error:', err)
                    error('Failed to accept offer')
                  }
                }}
              >
                <CheckCircle className='w-3.5 h-3.5' />
              </Button>
            )}
            {canReject && (
              <Button
                variant='ghost'
                size='sm'
                className='!p-1.5 text-red-500 hover:text-red-600'
                onClick={async () => {
                  if (
                    window.confirm(
                      'Are you sure you want to reject this offer?'
                    )
                  ) {
                    try {
                      const result = await offerService.rejectOffer(offer.id)
                      if (result.success) {
                        success('Offer rejected successfully')
                        fetchOffers()
                        fetchStats()
                      } else {
                        error(result.error || 'Failed to reject offer')
                      }
                    } catch (err) {
                      console.error('Reject error:', err)
                      error('Failed to reject offer')
                    }
                  }
                }}
              >
                <XCircle className='w-3.5 h-3.5' />
              </Button>
            )}
          </div>
        </div>

        {offer.message && (
          <div className='mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg'>
            💬 {offer.message}
          </div>
        )}
        {offer.counter_message && (
          <div className='mt-1 text-xs text-primary-600 dark:text-primary-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg'>
            🔄 Counter: {offer.counter_message}
          </div>
        )}
      </Card>
    )
  }

  // =============================================
  // RENDER OFFER ROW (List View)
  // =============================================
  const renderOfferRow = offer => {
    const isSelected = selectedOffers.includes(offer.id)
    const isBuyerRole = isBuyer() || isAdmin()
    const isManagerRole = isManager() || isAdmin()
    const isOwner = offer.buyer_id === user?.id
    const canWithdraw =
      (isOwner || isBuyerRole) &&
      (offer.status === 'pending' || offer.status === 'countered')

    return (
      <div
        key={offer.id}
        className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:shadow-md ${
          isSelected
            ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        <input
          type='checkbox'
          checked={isSelected}
          onChange={() => toggleSelectOffer(offer.id)}
          className='w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 flex-shrink-0'
          onClick={e => e.stopPropagation()}
        />

        <div
          className='flex-1 min-w-0 cursor-pointer'
          onClick={() => navigate(`/listings/${offer.listing_id}`)}
        >
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0'>
              <ShoppingBag className='w-4 h-4 text-primary-600' />
            </div>
            <div className='min-w-0'>
              <p className='font-medium text-gray-900 dark:text-white text-sm truncate'>
                {offer.listing?.product_name || 'Unknown Product'}
              </p>
              <div className='flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
                <span className='font-medium text-primary-600'>
                  {formatCurrency(offer.offered_price)}/q
                </span>
                <span>•</span>
                <span>{formatNumber(offer.quantity_quintals)} q</span>
                {offer.counter_price && (
                  <>
                    <span>•</span>
                    <span className='text-blue-500 font-medium'>
                      Counter: {formatCurrency(offer.counter_price)}
                    </span>
                  </>
                )}
                <span>•</span>
                <StatusBadge status={offer.status} size='xs' />
                <span>•</span>
                <User className='w-3 h-3 inline' />
                {offer.buyer?.full_name || 'Unknown'}
                <span>•</span>
                {formatTimeAgo(offer.created_at)}
              </div>
            </div>
          </div>
        </div>

        <div className='flex items-center gap-1 flex-shrink-0'>
          <Button
            variant='ghost'
            size='sm'
            className='!p-1.5'
            onClick={() => navigate(`/listings/${offer.listing_id}`)}
          >
            <Eye className='w-3.5 h-3.5' />
          </Button>
          {canWithdraw && (
            <Button
              variant='ghost'
              size='sm'
              className='!p-1.5 text-red-500 hover:text-red-600'
              onClick={() => {
                setOfferToWithdraw(offer.id)
                setIsWithdrawModalOpen(true)
              }}
            >
              <XCircle className='w-3.5 h-3.5' />
            </Button>
          )}
        </div>
      </div>
    )
  }

  // =============================================
  // LOADING STATE
  // =============================================
  if (isLoading && offers.length === 0) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <LoadingSpinner
          variant='ethiopianFlag'
          size='lg'
          label='Loading offers...'
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
            💬 My Offers
          </h1>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            Track and manage all your offers in one place
          </p>
        </div>
        <Badge variant='ethiopianGreen' size='sm'>
          {formatNumber(totalCount)} offers
        </Badge>
      </div>

      {/* Stats */}
      {renderStats()}

      {/* Toolbar */}
      {renderToolbar()}

      {/* Selection Actions */}
      {renderSelectionActions()}

      {/* Offers */}
      {offers.length === 0 ? (
        <Card variant='axumDark' className='p-8 text-center'>
          <div className='flex flex-col items-center gap-3'>
            <ShoppingBag className='w-16 h-16 text-gray-300 dark:text-gray-600' />
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
              No offers found
            </h3>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              {searchQuery || statusFilter
                ? 'Try adjusting your search or filters'
                : isBuyer()
                ? 'Start making offers on products you want to buy'
                : 'No offers on your listings yet'}
            </p>
            {isBuyer() && !searchQuery && !statusFilter && (
              <Button
                variant='ethiopianGreen'
                onClick={() => navigate('/search')}
                leftIcon={<SearchIcon className='w-4 h-4' />}
              >
                Find Products
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <>
          {/* Offers Grid/List */}
          {viewMode === 'grid' ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {offers.map(renderOfferCard)}
            </div>
          ) : (
            <div className='space-y-2'>{offers.map(renderOfferRow)}</div>
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

      {/* Withdraw Confirmation Modal */}
      <Dialog
        isOpen={isWithdrawModalOpen}
        onClose={() => {
          setIsWithdrawModalOpen(false)
          setOfferToWithdraw(null)
        }}
        title='Withdraw Offer'
        description='Are you sure you want to withdraw this offer? This action cannot be undone.'
        variant='ethiopianRed'
        size='sm'
        showConfirm
        showCancel
        confirmText='Yes, Withdraw'
        cancelText='Cancel'
        onConfirm={handleWithdrawOffer}
        onCancel={() => {
          setIsWithdrawModalOpen(false)
          setOfferToWithdraw(null)
        }}
        darkMode={false}
      />

      {/* Bulk Withdraw Confirmation Modal */}
      <Dialog
        isOpen={isBulkWithdrawModalOpen}
        onClose={() => setIsBulkWithdrawModalOpen(false)}
        title='Withdraw Selected Offers'
        description={`Are you sure you want to withdraw ${selectedOffers.length} selected offer(s)? This action cannot be undone.`}
        variant='ethiopianRed'
        size='sm'
        showConfirm
        showCancel
        confirmText='Yes, Withdraw All'
        cancelText='Cancel'
        onConfirm={handleBulkWithdraw}
        onCancel={() => setIsBulkWithdrawModalOpen(false)}
        darkMode={false}
      />

      {/* Counter Offer Modal */}
      <Dialog
        isOpen={isCounterModalOpen}
        onClose={() => {
          setIsCounterModalOpen(false)
          setCounterData({ offerId: null, price: '', message: '' })
        }}
        title='Counter Offer'
        description='Enter your counter offer details'
        variant='gondarBlue'
        size='sm'
        showConfirm
        showCancel
        confirmText='Send Counter Offer'
        cancelText='Cancel'
        onConfirm={handleCounterOffer}
        onCancel={() => {
          setIsCounterModalOpen(false)
          setCounterData({ offerId: null, price: '', message: '' })
        }}
        darkMode={false}
      >
        <div className='space-y-4'>
          <Input
            label='Counter Price (Birr per quintal)'
            type='number'
            value={counterData.price}
            onChange={e =>
              setCounterData({ ...counterData, price: e.target.value })
            }
            placeholder='Enter counter price'
            min='1'
            step='0.5'
            required
            variant='gondarBlue'
            darkMode={false}
          />
          <Input
            label='Message (Optional)'
            value={counterData.message}
            onChange={e =>
              setCounterData({ ...counterData, message: e.target.value })
            }
            placeholder='Add a message to the buyer...'
            variant='gondarBlue'
            darkMode={false}
          />
        </div>
      </Dialog>
    </div>
  )
}

export default MyOffers
