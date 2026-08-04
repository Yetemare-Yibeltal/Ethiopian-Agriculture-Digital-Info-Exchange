// frontend/src/context/AuthContext.jsx
import { create } from 'zustand'
import { supabase } from '../utils/supabase.js'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  // Initialize auth listener
  initAuth: () => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        set({ user: session.user })
        get().fetchProfile(session.user.id)
      } else {
        set({ loading: false })
      }
    })

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        set({ user: session.user })
        get().fetchProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null, loading: false })
      }
    })
  },

  // Fetch user profile
  fetchProfile: async userId => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      set({ profile: data, loading: false })
      return { success: true, data }
    } catch (error) {
      console.error('❌ Profile fetch error:', error.message)
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      set({ loading: true, error: null })

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      if (!data.user) {
        throw new Error('Invalid credentials')
      }

      set({ user: data.user })

      // Fetch profile
      const profileResult = await get().fetchProfile(data.user.id)

      if (!profileResult.success) {
        throw new Error(profileResult.error)
      }

      return { success: true, user: data.user, profile: profileResult.data }
    } catch (error) {
      console.error('❌ Login error:', error.message)
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  // Register user
  register: async userData => {
    try {
      set({ loading: true, error: null })

      const {
        email,
        password,
        full_name,
        phone,
        role,
        organization_name,
        region,
        district
      } = userData

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: full_name || email.split('@')[0],
            role: role || 'buyer',
            phone: phone || null,
            organization_name: organization_name || null,
            region: region || null,
            district: district || null
          }
        }
      })

      if (error) throw error

      set({ loading: false })

      return {
        success: true,
        user: data.user,
        message:
          'Registration successful. Please check your email for verification.'
      }
    } catch (error) {
      console.error('❌ Registration error:', error.message)
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  // Logout user
  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) throw error

      set({ user: null, profile: null, loading: false, error: null })

      return { success: true }
    } catch (error) {
      console.error('❌ Logout error:', error.message)
      set({ error: error.message })
      return { success: false, error: error.message }
    }
  },

  // Update user profile
  updateProfile: async updates => {
    try {
      set({ loading: true, error: null })

      const userId = get().user?.id

      if (!userId) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      set({ profile: data, loading: false })

      return { success: true, data }
    } catch (error) {
      console.error('❌ Profile update error:', error.message)
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  // Check if user has a specific role
  hasRole: role => {
    const { profile } = get()
    if (!profile) return false
    return profile.role === role
  },

  // Check if user is admin
  isAdmin: () => {
    const { profile } = get()
    return profile?.role === 'admin'
  },

  // Check if user is manager
  isManager: () => {
    const { profile } = get()
    return profile?.role === 'manager' || profile?.role === 'admin'
  },

  // Check if user is buyer
  isBuyer: () => {
    const { profile } = get()
    return profile?.role === 'buyer' || profile?.role === 'admin'
  },

  // Get user role
  getRole: () => {
    const { profile } = get()
    return profile?.role || null
  },

  // Get user full name
  getDisplayName: () => {
    const { profile, user } = get()
    return profile?.full_name || user?.email?.split('@')[0] || 'User'
  },

  // Clear error
  clearError: () => {
    set({ error: null })
  },

  // Reset store
  reset: () => {
    set({
      user: null,
      profile: null,
      loading: false,
      error: null
    })
  }
}))

export default useAuthStore
