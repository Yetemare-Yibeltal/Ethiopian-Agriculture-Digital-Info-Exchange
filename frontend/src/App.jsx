// frontend/src/App.jsx
import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './context/AuthContext.jsx'

// Layout Components
import Layout from './components/layout/Layout.jsx'
import AdminLayout from './components/layout/AdminLayout.jsx'

// Pages
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ListingForm from './pages/ListingForm.jsx'
import ListingDetail from './pages/ListingDetail.jsx'
import Search from './pages/Search.jsx'
import MyListings from './pages/MyListings.jsx'
import MyOffers from './pages/MyOffers.jsx'
import Profile from './pages/Profile.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminUsers from './pages/AdminUsers.jsx'
import AdminListings from './pages/AdminListings.jsx'
import NotFound from './pages/NotFound.jsx'

function ProtectedRoute ({ children }) {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-700'></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to='/login' />
  }

  return children
}

function App () {
  const { initAuth } = useAuthStore()

  useEffect(() => {
    initAuth() // ✅ Initialize auth listener on app start
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />

        {/* Protected Routes */}
        <Route
          path='/'
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path='/new-listing'
          element={
            <ProtectedRoute>
              <Layout>
                <ListingForm />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/new-listing/:id'
          element={
            <ProtectedRoute>
              <Layout>
                <ListingForm />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path='/listings/:id'
          element={
            <ProtectedRoute>
              <Layout>
                <ListingDetail />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path='/search'
          element={
            <ProtectedRoute>
              <Layout>
                <Search />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path='/my-listings'
          element={
            <ProtectedRoute>
              <Layout>
                <MyListings />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path='/my-offers'
          element={
            <ProtectedRoute>
              <Layout>
                <MyOffers />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path='/profile'
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path='/admin'
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path='/admin/users'
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminUsers />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path='/admin/listings'
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminListings />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path='*' element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
