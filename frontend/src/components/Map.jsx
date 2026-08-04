// frontend/src/components/Map.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { useLocation } from '../hooks/useLocation.js'
import { formatDistance } from '../utils/formatters.js'
import { Card } from './ui/Card.jsx'
import Button from './ui/Button.jsx'
import {
  Loader2,
  MapPin,
  Crosshair,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2
} from 'lucide-react'

// =============================================
// FIX DEFAULT ICONS
// =============================================
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'

// Fix default icon issue with Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow
})

// =============================================
// CUSTOM MARKER ICON FACTORY
// =============================================
export const createCustomIcon = (color = '#15803d', size = 30) => {
  const iconSize = size
  const iconAnchor = [iconSize / 2, iconSize]

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${iconSize}px;
        height: ${iconSize}px;
        background: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        transition: all 0.3s ease;
      ">
        <div style="
          width: ${iconSize - 12}px;
          height: ${iconSize - 12}px;
          background: white;
          border-radius: 50%;
          transform: rotate(45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${iconSize * 0.4}px;
          font-weight: bold;
          color: ${color};
        ">
          ${iconSize >= 30 ? '📍' : ''}
        </div>
      </div>
      <div style="
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: ${iconSize * 0.4}px;
        height: ${iconSize * 0.15}px;
        background: rgba(0,0,0,0.2);
        border-radius: 50%;
        filter: blur(2px);
      "></div>
    `,
    iconSize: [iconSize, iconSize * 1.2],
    iconAnchor: [iconSize / 2, iconSize * 1.2],
    popupAnchor: [0, -iconSize * 1.2]
  })
}

// =============================================
// MAP COMPONENT
// =============================================
const Map = ({
  listings = [],
  center = [9.03, 38.76], // Addis Ababa default
  zoom = 12,
  height = '500px',
  width = '100%',
  variant = 'ethiopianGreen',
  darkMode = false,
  showUserLocation = true,
  showFullscreen = true,
  showZoomControls = true,
  markerCluster = true,
  onMarkerClick = null,
  onMapClick = null,
  className = '',
  userLocationMarker = true,
  showDistance = true,
  ...props
}) => {
  const mapRef = useRef(null)
  const [mapInstance, setMapInstance] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [selectedListing, setSelectedListing] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // =============================================
  // GRADIENT VARIANTS
  // =============================================
  const gradientVariants = {
    ethiopianGreen: '#15803d',
    ethiopianYellow: '#eab308',
    ethiopianRed: '#dc2626',
    oromiaSunset: '#f97316',
    amharaGold: '#d97706',
    gondarBlue: '#3b82f6',
    axumDark: '#374151',
    ethiopianFlag: '#078930',
    snnpPurple: '#8b5cf6',
    tigrayRuby: '#e11d48'
  }

  const markerColor =
    gradientVariants[variant] || gradientVariants.ethiopianGreen

  // =============================================
  // USER LOCATION
  // =============================================
  const {
    location,
    loading: locationLoading,
    error: locationError,
    getLocation
  } = useLocation({
    enableHighAccuracy: true,
    timeout: 15000,
    fallbackToDefault: true,
    watch: false
  })

  useEffect(() => {
    if (location) {
      setUserLocation({
        lat: location.latitude,
        lng: location.longitude
      })
    }
  }, [location])

  // =============================================
  // CUSTOM ICONS
  // =============================================
  const customIcon = useMemo(
    () => createCustomIcon(markerColor, 35),
    [markerColor]
  )

  const userIcon = L.divIcon({
    className: 'user-marker',
    html: `
      <div style="
        width: 40px;
        height: 40px;
        background: #3b82f6;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 0 0 4px rgba(59,130,246,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        color: white;
        animation: pulse-bg 2s infinite;
      ">
        🧑‍🌾
      </div>
      <style>
        @keyframes pulse-bg {
          0% { box-shadow: 0 0 0 4px rgba(59,130,246,0.3); }
          50% { box-shadow: 0 0 0 8px rgba(59,130,246,0.1); }
          100% { box-shadow: 0 0 0 4px rgba(59,130,246,0.3); }
        }
      </style>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  })

  // =============================================
  // MAP EVENTS
  // =============================================
  const MapEvents = () => {
    const map = useMapEvents({
      click: e => {
        if (onMapClick) {
          onMapClick({
            lat: e.latlng.lat,
            lng: e.latlng.lng
          })
        }
      }
    })
    return null
  }

  // =============================================
  // ZOOM CONTROLS
  // =============================================
  const ZoomControls = () => {
    const map = useMap()

    const handleZoomIn = () => {
      map.zoomIn()
    }

    const handleZoomOut = () => {
      map.zoomOut()
    }

    const handleLocate = async () => {
      setIsLoading(true)
      try {
        const pos = await getLocation()
        if (pos && pos.latitude && pos.longitude) {
          map.flyTo([pos.latitude, pos.longitude], 14, {
            duration: 1.5
          })
        }
      } catch (err) {
        console.error('Location error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    return (
      <div className='absolute bottom-4 right-4 z-[1000] flex flex-col gap-2'>
        {showZoomControls && (
          <>
            <Button
              variant='ethiopianGreen'
              size='sm'
              onClick={handleZoomIn}
              className='!p-2 !rounded-lg shadow-lg hover:scale-105 transition-transform'
              animated
            >
              <ZoomIn className='w-5 h-5' />
            </Button>
            <Button
              variant='ethiopianGreen'
              size='sm'
              onClick={handleZoomOut}
              className='!p-2 !rounded-lg shadow-lg hover:scale-105 transition-transform'
              animated
            >
              <ZoomOut className='w-5 h-5' />
            </Button>
          </>
        )}
        {showUserLocation && (
          <Button
            variant='gondarBlue'
            size='sm'
            onClick={handleLocate}
            isLoading={locationLoading || isLoading}
            className='!p-2 !rounded-lg shadow-lg hover:scale-105 transition-transform'
            animated
          >
            {locationLoading || isLoading ? (
              <Loader2 className='w-5 h-5 animate-spin' />
            ) : (
              <Crosshair className='w-5 h-5' />
            )}
          </Button>
        )}
        {showFullscreen && (
          <Button
            variant='axumDark'
            size='sm'
            onClick={() => setIsFullscreen(!isFullscreen)}
            className='!p-2 !rounded-lg shadow-lg hover:scale-105 transition-transform'
            animated
          >
            {isFullscreen ? (
              <Minimize2 className='w-5 h-5' />
            ) : (
              <Maximize2 className='w-5 h-5' />
            )}
          </Button>
        )}
      </div>
    )
  }

  // =============================================
  // CUSTOM POPUP
  // =============================================
  const renderPopup = listing => {
    const isSelected = selectedListing?.id === listing.id

    return (
      <div className='min-w-[200px] max-w-[280px] p-2'>
        <div className='flex items-center gap-2 mb-2'>
          <div
            className={`w-1 h-10 rounded-full bg-gradient-to-b ${gradientVariants[variant]}`}
          />
          <div>
            <h4 className='font-bold text-gray-900 dark:text-white text-sm'>
              {listing.product_name}
            </h4>
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              {listing.district || listing.region || 'Location'}
            </p>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-2 text-xs'>
          <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center'>
            <span className='block text-gray-500 dark:text-gray-400'>
              Quantity
            </span>
            <span className='font-semibold text-gray-900 dark:text-white'>
              {listing.quantity_quintals} q
            </span>
          </div>
          <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center'>
            <span className='block text-gray-500 dark:text-gray-400'>
              Price
            </span>
            <span className='font-semibold text-primary-600'>
              {formatCurrency(listing.unit_price)}
            </span>
          </div>
        </div>

        {showDistance &&
          userLocation &&
          listing.latitude &&
          listing.longitude && (
            <div className='mt-2 text-xs text-gray-500 dark:text-gray-400 text-center'>
              📍{' '}
              {formatDistance(
                calculateDistance(
                  userLocation.lat,
                  userLocation.lng,
                  listing.latitude,
                  listing.longitude
                )
              )}
            </div>
          )}

        <Button
          variant={variant}
          size='sm'
          fullWidth
          className='mt-3 text-xs'
          onClick={() => {
            if (onMarkerClick) onMarkerClick(listing)
          }}
        >
          View Details
        </Button>
      </div>
    )
  }

  // =============================================
  // CALCULATE DISTANCE
  // =============================================
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // =============================================
  // FORMAT CURRENCY
  // =============================================
  const formatCurrency = amount => {
    if (!amount) return 'N/A'
    return `Br ${amount.toFixed(2)}`
  }

  // =============================================
  // MARKER CLUSTER OPTIONS
  // =============================================
  const clusterOptions = {
    showCoverageOnHover: true,
    zoomToBoundsOnClick: true,
    spiderfyOnMaxZoom: true,
    removeOutsideVisibleBounds: true,
    maxClusterRadius: 50,
    iconCreateFunction: cluster => {
      const count = cluster.getChildCount()
      const size = count > 100 ? 'large' : count > 50 ? 'medium' : 'small'

      const colors = {
        small: 'bg-primary-500',
        medium: 'bg-yellow-500',
        large: 'bg-red-500'
      }

      return L.divIcon({
        html: `
          <div style="
            background: ${colors[size]};
            border-radius: 50%;
            width: ${size === 'large' ? 44 : size === 'medium' ? 36 : 28}px;
            height: ${size === 'large' ? 44 : size === 'medium' ? 36 : 28}px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: ${size === 'large' ? 14 : size === 'medium' ? 12 : 10}px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            border: 2px solid white;
          ">
            ${count}
          </div>
        `,
        className: 'marker-cluster-custom',
        iconSize: [
          size === 'large' ? 44 : size === 'medium' ? 36 : 28,
          size === 'large' ? 44 : size === 'medium' ? 36 : 28
        ],
        iconAnchor: [
          size === 'large' ? 22 : size === 'medium' ? 18 : 14,
          size === 'large' ? 22 : size === 'medium' ? 18 : 14
        ]
      })
    }
  }

  // =============================================
  // GET MAP TILE URL BASED ON DARK MODE
  // =============================================
  const tileUrl = darkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  const attribution = darkMode
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

  // =============================================
  // LISTINGS WITH LOCATION
  // =============================================
  const listingsWithLocation = useMemo(() => {
    return listings.filter(listing => listing.latitude && listing.longitude)
  }, [listings])

  return (
    <div
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{ height, width }}
      {...props}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        whenCreated={setMapInstance}
        className='z-0'
      >
        <TileLayer attribution={attribution} url={tileUrl} />

        <MapEvents />

        {/* User Location Marker */}
        {userLocationMarker && userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userIcon}
          >
            <Popup className='custom-popup'>
              <div className='p-2'>
                <p className='font-bold text-gray-900 dark:text-white text-sm'>
                  🧑‍🌾 Your Location
                </p>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  {location?.accuracy
                    ? `±${location.accuracy}m accuracy`
                    : 'Approximate location'}
                </p>
                {location?.source && (
                  <p className='text-xs text-gray-400'>
                    Source: {location.source}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Listing Markers */}
        {listingsWithLocation.map((listing, index) => (
          <Marker
            key={listing.id || index}
            position={[listing.latitude, listing.longitude]}
            icon={customIcon}
            eventHandlers={{
              click: () => setSelectedListing(listing)
            }}
          >
            <Popup className='custom-popup'>{renderPopup(listing)}</Popup>
          </Marker>
        ))}

        <ZoomControls />
      </MapContainer>

      {/* Loading Overlay */}
      {isLoading && (
        <div className='absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[1000]'>
          <div className='bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4'>
            <Loader2 className='w-8 h-8 animate-spin text-primary-600' />
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Finding your location...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

Map.displayName = 'Map'

export default Map
