// frontend/src/context/AuthContext.jsx
import { create } from 'zustand'
import { supabase } from '../utils/supabase.js'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  // ✅ ADD THIS FUNCTION
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

  login: async (email, password) => {
    try {
      set({ loading: true, error: null })
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      if (!data.user) throw new Error('Invalid credentials')
      set({ user: data.user })
      const profileResult = await get().fetchProfile(data.user.id)
      if (!profileResult.success) throw new Error(profileResult.error)
      return { success: true, user: data.user, profile: profileResult.data }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

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
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      set({ user: null, profile: null, loading: false, error: null })
      return { success: true }
    } catch (error) {
      set({ error: error.message })
      return { success: false, error: error.message }
    }
  },

  updateProfile: async updates => {
    try {
      set({ loading: true, error: null })
      const userId = get().user?.id
      if (!userId) throw new Error('User not authenticated')
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
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  hasRole: role => get().profile?.role === role,
  isAdmin: () => get().profile?.role === 'admin',
  isManager: () =>
    get().profile?.role === 'manager' || get().profile?.role === 'admin',
  isBuyer: () =>
    get().profile?.role === 'buyer' || get().profile?.role === 'admin',
  getRole: () => get().profile?.role || null,
  getDisplayName: () =>
    get().profile?.full_name || get().user?.email?.split('@')[0] || 'User',
  clearError: () => set({ error: null }),
  reset: () => set({ user: null, profile: null, loading: false, error: null })
}))
