// frontend/src/pages/ListingDetail.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Package,
  MapPin,
  User,
  Calendar,
  Clock,
  DollarSign,
  Weight,
  Eye,
  Heart,
  Share2,
  ArrowLeft,
  ArrowRight,
  Users,
  Phone,
  Mail,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Minus,
  ShoppingBag,
  Send,
  MessageSquare,
  Trash2,
  Edit,
  MoreVertical,
  Copy,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  X,
  Star,
  TrendingUp,
  Award,
  Shield,
  Crown
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { useLocation } from '../hooks/useLocation.js'
import { listingService } from '../services/listingService.js'
import { offerService } from '../services/offerService.js'
import { farmerService } from '../services/farmerService.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import Map from '../components/Map.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import Dialog from '../components/ui/Dialog.jsx'
import Input from '../components/ui/Input.jsx'
import Textarea from '../components/ui/Textarea.jsx'
import {
  formatCurrency,
  formatDate,
  formatTimeAgo,
  formatNumber,
  formatDistance,
  formatListingStatus
} from '../utils/formatters.js'
import { validatePrice, validateQuantity } from '../utils/validators.js'
import { SHELF_LIFE_DAYS } from '../utils/constants.js'

const ListingDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile, isAdmin, isManager, isBuyer } = useAuth()
  const { success, error } = useToast()
  const { location: userLocation } = useLocation()

  // =============================================
  // STATE
  // =============================================
  const [listing, setListing] = useState(null)
  const [farmers, setFarmers] = useState([])
  const [offers, setOffers] = useState([])
  const [relatedListings, setRelatedListings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [offerData, setOfferData] = useState({
    offered_price: '',
    quantity_quintals: '',
    message: ''
  })
  const [offerErrors, setOfferErrors] = useState({})
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false)
  const [isManaging, setIsManaging] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isOfferActionLoading, setIsOfferActionLoading] = useState(false)
  const [confirmModalProps, setConfirmModalProps] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    variant: 'ethiopianRed',
    confirmText: 'Confirm'
  })

  const abortControllerRef = useRef(null)

  // =============================================
  // FETCH LISTING DATA
  // =============================================
  const fetchListingData = useCallback(async () => {
    if (!id) return

    setIsLoading(true)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      // Fetch listing details
      const listingResult = await listingService.getListingById(id)
      if (!listingResult.success || !listingResult.data) {
        error('Listing not found')
        navigate('/search')
        return
      }

      const listingData = listingResult.data
      setListing(listingData)

      // Check if user has favorited this listing
      // (would come from a favorites service - simplified here)
      setIsFavorite(false)

      // Fetch farmers if farmer_ids exist
      if (listingData.farmer_ids && listingData.farmer_ids.length > 0) {
        const farmerPromises = listingData.farmer_ids.map(fid =>
          farmerService.getFarmerById(fid)
        )
        const farmerResults = await Promise.all(farmerPromises)
        const farmerData = farmerResults
          .filter(r => r.success && r.data)
          .map(r => r.data)
        setFarmers(farmerData)
      }

      // Fetch offers for this listing (if manager or admin)
      const userRole = profile?.role
      if (
        userRole === 'manager' ||
        userRole === 'admin' ||
        listingData.manager_id === user?.id
      ) {
        const offersResult = await offerService.getOffersByListing(id, {
          limit: 100
        })
        if (offersResult.success) {
          setOffers(offersResult.data || [])
        }
      } else if (userRole === 'buyer') {
        // Buyers can see their own offers on this listing
        const myOffersResult = await offerService.getMyOffers({
          listing_id: id,
          limit: 100
        })
        if (myOffersResult.success) {
          setOffers(myOffersResult.data || [])
        }
      }

      // Fetch related listings (same category or product)
      if (listingData.product_name) {
        const relatedResult = await listingService.getListings({
          product_name: listingData.product_name,
          limit: 4
        })
        if (relatedResult.success) {
          setRelatedListings(
            (relatedResult.data || []).filter(l => l.id !== id).slice(0, 4)
          )
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to fetch listing:', err)
        error('Failed to load listing details')
      }
    } finally {
      setIsLoading(false)
    }
  }, [id, profile?.role, user?.id, navigate, error])

  useEffect(() => {
    fetchListingData()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchListingData])

  // =============================================
  // HANDLE OFFER MODAL
  // =============================================
  const openOfferModal = () => {
    setOfferData({
      offered_price: listing?.unit_price || '',
      quantity_quintals: listing?.quantity_quintals || '',
      message: ''
    })
    setOfferErrors({})
    setIsOfferModalOpen(true)
  }

  const closeOfferModal = () => {
    setIsOfferModalOpen(false)
    setOfferData({
      offered_price: '',
      quantity_quintals: '',
      message: ''
    })
    setOfferErrors({})
  }

  const handleOfferChange = e => {
    const { name, value } = e.target
    setOfferData(prev => ({ ...prev, [name]: value }))
    if (offerErrors[name]) {
      setOfferErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateOffer = () => {
    const errors = {}
    if (!offerData.offered_price || parseFloat(offerData.offered_price) <= 0) {
      errors.offered_price = 'Price must be greater than 0'
    }
    if (
      !offerData.quantity_quintals ||
      parseFloat(offerData.quantity_quintals) <= 0
    ) {
      errors.quantity_quintals = 'Quantity must be greater than 0'
    }
    if (
      listing &&
      parseFloat(offerData.quantity_quintals) > listing.quantity_quintals
    ) {
      errors.quantity_quintals = `Quantity cannot exceed ${listing.quantity_quintals} quintals`
    }
    setOfferErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmitOffer = async () => {
    if (!validateOffer()) return

    setIsSubmittingOffer(true)
    try {
      const result = await offerService.createOffer({
        listing_id: id,
        offered_price: parseFloat(offerData.offered_price),
        quantity_quintals: parseFloat(offerData.quantity_quintals),
        message: offerData.message || null
      })

      if (result.success) {
        success('Offer submitted successfully!')
        closeOfferModal()
        await fetchListingData()
      } else {
        error(result.error || 'Failed to submit offer')
      }
    } catch (err) {
      console.error('Offer submission error:', err)
      error('An unexpected error occurred')
    } finally {
      setIsSubmittingOffer(false)
    }
  }

  // =============================================
  // HANDLE OFFER ACTIONS (Accept/Reject/Counter)
  // =============================================
  const handleOfferAction = async (offerId, action, data = null) => {
    setIsOfferActionLoading(true)
    try {
      let result
      switch (action) {
        case 'accept':
          result = await offerService.acceptOffer(offerId)
          break
        case 'reject':
          result = await offerService.rejectOffer(offerId, data?.reason || null)
          break
        case 'counter':
          result = await offerService.counterOffer(
            offerId,
            data?.counter_price,
            data?.counter_message || null
          )
          break
        default:
          throw new Error('Invalid action')
      }

      if (result.success) {
        success(
          action === 'accept'
            ? 'Offer accepted!'
            : action === 'reject'
            ? 'Offer rejected'
            : 'Counter offer sent'
        )
        await fetchListingData()
      } else {
        error(result.error || `Failed to ${action} offer`)
      }
    } catch (err) {
      console.error(`Offer ${action} error:`, err)
      error(`Failed to ${action} offer`)
    } finally {
      setIsOfferActionLoading(false)
      setIsConfirmModalOpen(false)
      setConfirmAction(null)
    }
  }

  // =============================================
  // HANDLE LISTING ACTIONS (Edit/Delete/Status Change)
  // =============================================
  const handleListingAction = async (action, data = null) => {
    setIsManaging(true)
    try {
      switch (action) {
        case 'edit':
          navigate(`/new-listing/${id}`)
          break
        case 'delete':
          const deleteResult = await listingService.deleteListing(id)
          if (deleteResult.success) {
            success('Listing deleted successfully')
            navigate('/my-listings')
          } else {
            error(deleteResult.error || 'Failed to delete listing')
          }
          break
        case 'status':
          const statusResult = await listingService.updateListingStatus(
            id,
            data?.status
          )
          if (statusResult.success) {
            success(`Listing status updated to ${data?.status}`)
            await fetchListingData()
          } else {
            error(statusResult.error || 'Failed to update status')
          }
          break
        default:
          throw new Error('Invalid action')
      }
    } catch (err) {
      console.error(`Listing ${action} error:`, err)
      error(`Failed to ${action} listing`)
    } finally {
      setIsManaging(false)
      setIsConfirmModalOpen(false)
      setConfirmAction(null)
    }
  }

  // =============================================
  // HANDLE FAVORITE
  // =============================================
  const handleFavorite = () => {
    setIsFavorite(!isFavorite)
    success(isFavorite ? 'Removed from favorites' : 'Added to favorites')
  }

  // =============================================
  // HANDLE SHARE
  // =============================================
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: listing?.product_name || 'Product Listing',
          text: `Check out this ${listing?.product_name} on EADE!`,
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        success('Link copied to clipboard!')
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share error:', err)
      }
    }
  }

  // =============================================
  // IMAGE GALLERY
  // =============================================
  const images = listing?.photos || []
  const hasImages = images.length > 0

  const goToPreviousImage = () => {
    setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNextImage = () => {
    setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const openLightbox = index => {
    setCurrentImageIndex(index)
    setIsLightboxOpen(true)
  }

  const closeLightbox = () => {
    setIsLightboxOpen(false)
  }

  // =============================================
  // HANDLE KEYBOARD NAVIGATION
  // =============================================
  useEffect(() => {
    const handleKeyDown = e => {
      if (isLightboxOpen) {
        if (e.key === 'Escape') closeLightbox()
        if (e.key === 'ArrowLeft') goToPreviousImage()
        if (e.key === 'ArrowRight') goToNextImage()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen])

  // =============================================
  // RENDER IMAGE GALLERY
  // =============================================
  const renderImageGallery = () => {
    if (!hasImages) {
      return (
        <div className='w-full h-80 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center'>
          <div className='text-center'>
            <Package className='w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto' />
            <p className='mt-2 text-gray-400 dark:text-gray-500'>No images</p>
          </div>
        </div>
      )
    }

    return (
      <div className='space-y-3'>
        {/* Main Image */}
        <div
          className='relative w-full h-80 rounded-2xl overflow-hidden cursor-pointer group bg-gray-100 dark:bg-gray-800'
          onClick={() => openLightbox(currentImageIndex)}
        >
          <img
            src={images[currentImageIndex]}
            alt={listing?.product_name || 'Product image'}
            className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
            loading='lazy'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
          <div className='absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity'>
            <ZoomIn className='w-4 h-4 inline mr-1' />
            Click to zoom
          </div>
          {images.length > 1 && (
            <div className='absolute inset-0 flex items-center justify-between px-3 opacity-0 group-hover:opacity-100 transition-opacity'>
              <button
                onClick={e => {
                  e.stopPropagation()
                  goToPreviousImage()
                }}
                className='w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors'
              >
                <ChevronLeft className='w-5 h-5' />
              </button>
              <button
                onClick={e => {
                  e.stopPropagation()
                  goToNextImage()
                }}
                className='w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors'
              >
                <ChevronRight className='w-5 h-5' />
              </button>
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className='flex gap-2 overflow-x-auto pb-2'>
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`
                  flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200
                  ${
                    index === currentImageIndex
                      ? 'border-primary-500 shadow-lg shadow-primary-500/20'
                      : 'border-transparent hover:border-gray-300'
                  }
                `}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  className='w-full h-full object-cover'
                  loading='lazy'
                />
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // =============================================
  // RENDER LIGHTBOX
  // =============================================
  const renderLightbox = () => {
    if (!isLightboxOpen) return null

    return (
      <div
        className='fixed inset-0 z-50 bg-black/95 flex items-center justify-center'
        onClick={closeLightbox}
      >
        <button
          onClick={closeLightbox}
          className='absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10'
        >
          <X className='w-8 h-8' />
        </button>
        <button
          onClick={e => {
            e.stopPropagation()
            goToPreviousImage()
          }}
          className='absolute left-4 text-white/70 hover:text-white transition-colors z-10'
        >
          <ChevronLeft className='w-10 h-10' />
        </button>
        <button
          onClick={e => {
            e.stopPropagation()
            goToNextImage()
          }}
          className='absolute right-4 text-white/70 hover:text-white transition-colors z-10'
        >
          <ChevronRight className='w-10 h-10' />
        </button>
        <img
          src={images[currentImageIndex]}
          alt={listing?.product_name || 'Product image'}
          className='max-h-[90vh] max-w-[90vw] object-contain'
          onClick={e => e.stopPropagation()}
          loading='lazy'
        />
        <div className='absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm'>
          {currentImageIndex + 1} / {images.length}
        </div>
      </div>
    )
  }

  // =============================================
  // RENDER FARMER LIST
  // =============================================
  const renderFarmers = () => {
    if (farmers.length === 0) {
      return (
        <p className='text-sm text-gray-500 dark:text-gray-400'>
          No farmers associated
        </p>
      )
    }

    return (
      <div className='space-y-2'>
        {farmers.map(farmer => (
          <div
            key={farmer.id}
            className='flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50'
          >
            <Avatar
              size='sm'
              name={farmer.full_name}
              variant='ethiopianGreen'
            />
            <div className='flex-1 min-w-0'>
              <p className='font-medium text-gray-900 dark:text-white text-sm'>
                {farmer.full_name}
              </p>
              <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
                <span>{farmer.phone_number}</span>
                {farmer.district && (
                  <>
                    <span>•</span>
                    <span>{farmer.district}</span>
                  </>
                )}
              </div>
            </div>
            <Badge variant='ethiopianGreen' size='xs'>
              Farmer
            </Badge>
          </div>
        ))}
      </div>
    )
  }

  // =============================================
  // RENDER OFFERS
  // =============================================
  const renderOffers = () => {
    const isManagerOrAdmin = isManager() || isAdmin()
    const isOwner = listing?.manager_id === user?.id

    if (offers.length === 0) {
      return (
        <div className='text-center py-6 text-gray-500 dark:text-gray-400'>
          <ShoppingBag className='w-8 h-8 mx-auto mb-2 opacity-20' />
          <p className='text-sm'>No offers yet</p>
          {listing?.status === 'active' && isBuyer() && (
            <Button
              variant='ethiopianGreen'
              size='sm'
              className='mt-2'
              onClick={openOfferModal}
            >
              Make Offer
            </Button>
          )}
        </div>
      )
    }

    return (
      <div className='space-y-3'>
        {offers.map(offer => {
          const buyerName = offer.buyer?.full_name || 'Unknown Buyer'
          const isBuyerOwner = offer.buyer_id === user?.id
          const canAccept =
            (isManagerOrAdmin || isOwner) &&
            offer.status === 'pending' &&
            listing?.status === 'active'
          const canReject =
            (isManagerOrAdmin || isOwner) &&
            (offer.status === 'pending' || offer.status === 'countered')
          const canCounter =
            (isManagerOrAdmin || isOwner) &&
            offer.status === 'pending' &&
            listing?.status === 'active'
          const canWithdraw =
            isBuyerOwner &&
            (offer.status === 'pending' || offer.status === 'countered')

          return (
            <Card
              key={offer.id}
              variant='axumDark'
              className='p-3 hover:shadow-md transition-shadow'
              darkMode={false}
            >
              <div className='flex items-start justify-between gap-3'>
                <div className='flex items-center gap-3 min-w-0'>
                  <Avatar size='sm' name={buyerName} variant='ethiopianGreen' />
                  <div className='min-w-0'>
                    <p className='font-medium text-gray-900 dark:text-white text-sm'>
                      {buyerName}
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
                    {offer.message && (
                      <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1'>
                        💬 {offer.message}
                      </p>
                    )}
                    {offer.counter_message && (
                      <p className='text-xs text-primary-600 dark:text-primary-400 mt-0.5 line-clamp-1'>
                        🔄 Counter: {offer.counter_message}
                      </p>
                    )}
                    <p className='text-xs text-gray-400 dark:text-gray-500 mt-0.5'>
                      {formatTimeAgo(offer.created_at)}
                    </p>
                  </div>
                </div>
                <div className='flex flex-wrap gap-1 flex-shrink-0'>
                  {canAccept && (
                    <Button
                      variant='success'
                      size='xs'
                      onClick={() => {
                        setConfirmModalProps({
                          isOpen: true,
                          title: 'Accept Offer',
                          message: `Are you sure you want to accept this offer from ${buyerName}?`,
                          action: () => handleOfferAction(offer.id, 'accept'),
                          variant: 'ethiopianGreen',
                          confirmText: 'Yes, Accept'
                        })
                      }}
                      isLoading={isOfferActionLoading}
                    >
                      <CheckCircle className='w-3 h-3' />
                    </Button>
                  )}
                  {canReject && (
                    <Button
                      variant='danger'
                      size='xs'
                      onClick={() => {
                        setConfirmModalProps({
                          isOpen: true,
                          title: 'Reject Offer',
                          message: `Are you sure you want to reject this offer from ${buyerName}?`,
                          action: () => handleOfferAction(offer.id, 'reject'),
                          variant: 'ethiopianRed',
                          confirmText: 'Yes, Reject'
                        })
                      }}
                      isLoading={isOfferActionLoading}
                    >
                      <XCircle className='w-3 h-3' />
                    </Button>
                  )}
                  {canCounter && (
                    <Button
                      variant='gondarBlue'
                      size='xs'
                      onClick={() => {
                        // Show counter dialog - simplified for now
                        const counterPrice = prompt(
                          'Enter counter price per quintal:',
                          offer.offered_price
                        )
                        if (counterPrice && parseFloat(counterPrice) > 0) {
                          handleOfferAction(offer.id, 'counter', {
                            counter_price: parseFloat(counterPrice),
                            counter_message: prompt('Add a message:') || null
                          })
                        }
                      }}
                      isLoading={isOfferActionLoading}
                    >
                      <ArrowLeft className='w-3 h-3' />
                    </Button>
                  )}
                  {canWithdraw && (
                    <Button
                      variant='axumDark'
                      size='xs'
                      onClick={() => {
                        setConfirmModalProps({
                          isOpen: true,
                          title: 'Withdraw Offer',
                          message:
                            'Are you sure you want to withdraw this offer?',
                          action: () => handleOfferAction(offer.id, 'withdraw'),
                          variant: 'axumDark',
                          confirmText: 'Yes, Withdraw'
                        })
                      }}
                      isLoading={isOfferActionLoading}
                    >
                      <X className='w-3 h-3' />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    )
  }

  // =============================================
  // RENDER RELATED LISTINGS
  // =============================================
  const renderRelatedListings = () => {
    if (relatedListings.length === 0) return null

    return (
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
        {relatedListings.map(item => (
          <Card
            key={item.id}
            variant='axumDark'
            className='p-3 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]'
            onClick={() => navigate(`/listings/${item.id}`)}
          >
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0'>
                <Package className='w-6 h-6 text-primary-600' />
              </div>
              <div className='min-w-0'>
                <p className='font-medium text-gray-900 dark:text-white text-sm truncate'>
                  {item.product_name}
                </p>
                <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
                  <span>{formatNumber(item.quantity_quintals)} q</span>
                  <span>•</span>
                  <span className='font-medium text-primary-600'>
                    {formatCurrency(item.unit_price)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  // =============================================
  // LOADING STATE
  // =============================================
  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <LoadingSpinner
          variant='ethiopianFlag'
          size='lg'
          label='Loading listing details...'
        />
      </div>
    )
  }

  // =============================================
  // NOT FOUND
  // =============================================
  if (!listing) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[400px] p-6'>
        <Package className='w-16 h-16 text-gray-300 dark:text-gray-600 mb-4' />
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
          Listing Not Found
        </h3>
        <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
          The listing you're looking for doesn't exist or has been removed
        </p>
        <Button
          variant='ethiopianGreen'
          className='mt-4'
          onClick={() => navigate('/search')}
        >
          Browse Listings
        </Button>
      </div>
    )
  }

  // =============================================
  // MAIN RENDER
  // =============================================
  const isOwner = listing.manager_id === user?.id
  const isActive = listing.status === 'active'
  const isExpired = listing.status === 'expired'
  const isReserved = listing.status === 'reserved'
  const isCompleted = listing.status === 'completed'
  const canManage = isOwner || isAdmin()
  const canMakeOffer = isActive && isBuyer() && !isOwner && !isAdmin()

  return (
    <div className='max-w-6xl mx-auto space-y-6'>
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className='flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors'
      >
        <ArrowLeft className='w-4 h-4' />
        Back
      </button>

      {/* Main Content */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column - Images & Details */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Image Gallery */}
          {renderImageGallery()}

          {/* Product Information */}
          <Card variant='ethiopianGreen' className='p-5'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
                  {listing.product_name}
                </h1>
                <div className='flex flex-wrap items-center gap-3 mt-2'>
                  <StatusBadge status={listing.status} size='md' />
                  <span className='text-sm text-gray-500 dark:text-gray-400'>
                    Posted {formatTimeAgo(listing.created_at)}
                  </span>
                  <span className='text-sm text-gray-400 dark:text-gray-500'>
                    <Eye className='w-3.5 h-3.5 inline mr-1' />
                    {formatNumber(listing.views || 0)} views
                  </span>
                </div>
              </div>
              <div className='flex items-center gap-2 flex-shrink-0'>
                <button
                  onClick={handleFavorite}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    isFavorite
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-500'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-red-500'
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${isFavorite ? 'fill-red-500' : ''}`}
                  />
                </button>
                <button
                  onClick={handleShare}
                  className='p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors'
                >
                  <Share2 className='w-5 h-5' />
                </button>
                {canManage && (
                  <button
                    onClick={() => navigate(`/new-listing/${id}`)}
                    className='p-2 rounded-xl bg-primary-100 dark:bg-primary-900/20 text-primary-600 hover:text-primary-700 transition-colors'
                  >
                    <Edit className='w-5 h-5' />
                  </button>
                )}
              </div>
            </div>

            {/* Price & Quantity */}
            <div className='grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4'>
              <div className='p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20'>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  Price per quintal
                </p>
                <p className='text-xl font-bold text-primary-600 dark:text-primary-400'>
                  {formatCurrency(listing.unit_price)}
                </p>
              </div>
              <div className='p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20'>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  Quantity
                </p>
                <p className='text-xl font-bold text-blue-600 dark:text-blue-400'>
                  {formatNumber(listing.quantity_quintals)} q
                </p>
              </div>
              <div className='p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20'>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  Status
                </p>
                <StatusBadge status={listing.status} size='md' />
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div className='mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50'>
                <h4 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>
                  Description
                </h4>
                <p className='text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap'>
                  {listing.description}
                </p>
              </div>
            )}

            {/* Farmers */}
            <div className='mt-4'>
              <h4 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>
                <Users className='w-4 h-4 inline mr-1.5' />
                Associated Farmers ({farmers.length})
              </h4>
              {renderFarmers()}
            </div>

            {/* Expiry Date */}
            <div className='mt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400'>
              <div className='flex items-center gap-1.5'>
                <Calendar className='w-4 h-4' />
                <span>Harvest: {formatDate(listing.harvest_date)}</span>
              </div>
              <div className='flex items-center gap-1.5'>
                <Clock className='w-4 h-4' />
                <span>
                  Expires: {formatDate(listing.expiry_date)}
                  {listing.status === 'active' &&
                    (() => {
                      const days = Math.ceil(
                        (new Date(listing.expiry_date) - new Date()) /
                          (1000 * 60 * 60 * 24)
                      )
                      return days <= 3 ? (
                        <Badge
                          variant='ethiopianRed'
                          size='xs'
                          className='ml-2'
                        >
                          ⚠️ {days} days left
                        </Badge>
                      ) : (
                        <Badge
                          variant='ethiopianGreen'
                          size='xs'
                          className='ml-2'
                        >
                          {days} days left
                        </Badge>
                      )
                    })()}
                </span>
              </div>
            </div>
          </Card>

          {/* Map */}
          {listing.latitude && listing.longitude && (
            <Card variant='gondarBlue' className='p-0 overflow-hidden'>
              <div className='h-64 w-full'>
                <Map
                  center={[listing.latitude, listing.longitude]}
                  zoom={13}
                  markers={[
                    {
                      lat: listing.latitude,
                      lng: listing.longitude,
                      popup: `${listing.product_name} - ${listing.quantity_quintals} q`
                    }
                  ]}
                  darkMode={false}
                  variant='gondarBlue'
                  className='h-full w-full'
                />
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Actions & Offers */}
        <div className='space-y-6'>
          {/* Quick Actions */}
          <Card variant='ethiopianGreen' className='p-4'>
            <h3 className='font-semibold text-gray-900 dark:text-white mb-3'>
              Quick Actions
            </h3>
            <div className='space-y-2'>
              {canMakeOffer && (
                <Button
                  variant='ethiopianGreen'
                  fullWidth
                  size='lg'
                  onClick={openOfferModal}
                  leftIcon={<ShoppingBag className='w-4 h-4' />}
                >
                  Make Offer
                </Button>
              )}

              {canManage && (
                <>
                  <Button
                    variant='outline'
                    fullWidth
                    size='md'
                    onClick={() => navigate(`/new-listing/${id}`)}
                    leftIcon={<Edit className='w-4 h-4' />}
                  >
                    Edit Listing
                  </Button>
                  <Button
                    variant='danger'
                    fullWidth
                    size='md'
                    onClick={() => {
                      setConfirmModalProps({
                        isOpen: true,
                        title: 'Delete Listing',
                        message:
                          'Are you sure you want to delete this listing? This action cannot be undone.',
                        action: () => handleListingAction('delete'),
                        variant: 'ethiopianRed',
                        confirmText: 'Yes, Delete'
                      })
                    }}
                    leftIcon={<Trash2 className='w-4 h-4' />}
                  >
                    Delete Listing
                  </Button>
                  {isActive && (
                    <Button
                      variant='amharaGold'
                      fullWidth
                      size='md'
                      onClick={() => {
                        setConfirmModalProps({
                          isOpen: true,
                          title: 'Change Status',
                          message:
                            'Do you want to mark this listing as completed?',
                          action: () =>
                            handleListingAction('status', {
                              status: 'completed'
                            }),
                          variant: 'amharaGold',
                          confirmText: 'Mark Completed'
                        })
                      }}
                      leftIcon={<CheckCircle className='w-4 h-4' />}
                    >
                      Mark as Completed
                    </Button>
                  )}
                  {isActive && (
                    <Button
                      variant='axumDark'
                      fullWidth
                      size='md'
                      onClick={() => {
                        setConfirmModalProps({
                          isOpen: true,
                          title: 'Expire Listing',
                          message:
                            'Do you want to mark this listing as expired?',
                          action: () =>
                            handleListingAction('status', {
                              status: 'expired'
                            }),
                          variant: 'axumDark',
                          confirmText: 'Mark Expired'
                        })
                      }}
                      leftIcon={<XCircle className='w-4 h-4' />}
                    >
                      Mark as Expired
                    </Button>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Statistics */}
          <Card variant='snnpPurple' className='p-4'>
            <h3 className='font-semibold text-gray-900 dark:text-white mb-3'>
              📊 Statistics
            </h3>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-500 dark:text-gray-400'>Views</span>
                <span className='font-medium'>
                  {formatNumber(listing.views || 0)}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500 dark:text-gray-400'>Offers</span>
                <span className='font-medium'>{offers.length}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500 dark:text-gray-400'>
                  Farmers
                </span>
                <span className='font-medium'>{farmers.length}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500 dark:text-gray-400'>
                  Total Value
                </span>
                <span className='font-medium text-primary-600'>
                  {formatCurrency(
                    listing.unit_price * listing.quantity_quintals
                  )}
                </span>
              </div>
            </div>
          </Card>

          {/* Offers Section */}
          <Card variant='gondarBlue' className='p-4'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='font-semibold text-gray-900 dark:text-white'>
                💬 Offers ({offers.length})
              </h3>
              {isActive && isBuyer() && !isOwner && (
                <Button
                  variant='ethiopianGreen'
                  size='sm'
                  onClick={openOfferModal}
                >
                  <Plus className='w-3.5 h-3.5' />
                </Button>
              )}
            </div>
            {renderOffers()}
          </Card>
        </div>
      </div>

      {/* Related Listings */}
      {relatedListings.length > 0 && (
        <div className='mt-8'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            🔄 Related Listings
          </h3>
          {renderRelatedListings()}
        </div>
      )}

      {/* Lightbox */}
      {renderLightbox()}

      {/* Offer Modal */}
      <Dialog
        isOpen={isOfferModalOpen}
        onClose={closeOfferModal}
        title='Make an Offer'
        description={`Offer on ${listing.product_name}`}
        variant='ethiopianGreen'
        size='md'
        showConfirm
        showCancel
        confirmText='Submit Offer'
        cancelText='Cancel'
        onConfirm={handleSubmitOffer}
        onCancel={closeOfferModal}
        loading={isSubmittingOffer}
        darkMode={false}
      >
        <div className='space-y-4'>
          <Input
            label='Your Price (Birr per quintal)'
            name='offered_price'
            type='number'
            value={offerData.offered_price}
            onChange={handleOfferChange}
            placeholder={`e.g., ${listing.unit_price}`}
            min='1'
            step='0.5'
            error={offerErrors.offered_price}
            required
            variant='ethiopianGreen'
            darkMode={false}
          />
          <Input
            label='Quantity (quintals)'
            name='quantity_quintals'
            type='number'
            value={offerData.quantity_quintals}
            onChange={handleOfferChange}
            placeholder={`Max: ${listing.quantity_quintals} quintals`}
            min='1'
            max={listing.quantity_quintals}
            step='0.5'
            error={offerErrors.quantity_quintals}
            required
            variant='ethiopianGreen'
            darkMode={false}
          />
          <Textarea
            label='Message (Optional)'
            name='message'
            value={offerData.message}
            onChange={handleOfferChange}
            placeholder='Add a message to the manager...'
            rows={2}
            maxLength={200}
            variant='ethiopianGreen'
            darkMode={false}
          />
          <div className='text-sm text-gray-500 dark:text-gray-400'>
            <p>📦 Product: {listing.product_name}</p>
            <p>
              📊 Available: {formatNumber(listing.quantity_quintals)} quintals
            </p>
            <p>💰 Listed price: {formatCurrency(listing.unit_price)}/q</p>
          </div>
        </div>
      </Dialog>

      {/* Confirm Modal */}
      <Dialog
        isOpen={confirmModalProps.isOpen}
        onClose={() =>
          setConfirmModalProps(prev => ({ ...prev, isOpen: false }))
        }
        title={confirmModalProps.title}
        description={confirmModalProps.message}
        variant={confirmModalProps.variant}
        size='sm'
        showConfirm
        showCancel
        confirmText={confirmModalProps.confirmText}
        cancelText='Cancel'
        onConfirm={() => {
          if (confirmModalProps.action) confirmModalProps.action()
        }}
        onCancel={() =>
          setConfirmModalProps(prev => ({ ...prev, isOpen: false }))
        }
        loading={isOfferActionLoading || isManaging}
        darkMode={false}
      />
    </div>
  )
}

export default ListingDetail
