// frontend/src/pages/ListingForm.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Package,
  DollarSign,
  Calendar,
  MapPin,
  Users,
  Image as ImageIcon,
  Upload,
  Mic,
  X,
  Check,
  AlertCircle,
  Save,
  Send,
  Clock,
  Tag,
  Weight,
  Coffee,
  Wheat,
  Apple,
  Carrot,
  Eye,
  RefreshCw,
  Trash2,
  Plus,
  Minus,
  Search
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { useLocation } from '../hooks/useLocation.js'
import { listingService } from '../services/listingService.js'
import { farmerService } from '../services/farmerService.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import Textarea from '../components/ui/Textarea.jsx'
import Badge from '../components/ui/Badge.jsx'
import ImageUpload from '../components/ImageUpload.jsx'
import Map from '../components/Map.jsx'
import VoiceRecorder from '../components/VoiceRecorder.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { formatDate, formatCurrency } from '../utils/formatters.js'
import {
  SHELF_LIFE_DAYS,
  PRODUCT_SUB_CATEGORIES,
  PRODUCT_CATEGORIES
} from '../utils/constants.js'
import { validateQuantity, validatePrice } from '../utils/validators.js'

const ListingForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user, profile, isManager, isAdmin } = useAuth()
  const { success, error } = useToast()
  const { location: userLocation, getLocation } = useLocation()

  const isEditMode = !!id

  // =============================================
  // STATE
  // =============================================
  const [formData, setFormData] = useState({
    product_name: '',
    category: '',
    quantity_quintals: '',
    unit_price: '',
    harvest_date: '',
    shelf_life_days: 7,
    description: '',
    latitude: null,
    longitude: null,
    farmer_ids: [],
    photos: []
  })

  const [farmers, setFarmers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [searchFarmers, setSearchFarmers] = useState('')
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)

  // =============================================
  // FETCH FARMERS AND LISTING DATA
  // =============================================
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)

      try {
        // Fetch farmers
        const farmersResult = await farmerService.getFarmers({ limit: 100 })
        if (farmersResult.success) {
          setFarmers(farmersResult.data || [])
        }

        // If edit mode, fetch listing data
        if (isEditMode && id) {
          const listingResult = await listingService.getListingById(id)
          if (listingResult.success && listingResult.data) {
            const listing = listingResult.data
            setFormData({
              product_name: listing.product_name || '',
              category: listing.category || '',
              quantity_quintals: listing.quantity_quintals || '',
              unit_price: listing.unit_price || '',
              harvest_date: listing.harvest_date || '',
              shelf_life_days: listing.shelf_life_days || 7,
              description: listing.description || '',
              latitude: listing.latitude || null,
              longitude: listing.longitude || null,
              farmer_ids: listing.farmer_ids || [],
              photos: listing.photos || []
            })
            if (listing.latitude && listing.longitude) {
              setSelectedLocation({
                lat: listing.latitude,
                lng: listing.longitude
              })
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
        error('Failed to load data. Please refresh.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, isEditMode, error])

  // =============================================
  // HANDLE INPUT CHANGE
  // =============================================
  const handleChange = e => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || '' : value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // =============================================
  // HANDLE SELECT CHANGE
  // =============================================
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // =============================================
  // HANDLE FARMER SELECTION
  // =============================================
  const toggleFarmerSelection = farmerId => {
    setFormData(prev => {
      const current = prev.farmer_ids || []
      const newIds = current.includes(farmerId)
        ? current.filter(id => id !== farmerId)
        : [...current, farmerId]
      return { ...prev, farmer_ids: newIds }
    })
  }

  // =============================================
  // HANDLE LOCATION SELECT
  // =============================================
  const handleLocationSelect = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }))
    setSelectedLocation({ lat, lng })
  }

  // =============================================
  // HANDLE MAP CLICK
  // =============================================
  const handleMapClick = coords => {
    handleLocationSelect(coords.lat, coords.lng)
  }

  // =============================================
  // HANDLE USE CURRENT LOCATION
  // =============================================
  const handleUseCurrentLocation = async () => {
    try {
      const pos = await getLocation()
      if (pos && pos.latitude && pos.longitude) {
        handleLocationSelect(pos.latitude, pos.longitude)
        success('Location updated from GPS')
      }
    } catch (err) {
      error(
        'Failed to get location. Please allow location access or select manually.'
      )
    }
  }

  // =============================================
  // HANDLE PHOTOS CHANGE
  // =============================================
  const handlePhotosChange = photos => {
    setFormData(prev => ({
      ...prev,
      photos: photos.map(p => p.url || p.preview || p).filter(Boolean)
    }))
  }

  // =============================================
  // HANDLE VOICE TRANSCRIPTION
  // =============================================
  const handleVoiceTranscription = data => {
    if (data.extracted_data) {
      const extracted = data.extracted_data
      if (extracted.product_name) {
        setFormData(prev => ({ ...prev, product_name: extracted.product_name }))
      }
      if (extracted.quantity_quintals) {
        setFormData(prev => ({
          ...prev,
          quantity_quintals: extracted.quantity_quintals
        }))
      }
      if (extracted.unit_price) {
        setFormData(prev => ({ ...prev, unit_price: extracted.unit_price }))
      }
      if (extracted.location) {
        // Could use geocoding here to get coordinates
      }
      if (extracted.harvest_date) {
        setFormData(prev => ({ ...prev, harvest_date: extracted.harvest_date }))
      }
      success('✅ Listing data extracted from voice!')
    }
    setIsVoiceRecorderOpen(false)
  }

  // =============================================
  // VALIDATE FORM
  // =============================================
  const validateForm = () => {
    const newErrors = {}

    if (!formData.product_name || formData.product_name.length < 2) {
      newErrors.product_name = 'Product name is required'
    }

    if (!formData.quantity_quintals || formData.quantity_quintals <= 0) {
      newErrors.quantity_quintals = 'Quantity must be greater than 0'
    }

    if (!formData.unit_price || formData.unit_price <= 0) {
      newErrors.unit_price = 'Price must be greater than 0'
    }

    if (!formData.harvest_date) {
      newErrors.harvest_date = 'Harvest date is required'
    }

    if (!formData.latitude || !formData.longitude) {
      newErrors.location = 'Please select a location on the map'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // =============================================
  // HANDLE SUBMIT
  // =============================================
  const handleSubmit = async e => {
    e.preventDefault()
    setFormSubmitted(true)

    if (!validateForm()) {
      error('Please fix the errors before submitting.')
      return
    }

    setIsSubmitting(true)

    try {
      const listingData = {
        product_name: formData.product_name,
        quantity_quintals: parseFloat(formData.quantity_quintals),
        unit_price: parseFloat(formData.unit_price),
        harvest_date: formData.harvest_date,
        shelf_life_days: parseInt(formData.shelf_life_days) || 7,
        description: formData.description || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        farmer_ids: formData.farmer_ids || [],
        photos: formData.photos || []
      }

      let result
      if (isEditMode) {
        result = await listingService.updateListing(id, listingData)
      } else {
        result = await listingService.createListing(listingData)
      }

      if (result.success) {
        success(
          isEditMode
            ? 'Listing updated successfully!'
            : 'Listing created successfully!'
        )
        navigate('/my-listings')
      } else {
        error(result.error || 'Failed to save listing')
      }
    } catch (err) {
      console.error('Submit error:', err)
      error('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // =============================================
  // FILTER FARMERS BY SEARCH
  // =============================================
  const filteredFarmers = farmers.filter(
    farmer =>
      farmer.full_name.toLowerCase().includes(searchFarmers.toLowerCase()) ||
      farmer.phone_number.includes(searchFarmers)
  )

  // =============================================
  // PRODUCT CATEGORY OPTIONS
  // =============================================
  const categoryOptions = Object.entries(PRODUCT_SUB_CATEGORIES).map(
    ([category, items]) => ({
      label: category,
      value: category,
      group: category
    })
  )

  const productOptions = formData.category
    ? (PRODUCT_SUB_CATEGORIES[formData.category] || []).map(item => ({
        label: item,
        value: item
      }))
    : []

  // =============================================
  // LOADING STATE
  // =============================================
  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <LoadingSpinner variant='ethiopianFlag' size='lg' label='Loading...' />
      </div>
    )
  }

  // =============================================
  // MAIN RENDER
  // =============================================
  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
            {isEditMode ? 'Edit Listing' : 'Create New Listing'}
          </h1>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            {isEditMode
              ? 'Update your product listing details'
              : 'List your agricultural products for buyers'}
          </p>
        </div>
        {isEditMode && (
          <Badge variant='amharaGold' size='lg'>
            Edit Mode
          </Badge>
        )}
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Voice Recorder */}
        <Card variant='snnpPurple' className='p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center'>
                <Mic className='w-5 h-5 text-purple-500' />
              </div>
              <div>
                <p className='font-semibold text-gray-900 dark:text-white'>
                  Voice Listing
                </p>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  Speak in Amharic to auto-fill the form
                </p>
              </div>
            </div>
            <Button
              variant='snnpPurple'
              size='sm'
              onClick={() => setIsVoiceRecorderOpen(!isVoiceRecorderOpen)}
              leftIcon={<Mic className='w-4 h-4' />}
            >
              {isVoiceRecorderOpen ? 'Close' : 'Start Recording'}
            </Button>
          </div>

          {isVoiceRecorderOpen && (
            <div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
              <VoiceRecorder
                variant='snnpPurple'
                language='am'
                onTranscriptionComplete={handleVoiceTranscription}
                darkMode={false}
                className='w-full'
              />
            </div>
          )}
        </Card>

        {/* Basic Information */}
        <Card variant='ethiopianGreen' className='p-5'>
          <h3 className='font-semibold text-gray-900 dark:text-white mb-4'>
            Product Information
          </h3>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Product Name */}
            <div className='md:col-span-2'>
              <Input
                label='Product Name'
                name='product_name'
                value={formData.product_name}
                onChange={handleChange}
                placeholder='e.g., Red Onions, Premium Coffee, Fresh Tomatoes'
                leftIcon={<Package className='w-4 h-4' />}
                error={formSubmitted && errors.product_name}
                required
                darkMode={false}
                variant='ethiopianGreen'
              />
            </div>

            {/* Category */}
            <div className='md:col-span-2'>
              <Select
                label='Category'
                name='category'
                value={formData.category}
                onChange={e => handleSelectChange('category', e.target.value)}
                options={categoryOptions}
                placeholder='Select a category'
                darkMode={false}
                variant='ethiopianGreen'
              />
            </div>

            {/* Product Name Auto-suggest (if category selected) */}
            {formData.category && (
              <div className='md:col-span-2'>
                <Input
                  label='Product Type'
                  name='product_name'
                  value={formData.product_name}
                  onChange={handleChange}
                  placeholder='Enter product name...'
                  leftIcon={<Tag className='w-4 h-4' />}
                  helper='You can also type to search products in this category'
                  darkMode={false}
                  variant='ethiopianGreen'
                />
              </div>
            )}

            {/* Quantity */}
            <div>
              <Input
                label='Quantity (Quintals)'
                name='quantity_quintals'
                type='number'
                value={formData.quantity_quintals}
                onChange={handleChange}
                placeholder='e.g., 50'
                leftIcon={<Weight className='w-4 h-4' />}
                error={formSubmitted && errors.quantity_quintals}
                required
                min='1'
                step='0.5'
                darkMode={false}
                variant='ethiopianGreen'
                helper='1 quintal = 100 kg'
              />
            </div>

            {/* Price */}
            <div>
              <Input
                label='Price per Quintal (Birr)'
                name='unit_price'
                type='number'
                value={formData.unit_price}
                onChange={handleChange}
                placeholder='e.g., 45'
                leftIcon={<DollarSign className='w-4 h-4' />}
                error={formSubmitted && errors.unit_price}
                required
                min='1'
                step='0.5'
                darkMode={false}
                variant='ethiopianGreen'
              />
            </div>

            {/* Harvest Date */}
            <div>
              <Input
                label='Harvest Date'
                name='harvest_date'
                type='date'
                value={formData.harvest_date}
                onChange={handleChange}
                leftIcon={<Calendar className='w-4 h-4' />}
                error={formSubmitted && errors.harvest_date}
                required
                darkMode={false}
                variant='ethiopianGreen'
              />
            </div>

            {/* Shelf Life */}
            <div>
              <Input
                label='Shelf Life (Days)'
                name='shelf_life_days'
                type='number'
                value={formData.shelf_life_days}
                onChange={handleChange}
                placeholder='e.g., 7'
                leftIcon={<Clock className='w-4 h-4' />}
                min='1'
                max='730'
                darkMode={false}
                variant='ethiopianGreen'
                helper='Days before product expires (auto-calculated)'
              />
            </div>

            {/* Description */}
            <div className='md:col-span-2'>
              <Textarea
                label='Description'
                name='description'
                value={formData.description}
                onChange={handleChange}
                placeholder='Describe your product, quality, harvesting method, etc.'
                maxLength={500}
                rows={3}
                darkMode={false}
                variant='ethiopianGreen'
              />
            </div>
          </div>
        </Card>

        {/* Location */}
        <Card variant='gondarBlue' className='p-5'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h3 className='font-semibold text-gray-900 dark:text-white'>
                Location
              </h3>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                Pin the location of your farm on the map
              </p>
            </div>
            <Button
              variant='gondarBlue'
              size='sm'
              onClick={handleUseCurrentLocation}
              leftIcon={<MapPin className='w-4 h-4' />}
            >
              Use My Location
            </Button>
          </div>

          {formSubmitted && errors.location && (
            <div className='mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 flex items-start gap-2'>
              <AlertCircle className='w-4 h-4 text-red-500 mt-0.5 flex-shrink-0' />
              <p className='text-sm text-red-700 dark:text-red-300'>
                {errors.location}
              </p>
            </div>
          )}

          <div className='h-64 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700'>
            <Map
              center={
                selectedLocation
                  ? [selectedLocation.lat, selectedLocation.lng]
                  : [9.03, 38.76]
              }
              zoom={12}
              onMapClick={handleMapClick}
              markers={
                selectedLocation
                  ? [{ lat: selectedLocation.lat, lng: selectedLocation.lng }]
                  : []
              }
              darkMode={false}
              variant='gondarBlue'
              className='h-full w-full'
            />
          </div>

          {selectedLocation && (
            <div className='mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400'>
              <span>📍 Lat: {selectedLocation.lat.toFixed(6)}</span>
              <span>📍 Lng: {selectedLocation.lng.toFixed(6)}</span>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  setSelectedLocation(null)
                  setFormData(prev => ({
                    ...prev,
                    latitude: null,
                    longitude: null
                  }))
                }}
                className='!text-red-500'
              >
                <X className='w-3.5 h-3.5' />
                Clear
              </Button>
            </div>
          )}
        </Card>

        {/* Farmers Selection */}
        <Card variant='oromiaSunset' className='p-5'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h3 className='font-semibold text-gray-900 dark:text-white'>
                Add Farmers
              </h3>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                Select farmers associated with this product
              </p>
            </div>
            <Badge variant='oromiaSunset' size='sm'>
              {formData.farmer_ids?.length || 0} selected
            </Badge>
          </div>

          {/* Search Farmers */}
          <Input
            placeholder='Search farmers by name or phone...'
            value={searchFarmers}
            onChange={e => setSearchFarmers(e.target.value)}
            leftIcon={<Search className='w-4 h-4' />}
            className='mb-4'
            darkMode={false}
            variant='oromiaSunset'
          />

          {farmers.length === 0 ? (
            <div className='text-center py-4 text-gray-500 dark:text-gray-400'>
              <Users className='w-8 h-8 mx-auto mb-2 opacity-20' />
              <p>No farmers registered yet</p>
              <Button
                variant='outline'
                size='sm'
                className='mt-2'
                onClick={() => navigate('/farmers')}
              >
                Register Farmers
              </Button>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto'>
              {filteredFarmers.length === 0 ? (
                <div className='col-span-2 text-center py-4 text-gray-500 dark:text-gray-400'>
                  No farmers match your search
                </div>
              ) : (
                filteredFarmers.map(farmer => {
                  const isSelected = formData.farmer_ids?.includes(farmer.id)
                  return (
                    <button
                      key={farmer.id}
                      type='button'
                      onClick={() => toggleFarmerSelection(farmer.id)}
                      className={`
                        flex items-center gap-3 p-2.5 rounded-xl border-2 text-left transition-all duration-200
                        ${
                          isSelected
                            ? 'border-oromiaSunset bg-orange-50 dark:bg-orange-900/20 shadow-lg shadow-orange-500/10'
                            : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                        }
                      `}
                    >
                      <div
                        className={`
                        w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                        ${
                          isSelected
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }
                      `}
                      >
                        {isSelected ? (
                          <Check className='w-3.5 h-3.5' />
                        ) : (
                          <Plus className='w-3.5 h-3.5' />
                        )}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium text-gray-900 dark:text-white text-sm'>
                          {farmer.full_name}
                        </p>
                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                          {farmer.phone_number}
                        </p>
                      </div>
                      <Badge variant='axumDark' size='xs'>
                        {farmer.district || 'No district'}
                      </Badge>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </Card>

        {/* Images */}
        <Card variant='snnpPurple' className='p-5'>
          <div>
            <h3 className='font-semibold text-gray-900 dark:text-white mb-4'>
              Product Images
            </h3>
            <ImageUpload
              label='Upload photos of your product'
              maxFiles={5}
              maxSize={5 * 1024 * 1024}
              bucket='listings'
              folder={`user-${user?.id}`}
              value={formData.photos}
              onChange={handlePhotosChange}
              variant='snnpPurple'
              darkMode={false}
              className='w-full'
            />
          </div>
        </Card>

        {/* Submit Actions */}
        <div className='flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800'>
          <Button
            variant='ghost'
            size='lg'
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant='axumDark'
            size='lg'
            type='submit'
            isLoading={isSubmitting}
            disabled={isSubmitting}
            leftIcon={isSubmitting ? undefined : <Save className='w-4 h-4' />}
          >
            {isSubmitting
              ? 'Saving...'
              : isEditMode
              ? 'Update Listing'
              : 'Create Listing'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ListingForm
