// frontend/src/pages/Register.jsx
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  Lock,
  Phone,
  Building2,
  MapPin,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  UserCheck,
  ShoppingBag,
  Shield
} from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import Badge from '../components/ui/Badge.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../components/ui/useToast.js'
import { ETHIOPIAN_REGIONS } from '../utils/constants.js'
import {
  validatePasswordStrength,
  validateEthiopianPhone
} from '../utils/validators.js'

const Register = () => {
  const navigate = useNavigate()
  const { register, loading: authLoading, user } = useAuth()
  const { success, error: toastError } = useToast()

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    role: 'buyer',
    organization_name: '',
    region: '',
    district: '',
    terms: false
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: 'Weak',
    color: 'red'
  })

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  // =============================================
  // PASSWORD STRENGTH CHECK
  // =============================================
  useEffect(() => {
    if (formData.password) {
      const result = validatePasswordStrength(formData.password)
      setPasswordStrength(result)
    } else {
      setPasswordStrength({ score: 0, label: 'Weak', color: 'red' })
    }
  }, [formData.password])

  // =============================================
  // HANDLE INPUT CHANGE
  // =============================================
  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // =============================================
  // HANDLE ROLE CHANGE
  // =============================================
  const handleRoleChange = e => {
    const role = e.target.value
    setFormData(prev => ({
      ...prev,
      role,
      organization_name: role === 'buyer' ? prev.organization_name : ''
    }))
  }

  // =============================================
  // VALIDATE FORM
  // =============================================
  const validateForm = () => {
    const newErrors = {}

    if (!formData.full_name || formData.full_name.length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters'
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    const phoneValidation = validateEthiopianPhone(formData.phone)
    if (!phoneValidation.valid) {
      newErrors.phone = phoneValidation.error
    }

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match'
    }

    if (!formData.role) {
      newErrors.role = 'Please select a role'
    }

    if (formData.role === 'manager' && !formData.organization_name) {
      newErrors.organization_name = 'Organization name is required for managers'
    }

    if (!formData.terms) {
      newErrors.terms = 'You must accept the terms and conditions'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // =============================================
  // HANDLE SUBMIT
  // =============================================
  const handleSubmit = async e => {
    e.preventDefault()

    if (!validateForm()) {
      toastError('Please fix the errors before submitting.')
      return
    }

    setIsLoading(true)

    try {
      const result = await register({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: formData.role,
        organization_name: formData.organization_name || null,
        region: formData.region || null,
        district: formData.district || null
      })

      if (result.success) {
        success(
          result.message ||
            'Registration successful! Please check your email for verification.'
        )
        navigate('/login')
      } else {
        toastError(result.error || 'Registration failed. Please try again.')
      }
    } catch (err) {
      toastError(err.message || 'An error occurred during registration.')
    } finally {
      setIsLoading(false)
    }
  }

  // =============================================
  // RENDER PASSWORD STRENGTH
  // =============================================
  const renderPasswordStrength = () => {
    const colors = {
      red: 'bg-red-500',
      orange: 'bg-orange-500',
      yellow: 'bg-yellow-500',
      green: 'bg-green-500'
    }

    return (
      <div className='mt-1'>
        <div className='flex gap-1 h-1.5'>
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all duration-300 ${
                i <= passwordStrength.score
                  ? colors[passwordStrength.color]
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
        <div className='flex justify-between mt-0.5'>
          <span
            className={`text-xs font-medium ${
              passwordStrength.score <= 1
                ? 'text-red-500'
                : passwordStrength.score === 2
                ? 'text-orange-500'
                : passwordStrength.score === 3
                ? 'text-yellow-500'
                : 'text-green-500'
            }`}
          >
            {passwordStrength.label}
          </span>
          <span className='text-xs text-gray-400 dark:text-gray-500'>
            {formData.password.length > 0
              ? `${formData.password.length}/8+`
              : ''}
          </span>
        </div>
      </div>
    )
  }

  // =============================================
  // DISTRICT OPTIONS (based on selected region)
  // =============================================
  const getDistrictOptions = () => {
    const districtMap = {
      'Addis Ababa': [
        'Bole',
        'Kirkos',
        'Lideta',
        'Addis Ketema',
        'Arada',
        'Gulele',
        'Yeka',
        'Kolfe',
        'Nifas Silk',
        'Akaki'
      ],
      Oromia: [
        'Arsi',
        'Bale',
        'Borana',
        'East Hararghe',
        'West Hararghe',
        'Jimma',
        'Shaw',
        'Wollega'
      ],
      Amhara: [
        'South Gondar',
        'North Gondar',
        'South Wollo',
        'North Wollo',
        'Awi',
        'East Gojjam',
        'West Gojjam'
      ],
      Tigray: ['Mekelle', 'Adwa', 'Axum', 'Adigrat', 'Shire', 'Alamata'],
      SNNP: ['Hawassa', 'Arba Minch', 'Wolaita Sodo', 'Hossana', 'Aleta Wondo']
    }
    return districtMap[formData.region] || []
  }

  // =============================================
  // REGION OPTIONS
  // =============================================
  const regionOptions = ETHIOPIAN_REGIONS.map(region => ({
    label: region,
    value: region
  }))

  const districtOptions = getDistrictOptions().map(district => ({
    label: district,
    value: district
  }))

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'>
      <Card
        variant='ethiopianFlag'
        size='md'
        className='w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto'
        darkMode={false}
      >
        <div className='text-center mb-6'>
          <div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-primary-500 to-emerald-600 text-white text-3xl mb-3 shadow-lg shadow-primary-500/30'>
            🌾
          </div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
            Create Account
          </h1>
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
            Join the Ethiopian Agricultural Digital Exchange
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Full Name */}
          <Input
            label='Full Name'
            type='text'
            name='full_name'
            placeholder='John Doe'
            value={formData.full_name}
            onChange={handleChange}
            leftIcon={<User className='w-4 h-4' />}
            error={errors.full_name}
            required
            autoFocus
            darkMode={false}
            variant='ethiopianGreen'
          />

          {/* Email */}
          <Input
            label='Email Address'
            type='email'
            name='email'
            placeholder='you@example.com'
            value={formData.email}
            onChange={handleChange}
            leftIcon={<Mail className='w-4 h-4' />}
            error={errors.email}
            required
            darkMode={false}
            variant='ethiopianGreen'
          />

          {/* Phone */}
          <Input
            label='Phone Number'
            type='tel'
            name='phone'
            placeholder='0912345678'
            value={formData.phone}
            onChange={handleChange}
            leftIcon={<Phone className='w-4 h-4' />}
            error={errors.phone}
            required
            darkMode={false}
            variant='ethiopianGreen'
            helper='Enter Ethiopian phone number (e.g., 0912345678)'
          />

          {/* Password */}
          <Input
            label='Password'
            type={showPassword ? 'text' : 'password'}
            name='password'
            placeholder='••••••••'
            value={formData.password}
            onChange={handleChange}
            leftIcon={<Lock className='w-4 h-4' />}
            rightIcon={
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='text-gray-400 hover:text-gray-600 transition-colors'
                tabIndex='-1'
              >
                {showPassword ? (
                  <EyeOff className='w-4 h-4' />
                ) : (
                  <Eye className='w-4 h-4' />
                )}
              </button>
            }
            error={errors.password}
            required
            darkMode={false}
            variant='ethiopianGreen'
            helper={<div className='mt-1'>{renderPasswordStrength()}</div>}
          />

          {/* Confirm Password */}
          <Input
            label='Confirm Password'
            type={showConfirmPassword ? 'text' : 'password'}
            name='confirm_password'
            placeholder='••••••••'
            value={formData.confirm_password}
            onChange={handleChange}
            leftIcon={<Lock className='w-4 h-4' />}
            rightIcon={
              <button
                type='button'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
            error={errors.confirm_password}
            required
            darkMode={false}
            variant='ethiopianGreen'
          />

          {/* Role Selection */}
          <div className='space-y-2'>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              I want to join as
            </label>
            <div className='grid grid-cols-2 gap-3'>
              <button
                type='button'
                onClick={() => {
                  setFormData(prev => ({ ...prev, role: 'manager' }))
                  setErrors(prev => ({ ...prev, role: '' }))
                }}
                className={`
                  p-3 rounded-xl border-2 text-center transition-all duration-200
                  ${
                    formData.role === 'manager'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg shadow-primary-500/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  }
                `}
              >
                <Building2
                  className={`w-6 h-6 mx-auto mb-1 ${
                    formData.role === 'manager'
                      ? 'text-primary-500'
                      : 'text-gray-400'
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    formData.role === 'manager'
                      ? 'text-primary-700 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Manager
                </span>
                <p className='text-xs text-gray-400 dark:text-gray-500'>
                  Register farmers & manage listings
                </p>
              </button>

              <button
                type='button'
                onClick={() => {
                  setFormData(prev => ({ ...prev, role: 'buyer' }))
                  setErrors(prev => ({ ...prev, role: '' }))
                }}
                className={`
                  p-3 rounded-xl border-2 text-center transition-all duration-200
                  ${
                    formData.role === 'buyer'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg shadow-primary-500/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  }
                `}
              >
                <ShoppingBag
                  className={`w-6 h-6 mx-auto mb-1 ${
                    formData.role === 'buyer'
                      ? 'text-primary-500'
                      : 'text-gray-400'
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    formData.role === 'buyer'
                      ? 'text-primary-700 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Buyer
                </span>
                <p className='text-xs text-gray-400 dark:text-gray-500'>
                  Find & purchase agricultural products
                </p>
              </button>
            </div>
            {errors.role && (
              <p className='text-sm text-red-500'>{errors.role}</p>
            )}
          </div>

          {/* Organization Name (for Managers) */}
          {formData.role === 'manager' && (
            <Input
              label='Organization Name'
              type='text'
              name='organization_name'
              placeholder='Your Cooperative or Organization'
              value={formData.organization_name}
              onChange={handleChange}
              leftIcon={<Building2 className='w-4 h-4' />}
              error={errors.organization_name}
              required
              darkMode={false}
              variant='ethiopianGreen'
            />
          )}

          {/* Region */}
          <Select
            label='Region'
            name='region'
            options={regionOptions}
            value={formData.region}
            onChange={handleChange}
            placeholder='Select your region'
            darkMode={false}
            variant='ethiopianGreen'
          />

          {/* District */}
          {formData.region && (
            <Select
              label='District'
              name='district'
              options={districtOptions}
              value={formData.district}
              onChange={handleChange}
              placeholder='Select your district'
              darkMode={false}
              variant='ethiopianGreen'
            />
          )}

          {/* Terms and Conditions */}
          <div className='flex items-start gap-2 pt-2'>
            <input
              type='checkbox'
              name='terms'
              checked={formData.terms}
              onChange={handleChange}
              className='mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500'
            />
            <div>
              <label className='text-sm text-gray-600 dark:text-gray-400'>
                I agree to the{' '}
                <Link
                  to='/terms'
                  className='text-primary-600 hover:text-primary-700 font-medium'
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  to='/privacy'
                  className='text-primary-600 hover:text-primary-700 font-medium'
                >
                  Privacy Policy
                </Link>
              </label>
              {errors.terms && (
                <p className='text-sm text-red-500'>{errors.terms}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type='submit'
            variant='ethiopianFlag'
            size='lg'
            fullWidth
            isLoading={isLoading || authLoading}
            disabled={isLoading || authLoading}
            rightIcon={
              !isLoading && !authLoading && <ArrowRight className='w-4 h-4' />
            }
            animated
            className='gap-2'
          >
            {isLoading || authLoading
              ? 'Creating Account...'
              : 'Create Account'}
          </Button>
        </form>

        {/* Divider */}
        <div className='relative my-6'>
          <div className='absolute inset-0 flex items-center'>
            <div className='w-full border-t border-gray-200 dark:border-gray-700' />
          </div>
          <div className='relative flex justify-center text-sm'>
            <span className='px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400'>
              Already have an account?
            </span>
          </div>
        </div>

        {/* Login Link */}
        <div className='text-center'>
          <Link
            to='/login'
            className='inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors'
          >
            Sign in instead
            <ArrowRight className='w-3.5 h-3.5' />
          </Link>
        </div>

        {/* Version Badge */}
        <div className='absolute bottom-4 right-4 opacity-30'>
          <Badge variant='axumDark' size='sm'>
            v1.0.0
          </Badge>
        </div>
      </Card>
    </div>
  )
}

export default Register
