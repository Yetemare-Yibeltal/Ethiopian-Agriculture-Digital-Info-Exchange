// frontend/src/pages/Profile.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Camera,
  Edit,
  Save,
  X,
  Lock,
  Eye,
  EyeOff,
  Bell,
  Shield,
  LogOut,
  Trash2,
  CheckCircle,
  AlertCircle,
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
  Calendar,
  Award,
  Star,
  Crown,
  Heart,
  Share2
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { authService } from '../services/authService.js'
import { listingService } from '../services/listingService.js'
import { offerService } from '../services/offerService.js'
import { farmerService } from '../services/farmerService.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import Badge from '../components/ui/Badge.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import Dialog from '../components/ui/Dialog.jsx'
import Separator from '../components/ui/Separator.jsx'
import {
  formatDate,
  formatTimeAgo,
  formatNumber,
  formatCurrency
} from '../utils/formatters.js'
import { ETHIOPIAN_REGIONS } from '../utils/constants.js'
import { validateEthiopianPhone } from '../utils/validators.js'

const Profile = () => {
  const navigate = useNavigate()
  const {
    user,
    profile,
    loading,
    logout,
    updateProfile,
    isAdmin,
    isManager,
    isBuyer
  } = useAuth()
  const { success, error } = useToast()

  // =============================================
  // STATE
  // =============================================
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Profile Form
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    organization_name: '',
    region: '',
    district: ''
  })
  const [formErrors, setFormErrors] = useState({})

  // Password Form
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [passwordErrors, setPasswordErrors] = useState({})

  // Stats
  const [stats, setStats] = useState({
    listings: 0,
    offers: 0,
    farmers: 0,
    acceptedOffers: 0,
    pendingOffers: 0,
    revenue: 0
  })

  const [notificationPreferences, setNotificationPreferences] = useState({
    email_notifications: true,
    sms_notifications: true,
    in_app_notifications: true,
    marketing_emails: false
  })

  // =============================================
  // FETCH STATS
  // =============================================
  const fetchStats = useCallback(async () => {
    if (!user?.id) return

    try {
      let statsData = {
        listings: 0,
        offers: 0,
        farmers: 0,
        acceptedOffers: 0,
        pendingOffers: 0,
        revenue: 0
      }

      if (isAdmin() || isManager()) {
        const listingsResult = await listingService.getMyListings(user.id, {
          limit: 1000
        })
        if (listingsResult.success) {
          const listings = listingsResult.data || []
          statsData.listings = listings.length
        }

        const farmersResult = await farmerService.getFarmers({ limit: 1000 })
        if (farmersResult.success) {
          statsData.farmers = farmersResult.data?.length || 0
        }
      }

      if (isAdmin() || isBuyer()) {
        const offersResult = await offerService.getMyOffers({ limit: 1000 })
        if (offersResult.success) {
          const offers = offersResult.data || []
          statsData.offers = offers.length
          statsData.acceptedOffers = offers.filter(
            o => o.status === 'accepted'
          ).length
          statsData.pendingOffers = offers.filter(
            o => o.status === 'pending'
          ).length
        }
      }

      setStats(statsData)
    } catch (err) {
      console.error('Fetch stats error:', err)
    }
  }, [user, isAdmin, isManager, isBuyer])

  // =============================================
  // INITIAL DATA
  // =============================================
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        organization_name: profile.organization_name || '',
        region: profile.region || '',
        district: profile.district || ''
      })
    }

    fetchStats()
  }, [profile, fetchStats])

  // =============================================
  // HANDLE FORM CHANGE
  // =============================================
  const handleFormChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // =============================================
  // HANDLE PASSWORD CHANGE
  // =============================================
  const handlePasswordChange = e => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // =============================================
  // VALIDATE PROFILE FORM
  // =============================================
  const validateProfileForm = () => {
    const errors = {}

    if (!formData.full_name || formData.full_name.length < 2) {
      errors.full_name = 'Full name is required'
    }

    if (formData.phone) {
      const phoneValidation = validateEthiopianPhone(formData.phone)
      if (!phoneValidation.valid) {
        errors.phone = phoneValidation.error
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // =============================================
  // VALIDATE PASSWORD FORM
  // =============================================
  const validatePasswordForm = () => {
    const errors = {}

    if (!passwordData.current_password) {
      errors.current_password = 'Current password is required'
    }

    if (!passwordData.new_password || passwordData.new_password.length < 8) {
      errors.new_password = 'New password must be at least 8 characters'
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      errors.confirm_password = 'Passwords do not match'
    }

    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  // =============================================
  // HANDLE PROFILE UPDATE
  // =============================================
  const handleProfileUpdate = async () => {
    if (!validateProfileForm()) return

    setIsLoading(true)
    try {
      const result = await updateProfile(formData)
      if (result.success) {
        success('Profile updated successfully')
        setIsEditing(false)
        setFormErrors({})
      } else {
        error(result.error || 'Failed to update profile')
      }
    } catch (err) {
      console.error('Profile update error:', err)
      error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  // =============================================
  // HANDLE PASSWORD CHANGE
  // =============================================
  const handlePasswordUpdate = async () => {
    if (!validatePasswordForm()) return

    setIsLoading(true)
    try {
      const result = await authService.changePassword(
        passwordData.current_password,
        passwordData.new_password
      )

      if (result.success) {
        success('Password changed successfully')
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        })
        setPasswordErrors({})
        setIsChangingPassword(false)
      } else {
        error(result.error || 'Failed to change password')
      }
    } catch (err) {
      console.error('Password change error:', err)
      error('Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  // =============================================
  // HANDLE NOTIFICATION PREFERENCE CHANGE
  // =============================================
  const handleNotificationToggle = key => {
    setNotificationPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
    // In production, save to API
  }

  // =============================================
  // HANDLE DELETE ACCOUNT
  // =============================================
  const handleDeleteAccount = async () => {
    setIsLoading(true)
    try {
      // In production, call API to delete account
      await logout()
      success('Account deleted successfully')
      navigate('/login')
    } catch (err) {
      console.error('Delete account error:', err)
      error('Failed to delete account')
    } finally {
      setIsLoading(false)
      setIsDeleteModalOpen(false)
    }
  }

  // =============================================
  // HANDLE LOGOUT
  // =============================================
  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // =============================================
  // REGION OPTIONS
  // =============================================
  const regionOptions = ETHIOPIAN_REGIONS.map(region => ({
    label: region,
    value: region
  }))

  const districtOptions = formData.region
    ? [
        { label: 'Select district', value: '' },
        { label: 'District 1', value: 'district1' },
        { label: 'District 2', value: 'district2' },
        { label: 'District 3', value: 'district3' }
      ]
    : [{ label: 'Select region first', value: '' }]

  // =============================================
  // RENDER STATS
  // =============================================
  const renderStats = () => {
    const statItems = []

    if (isAdmin() || isManager()) {
      statItems.push(
        {
          label: 'Listings',
          value: stats.listings,
          icon: <Package className='w-4 h-4' />
        },
        {
          label: 'Farmers',
          value: stats.farmers,
          icon: <Users className='w-4 h-4' />
        }
      )
    }

    if (isAdmin() || isBuyer()) {
      statItems.push(
        {
          label: 'Total Offers',
          value: stats.offers,
          icon: <ShoppingBag className='w-4 h-4' />
        },
        {
          label: 'Accepted',
          value: stats.acceptedOffers,
          icon: <CheckCircle className='w-4 h-4' />
        },
        {
          label: 'Pending',
          value: stats.pendingOffers,
          icon: <Clock className='w-4 h-4' />
        }
      )
    }

    if (statItems.length === 0) return null

    return (
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3'>
        {statItems.map((stat, index) => (
          <Card key={index} variant='axumDark' className='p-3 text-center'>
            <div className='flex items-center justify-center gap-2 mb-1'>
              <span className='text-gray-400'>{stat.icon}</span>
              <span className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                {stat.label}
              </span>
            </div>
            <p className='text-xl font-bold text-gray-900 dark:text-white'>
              {stat.value}
            </p>
          </Card>
        ))}
      </div>
    )
  }

  // =============================================
  // LOADING STATE
  // =============================================
  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <LoadingSpinner
          variant='ethiopianFlag'
          size='lg'
          label='Loading profile...'
        />
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
            👤 My Profile
          </h1>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            Manage your account settings and preferences
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Badge
            variant={
              isAdmin()
                ? 'ethiopianRed'
                : isManager()
                ? 'ethiopianGreen'
                : 'gondarBlue'
            }
            size='md'
          >
            {isAdmin() ? '👑 Admin' : isManager() ? '🌾 Manager' : '🛒 Buyer'}
          </Badge>
          <Button
            variant='outline'
            size='sm'
            onClick={handleLogout}
            leftIcon={<LogOut className='w-4 h-4' />}
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <Card variant='ethiopianGreen' className='p-6'>
        <div className='flex flex-col md:flex-row items-start md:items-center gap-6'>
          {/* Avatar */}
          <div className='relative'>
            <Avatar
              size='xl'
              name={profile?.full_name || user?.email}
              variant='ethiopianFlag'
              className='w-24 h-24 text-3xl'
            />
            <button
              className='absolute bottom-0 right-0 p-1.5 bg-primary-600 rounded-full text-white hover:bg-primary-700 transition-colors'
              aria-label='Change avatar'
            >
              <Camera className='w-4 h-4' />
            </button>
          </div>

          {/* Info */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2'>
              <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
                {profile?.full_name || 'User'}
              </h2>
              <Badge
                variant={
                  isAdmin()
                    ? 'ethiopianRed'
                    : isManager()
                    ? 'ethiopianGreen'
                    : 'gondarBlue'
                }
                size='xs'
              >
                {isAdmin() ? 'Admin' : isManager() ? 'Manager' : 'Buyer'}
              </Badge>
            </div>
            <div className='flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400'>
              <span className='flex items-center gap-1'>
                <Mail className='w-4 h-4' />
                {user?.email}
              </span>
              {profile?.phone && (
                <span className='flex items-center gap-1'>
                  <Phone className='w-4 h-4' />
                  {profile.phone}
                </span>
              )}
              {profile?.organization_name && (
                <span className='flex items-center gap-1'>
                  <Building2 className='w-4 h-4' />
                  {profile.organization_name}
                </span>
              )}
            </div>
            <p className='text-xs text-gray-400 dark:text-gray-500 mt-1'>
              Joined {formatDate(profile?.created_at, 'long')}
            </p>
          </div>

          {/* Actions */}
          <div className='flex flex-wrap gap-2'>
            <Button
              variant={isEditing ? 'ethiopianRed' : 'gondarBlue'}
              size='md'
              onClick={() => setIsEditing(!isEditing)}
              leftIcon={
                isEditing ? (
                  <X className='w-4 h-4' />
                ) : (
                  <Edit className='w-4 h-4' />
                )
              }
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Profile Stats */}
      {renderStats()}

      {/* Edit Profile Form */}
      {isEditing && (
        <Card variant='gondarBlue' className='p-5'>
          <h3 className='font-semibold text-gray-900 dark:text-white mb-4'>
            Edit Profile
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Input
              label='Full Name'
              name='full_name'
              value={formData.full_name}
              onChange={handleFormChange}
              placeholder='Your full name'
              error={formErrors.full_name}
              required
              variant='gondarBlue'
              darkMode={false}
            />

            <Input
              label='Phone Number'
              name='phone'
              value={formData.phone}
              onChange={handleFormChange}
              placeholder='0912345678'
              error={formErrors.phone}
              helper='Ethiopian phone number'
              variant='gondarBlue'
              darkMode={false}
            />

            <div className='md:col-span-2'>
              <Input
                label='Organization Name'
                name='organization_name'
                value={formData.organization_name}
                onChange={handleFormChange}
                placeholder='Your organization or cooperative'
                variant='gondarBlue'
                darkMode={false}
              />
            </div>

            <Select
              label='Region'
              name='region'
              options={regionOptions}
              value={formData.region}
              onChange={e => {
                handleFormChange({
                  target: { name: 'region', value: e.target.value }
                })
                handleFormChange({ target: { name: 'district', value: '' } })
              }}
              placeholder='Select your region'
              variant='gondarBlue'
              darkMode={false}
            />

            <Select
              label='District'
              name='district'
              options={districtOptions}
              value={formData.district}
              onChange={e =>
                handleFormChange({
                  target: { name: 'district', value: e.target.value }
                })
              }
              placeholder='Select your district'
              variant='gondarBlue'
              darkMode={false}
              disabled={!formData.region}
            />
          </div>

          <div className='flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
            <Button
              variant='ghost'
              size='md'
              onClick={() => {
                setIsEditing(false)
                setFormData({
                  full_name: profile?.full_name || '',
                  phone: profile?.phone || '',
                  organization_name: profile?.organization_name || '',
                  region: profile?.region || '',
                  district: profile?.district || ''
                })
                setFormErrors({})
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant='gondarBlue'
              size='md'
              onClick={handleProfileUpdate}
              isLoading={isLoading}
              leftIcon={<Save className='w-4 h-4' />}
            >
              Save Changes
            </Button>
          </div>
        </Card>
      )}

      {/* Change Password */}
      <Card variant='snnpPurple' className='p-5'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='font-semibold text-gray-900 dark:text-white'>
              🔒 Change Password
            </h3>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              Update your password to keep your account secure
            </p>
          </div>
          <Button
            variant={isChangingPassword ? 'ethiopianRed' : 'snnpPurple'}
            size='md'
            onClick={() => {
              setIsChangingPassword(!isChangingPassword)
              setPasswordData({
                current_password: '',
                new_password: '',
                confirm_password: ''
              })
              setPasswordErrors({})
            }}
          >
            {isChangingPassword ? 'Cancel' : 'Change Password'}
          </Button>
        </div>

        {isChangingPassword && (
          <div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Input
                label='Current Password'
                type={showCurrentPassword ? 'text' : 'password'}
                name='current_password'
                value={passwordData.current_password}
                onChange={handlePasswordChange}
                placeholder='Enter current password'
                error={passwordErrors.current_password}
                required
                rightIcon={
                  <button
                    type='button'
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className='text-gray-400 hover:text-gray-600 transition-colors'
                    tabIndex='-1'
                  >
                    {showCurrentPassword ? (
                      <EyeOff className='w-4 h-4' />
                    ) : (
                      <Eye className='w-4 h-4' />
                    )}
                  </button>
                }
                variant='snnpPurple'
                darkMode={false}
              />

              <Input
                label='New Password'
                type={showNewPassword ? 'text' : 'password'}
                name='new_password'
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                placeholder='Enter new password (min 8 characters)'
                error={passwordErrors.new_password}
                required
                rightIcon={
                  <button
                    type='button'
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className='text-gray-400 hover:text-gray-600 transition-colors'
                    tabIndex='-1'
                  >
                    {showNewPassword ? (
                      <EyeOff className='w-4 h-4' />
                    ) : (
                      <Eye className='w-4 h-4' />
                    )}
                  </button>
                }
                variant='snnpPurple'
                darkMode={false}
              />

              <div className='md:col-span-2'>
                <Input
                  label='Confirm New Password'
                  type={showConfirmPassword ? 'text' : 'password'}
                  name='confirm_password'
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  placeholder='Confirm new password'
                  error={passwordErrors.confirm_password}
                  required
                  rightIcon={
                    <button
                      type='button'
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className='text-gray-400 hover:text-gray-600 transition-colors'
                      tabIndex='-1'
                    >
                      {showConfirmPassword ? (
                        <EyeOff className='w-4 h-4' />
                      ) : (
                        <Eye className='w-4 h-4' />
                      )}
                    </button>
                  }
                  variant='snnpPurple'
                  darkMode={false}
                />
              </div>
            </div>

            <div className='flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
              <Button
                variant='ghost'
                size='md'
                onClick={() => {
                  setIsChangingPassword(false)
                  setPasswordData({
                    current_password: '',
                    new_password: '',
                    confirm_password: ''
                  })
                  setPasswordErrors({})
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant='snnpPurple'
                size='md'
                onClick={handlePasswordUpdate}
                isLoading={isLoading}
                leftIcon={<Save className='w-4 h-4' />}
              >
                Update Password
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Notification Preferences */}
      <Card variant='oromiaSunset' className='p-5'>
        <h3 className='font-semibold text-gray-900 dark:text-white mb-4'>
          🔔 Notification Preferences
        </h3>
        <div className='space-y-3'>
          {Object.entries(notificationPreferences).map(([key, value]) => (
            <label
              key={key}
              className='flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer'
            >
              <div>
                <p className='font-medium text-gray-700 dark:text-gray-300'>
                  {key
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </p>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  {key === 'email_notifications' &&
                    'Receive notifications via email'}
                  {key === 'sms_notifications' &&
                    'Receive notifications via SMS'}
                  {key === 'in_app_notifications' &&
                    'Receive notifications in the app'}
                  {key === 'marketing_emails' &&
                    'Receive marketing and promotional emails'}
                </p>
              </div>
              <button
                type='button'
                onClick={() => handleNotificationToggle(key)}
                className={`
                  relative w-12 h-6 rounded-full transition-colors duration-200
                  ${value ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}
                `}
              >
                <span
                  className={`
                    absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200
                    ${value ? 'transform translate-x-6' : ''}
                  `}
                />
              </button>
            </label>
          ))}
        </div>
      </Card>

      {/* Danger Zone */}
      <Card variant='ethiopianRed' className='p-5'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='font-semibold text-red-600 dark:text-red-400'>
              ⚠️ Danger Zone
            </h3>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              Permanently delete your account and all associated data
            </p>
          </div>
          <Button
            variant='danger'
            size='md'
            onClick={() => setIsDeleteModalOpen(true)}
            leftIcon={<Trash2 className='w-4 h-4' />}
          >
            Delete Account
          </Button>
        </div>
      </Card>

      {/* Delete Account Confirmation Modal */}
      <Dialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title='Delete Account'
        description='Are you sure you want to delete your account? This action is permanent and cannot be undone. All your data will be permanently removed.'
        variant='ethiopianRed'
        size='sm'
        showConfirm
        showCancel
        confirmText='Yes, Delete My Account'
        cancelText='Cancel'
        onConfirm={handleDeleteAccount}
        onCancel={() => setIsDeleteModalOpen(false)}
        loading={isLoading}
        darkMode={false}
      />
    </div>
  )
}

export default Profile
