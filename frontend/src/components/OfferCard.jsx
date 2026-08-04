// frontend/src/components/OfferCard.jsx
import React, { useState } from 'react'
import {
  Package,
  User,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  MessageSquare,
  TrendingUp,
  Building2,
  Phone
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import Card from './ui/Card.jsx'
import Button from './ui/Button.jsx'
import Badge from './ui/Badge.jsx'
import StatusBadge from './StatusBadge.jsx'
import Avatar from './ui/Avatar.jsx'
import {
  formatCurrency,
  formatDate,
  formatTimeAgo,
  formatNumber
} from '../utils/formatters.js'
import Dialog from './ui/Dialog.jsx'
import Input from './ui/Input.jsx'

const OfferCard = ({
  offer,
  listing = null,
  variant = 'ethiopianGreen',
  size = 'md',
  showActions = true,
  onAccept,
  onReject,
  onCounter,
  onWithdraw,
  onViewListing,
  onViewBuyer,
  darkMode = false,
  animated = true,
  className = '',
  ...props
}) => {
  const { user, profile, isAdmin, isManager, isBuyer } = useAuth()
  const { success, error } = useToast()
  const [isCounterDialogOpen, setIsCounterDialogOpen] = useState(false)
  const [counterPrice, setCounterPrice] = useState(offer?.offered_price || 0)
  const [counterMessage, setCounterMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!offer) return null

  // =============================================
  // EXTRACT DATA
  // =============================================
  const {
    id,
    listing_id,
    buyer_id,
    offered_price,
    quantity_quintals,
    counter_price,
    message,
    counter_message,
    status,
    rejection_reason,
    created_at,
    updated_at
  } = offer

  // Get listing data (either from prop or from offer object)
  const listingData = listing || offer.listing || {}
  const productName = listingData.product_name || 'Unknown Product'
  const listingQuantity = listingData.quantity_quintals || 0
  const listingPrice = listingData.unit_price || 0
  const listingStatus = listingData.status || 'active'

  // Get buyer data
  const buyerData = offer.buyer || {}
  const buyerName = buyerData.full_name || 'Unknown Buyer'
  const buyerPhone = buyerData.phone || null
  const buyerOrganization = buyerData.organization_name || null

  // Determine if user can take actions
  const isOfferOwner = buyer_id === user?.id
  const isListingManager = listingData.manager_id === user?.id
  const canAccept = (isListingManager || isAdmin()) && status === 'pending'
  const canReject =
    (isListingManager || isAdmin()) &&
    (status === 'pending' || status === 'countered')
  const canCounter = (isListingManager || isAdmin()) && status === 'pending'
  const canWithdraw =
    (isOfferOwner || isAdmin()) &&
    (status === 'pending' || status === 'countered')
  const canViewListing = !!listing_id
  const canViewBuyer = !!buyer_id

  // =============================================
  // STATUS CONFIG
  // =============================================
  const statusColors = {
    pending:
      'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
    accepted:
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    rejected:
      'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    countered:
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    withdrawn:
      'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800'
  }

  // =============================================
  // SIZE CLASSES
  // =============================================
  const sizeClasses = {
    sm: {
      card: 'p-3',
      title: 'text-sm',
      text: 'text-xs',
      price: 'text-base',
      icon: 'w-3 h-3'
    },
    md: {
      card: 'p-4',
      title: 'text-base',
      text: 'text-sm',
      price: 'text-lg',
      icon: 'w-4 h-4'
    },
    lg: {
      card: 'p-5',
      title: 'text-lg',
      text: 'text-base',
      price: 'text-xl',
      icon: 'w-5 h-5'
    }
  }

  const sizeConfig = sizeClasses[size] || sizeClasses.md

  // =============================================
  // HANDLE ACTIONS
  // =============================================
  const handleAccept = async () => {
    setIsLoading(true)
    if (onAccept) {
      await onAccept(id)
    }
    setIsLoading(false)
  }

  const handleReject = async () => {
    setIsLoading(true)
    if (onReject) {
      await onReject(id)
    }
    setIsLoading(false)
  }

  const handleCounter = async () => {
    if (counterPrice <= 0) {
      error('Please enter a valid counter price')
      return
    }
    setIsLoading(true)
    if (onCounter) {
      await onCounter(id, counterPrice, counterMessage)
    }
    setIsCounterDialogOpen(false)
    setIsLoading(false)
  }

  const handleWithdraw = async () => {
    setIsLoading(true)
    if (onWithdraw) {
      await onWithdraw(id)
    }
    setIsLoading(false)
  }

  const handleViewListing = () => {
    if (onViewListing) onViewListing(listing_id)
  }

  const handleViewBuyer = () => {
    if (onViewBuyer) onViewBuyer(buyer_id)
  }

  // =============================================
  // RENDER STATUS
  // =============================================
  const renderStatus = () => {
    const statusClass = statusColors[status] || statusColors.pending
    return (
      <div
        className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusClass}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
        {rejection_reason && status === 'rejected' && (
          <span className='block text-[10px] opacity-70 mt-0.5'>
            Reason: {rejection_reason}
          </span>
        )}
      </div>
    )
  }

  // =============================================
  // RENDER PRICE
  // =============================================
  const renderPrice = () => {
    const displayPrice = counter_price || offered_price
    const isCountered = !!counter_price

    return (
      <div className='flex items-end gap-1'>
        <span
          className={`font-bold ${sizeConfig.price} text-primary-600 dark:text-primary-400`}
        >
          {formatCurrency(displayPrice)}
        </span>
        <span className='text-sm text-gray-500 dark:text-gray-400'>/q</span>
        {isCountered && (
          <Badge variant='gondarBlue' size='sm' className='ml-2'>
            Countered
          </Badge>
        )}
      </div>
    )
  }

  // =============================================
  // RENDER COUNTER OFFER DIALOG
  // =============================================
  const renderCounterDialog = () => (
    <Dialog
      isOpen={isCounterDialogOpen}
      onClose={() => setIsCounterDialogOpen(false)}
      title='Counter Offer'
      description={`Set your counter price for ${productName}`}
      variant='gondarBlue'
      size='sm'
      showConfirm
      showCancel
      confirmText='Send Counter Offer'
      cancelText='Cancel'
      onConfirm={handleCounter}
      loading={isLoading}
      darkMode={darkMode}
    >
      <div className='space-y-4'>
        <Input
          label='Counter Price (Birr per quintal)'
          type='number'
          value={counterPrice}
          onChange={e => setCounterPrice(parseFloat(e.target.value) || 0)}
          min={1}
          step={0.5}
          required
          variant={variant}
          darkMode={darkMode}
        />
        <Input
          label='Message (Optional)'
          type='text'
          value={counterMessage}
          onChange={e => setCounterMessage(e.target.value)}
          placeholder='Add a message to the buyer...'
          variant={variant}
          darkMode={darkMode}
        />
        <div className='text-sm text-gray-500 dark:text-gray-400'>
          Original offer: {formatCurrency(offered_price)} per quintal
        </div>
      </div>
    </Dialog>
  )

  // =============================================
  // RENDER ACTION BUTTONS
  // =============================================
  const renderActions = () => {
    if (!showActions) return null

    return (
      <div className='flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700'>
        {canAccept && (
          <Button
            variant='success'
            size='sm'
            onClick={handleAccept}
            isLoading={isLoading}
            leftIcon={<CheckCircle className='w-3.5 h-3.5' />}
            animated
          >
            Accept
          </Button>
        )}

        {canReject && (
          <Button
            variant='danger'
            size='sm'
            onClick={handleReject}
            isLoading={isLoading}
            leftIcon={<XCircle className='w-3.5 h-3.5' />}
            animated
          >
            Reject
          </Button>
        )}

        {canCounter && (
          <Button
            variant='gondarBlue'
            size='sm'
            onClick={() => setIsCounterDialogOpen(true)}
            isLoading={isLoading}
            leftIcon={<AlertCircle className='w-3.5 h-3.5' />}
            animated
          >
            Counter
          </Button>
        )}

        {canWithdraw && (
          <Button
            variant='axumDark'
            size='sm'
            onClick={handleWithdraw}
            isLoading={isLoading}
            leftIcon={<Clock className='w-3.5 h-3.5' />}
            animated
          >
            Withdraw
          </Button>
        )}

        {canViewListing && (
          <Button
            variant='outline'
            size='sm'
            onClick={handleViewListing}
            rightIcon={<ArrowRight className='w-3.5 h-3.5' />}
            animated
          >
            View Listing
          </Button>
        )}

        {canViewBuyer && (
          <Button
            variant='outline'
            size='sm'
            onClick={handleViewBuyer}
            rightIcon={<User className='w-3.5 h-3.5' />}
            animated
          >
            View Buyer
          </Button>
        )}
      </div>
    )
  }

  // =============================================
  // CARD CLASSES
  // =============================================
  const cardClasses = `
    ${sizeConfig.card}
    ${
      animated
        ? 'transition-all duration-300 hover:scale-[1.01] hover:shadow-lg'
        : ''
    }
    ${className}
  `.trim()

  // =============================================
  // MAIN RENDER
  // =============================================
  return (
    <>
      <Card
        variant={variant}
        className={cardClasses}
        darkMode={darkMode}
        hoverEffect='glow'
        {...props}
      >
        {/* Header */}
        <div className='flex items-start justify-between gap-4'>
          <div className='flex items-center gap-3 min-w-0'>
            <div
              className={`
              w-10 h-10 rounded-xl bg-gradient-to-r from-primary-500/20 to-primary-600/20 flex items-center justify-center flex-shrink-0
            `}
            >
              <Package className='w-5 h-5 text-primary-600 dark:text-primary-400' />
            </div>
            <div className='min-w-0'>
              <h4
                className={`font-bold ${sizeConfig.title} text-gray-900 dark:text-white truncate`}
              >
                {productName}
              </h4>
              <div className='flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400'>
                <span className='flex items-center gap-1'>
                  <Calendar className='w-3 h-3' />
                  {formatTimeAgo(created_at)}
                </span>
                <span className='flex items-center gap-1'>
                  <Clock className='w-3 h-3' />
                  {status}
                </span>
              </div>
            </div>
          </div>
          {renderStatus()}
        </div>

        {/* Body */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3'>
          <div className='flex flex-col'>
            <span className='text-xs text-gray-500 dark:text-gray-400'>
              Price
            </span>
            {renderPrice()}
          </div>
          <div className='flex flex-col'>
            <span className='text-xs text-gray-500 dark:text-gray-400'>
              Quantity
            </span>
            <span
              className={`font-semibold ${sizeConfig.text} text-gray-900 dark:text-white`}
            >
              {formatNumber(quantity_quintals || listingQuantity)} q
            </span>
          </div>
          <div className='flex flex-col col-span-2'>
            <span className='text-xs text-gray-500 dark:text-gray-400'>
              Buyer
            </span>
            <div className='flex items-center gap-2'>
              <Avatar
                size='xs'
                name={buyerName}
                variant={variant}
                darkMode={darkMode}
              />
              <span
                className={`font-medium ${sizeConfig.text} text-gray-900 dark:text-white truncate`}
              >
                {buyerName}
              </span>
              {buyerOrganization && (
                <span className='text-xs text-gray-400 dark:text-gray-500 truncate'>
                  ({buyerOrganization})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        {(message || counter_message) && (
          <div className='mt-3 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl'>
            {message && (
              <div className='flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300'>
                <MessageSquare className='w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5' />
                <span>{message}</span>
              </div>
            )}
            {counter_message && (
              <div className='flex items-start gap-2 mt-1 text-sm text-blue-600 dark:text-blue-400'>
                <ArrowRight className='w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5' />
                <span>Counter: {counter_message}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {renderActions()}
      </Card>

      {/* Counter Dialog */}
      {renderCounterDialog()}
    </>
  )
}

OfferCard.displayName = 'OfferCard'

export default OfferCard
