// frontend/src/pages/Login.jsx
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight, LogIn } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
import Badge from '../components/ui/Badge.jsx'
import { useAuth } from '../hooks/useAuth.js'

const Login = () => {
  const navigate = useNavigate()
  const { login, loading, error: authError, user } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  const handleSubmit = async e => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await login(email, password)
      if (result.success) {
        navigate('/')
      } else {
        setError(result.error || 'Login failed. Please check your credentials.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'>
      <Card
        variant='ethiopianFlag'
        size='md'
        className='w-full max-w-md mx-auto'
        darkMode={false}
      >
        <div className='text-center mb-6'>
          <div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-primary-500 to-emerald-600 text-white text-3xl mb-3 shadow-lg shadow-primary-500/30'>
            🌾
          </div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
            Welcome Back
          </h1>
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
            Sign in to your Ethiopian Agricultural Exchange account
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Email Input */}
          <Input
            label='Email Address'
            type='email'
            placeholder='you@example.com'
            value={email}
            onChange={e => setEmail(e.target.value)}
            leftIcon={<Mail className='w-4 h-4' />}
            required
            autoFocus
            darkMode={false}
            variant='ethiopianGreen'
          />

          {/* Password Input */}
          <Input
            label='Password'
            type={showPassword ? 'text' : 'password'}
            placeholder='••••••••'
            value={password}
            onChange={e => setPassword(e.target.value)}
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
            required
            darkMode={false}
            variant='ethiopianGreen'
          />

          {/* Remember Me & Forgot Password */}
          <div className='flex items-center justify-between'>
            <label className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer'>
              <input
                type='checkbox'
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className='w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500'
              />
              Remember me
            </label>
            <Link
              to='/forgot-password'
              className='text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors'
            >
              Forgot password?
            </Link>
          </div>

          {/* Error Message */}
          {(error || authError) && (
            <div className='p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 flex items-start gap-2'>
              <span className='text-red-500 mt-0.5'>⚠️</span>
              <p className='text-sm text-red-700 dark:text-red-300'>
                {error || authError}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type='submit'
            variant={isLoading ? 'axumDark' : 'ethiopianFlag'}
            size='lg'
            fullWidth
            isLoading={isLoading}
            disabled={isLoading}
            rightIcon={!isLoading && <ArrowRight className='w-4 h-4' />}
            animated
            className='gap-2'
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Divider */}
        <div className='relative my-6'>
          <div className='absolute inset-0 flex items-center'>
            <div className='w-full border-t border-gray-200 dark:border-gray-700' />
          </div>
          <div className='relative flex justify-center text-sm'>
            <span className='px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400'>
              Or continue with
            </span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className='grid grid-cols-2 gap-3 mb-6'>
          <Button
            variant='outline'
            size='md'
            fullWidth
            className='border-gray-300 dark:border-gray-700'
            darkMode={false}
          >
            <span className='text-lg mr-2'>🔵</span>
            Google
          </Button>
          <Button
            variant='outline'
            size='md'
            fullWidth
            className='border-gray-300 dark:border-gray-700'
            darkMode={false}
          >
            <span className='text-lg mr-2'>🐦</span>
            Twitter
          </Button>
        </div>

        {/* Register Link */}
        <div className='text-center'>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            Don't have an account?{' '}
            <Link
              to='/register'
              className='text-primary-600 hover:text-primary-700 font-medium transition-colors'
            >
              Create one now
              <ArrowRight className='w-3.5 h-3.5 inline ml-1' />
            </Link>
          </p>
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

export default Login
