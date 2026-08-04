// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './context/AuthContext'

// Layout Components
import Layout from './components/layout/Layout'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ListingForm from './pages/ListingForm'
import ListingDetail from './pages/ListingDetail'
import Search from './pages/Search'
import MyListings from './pages/MyListings'
import MyOffers from './pages/MyOffers'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'

// Admin Pages
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminListings from './pages/AdminListings'

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
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path='/admin/users'
          element={
            <ProtectedRoute>
              <Layout>
                <AdminUsers />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path='/admin/listings'
          element={
            <ProtectedRoute>
              <Layout>
                <AdminListings />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* 404 Page */}
        <Route path='*' element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
