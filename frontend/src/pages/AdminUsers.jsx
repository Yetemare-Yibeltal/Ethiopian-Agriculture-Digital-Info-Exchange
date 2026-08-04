// frontend/src/pages/AdminUsers.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  UserCheck,
  UserX,
  Shield,
  Crown,
  User,
  Building2,
  Mail,
  Phone,
  Calendar,
  Clock,
  MoreVertical,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShieldCheck,
  UserCog,
  UserPlus,
  UserMinus,
  Award,
  Star
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { adminService } from '../services/adminService.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import Badge from '../components/ui/Badge.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import Dialog from '../components/ui/Dialog.jsx'
import Pagination from '../components/Pagination.jsx'
import Separator from '../components/ui/Separator.jsx'
import { formatDate, formatTimeAgo, formatNumber } from '../utils/formatters.js'

const AdminUsers = () => {
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const { success, error } = useToast()

  // =============================================
  // STATE
  // =============================================
  const [users, setUsers] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [sortField, setSortField] = useState('created_at')
  const [sortDirection, setSortDirection] = useState('desc')
  const [selectedUser, setSelectedUser] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [editData, setEditData] = useState({
    role: '',
    is_active: true,
    full_name: '',
    phone: '',
    organization_name: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    managers: 0,
    buyers: 0
  })

  const searchTimeoutRef = React.useRef(null)
  const abortControllerRef = React.useRef(null)

  // =============================================
  // ROLE OPTIONS
  // =============================================
  const roleOptions = [
    { label: 'All Roles', value: '' },
    { label: 'Admin', value: 'admin' },
    { label: 'Manager', value: 'manager' },
    { label: 'Buyer', value: 'buyer' }
  ]

  const editRoleOptions = [
    { label: 'Admin', value: 'admin' },
    { label: 'Manager', value: 'manager' },
    { label: 'Buyer', value: 'buyer' }
  ]

  // =============================================
  // FETCH USERS
  // =============================================
  const fetchUsers = useCallback(async () => {
    if (!isAdmin()) {
      navigate('/')
      return
    }

    setIsLoading(true)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      const result = await adminService.getUsers({
        page: currentPage,
        limit: pageSize,
        role: roleFilter || null,
        search: searchQuery || null,
        sort_by: sortField,
        sort_order: sortDirection
      })

      if (result.success) {
        setUsers(result.data || [])
        setTotalCount(result.count || 0)
      } else {
        error(result.error || 'Failed to load users')
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Fetch users error:', err)
        error('Failed to load users')
      }
    } finally {
      setIsLoading(false)
    }
  }, [
    currentPage,
    pageSize,
    roleFilter,
    searchQuery,
    sortField,
    sortDirection,
    isAdmin,
    navigate,
    error
  ])

  // =============================================
  // FETCH STATS
  // =============================================
  const fetchStats = useCallback(async () => {
    try {
      const result = await adminService.getSystemStats()
      if (result.success && result.data) {
        setStats({
          total: result.data.users?.total || 0,
          admins: result.data.users?.admins || 0,
          managers: result.data.users?.managers || 0,
          buyers: result.data.users?.buyers || 0
        })
      }
    } catch (err) {
      console.error('Fetch stats error:', err)
    }
  }, [])

  // =============================================
  // INITIAL FETCH
  // =============================================
  useEffect(() => {
    fetchUsers()
    fetchStats()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [fetchUsers, fetchStats, refreshKey])

  // =============================================
  // HANDLE SEARCH INPUT (debounced)
  // =============================================
  const handleSearchInput = e => {
    const value = e.target.value
    setSearchQuery(value)
    setCurrentPage(1)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchUsers()
    }, 400)
  }

  // =============================================
  // HANDLE ROLE FILTER CHANGE
  // =============================================
  const handleRoleFilterChange = e => {
    setRoleFilter(e.target.value)
    setCurrentPage(1)
    fetchUsers()
  }

  // =============================================
  // HANDLE SORT
  // =============================================
  const handleSort = field => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setCurrentPage(1)
    fetchUsers()
  }

  // =============================================
  // HANDLE EDIT USER
  // =============================================
  const handleEditUser = user => {
    setSelectedUser(user)
    setEditData({
      role: user.role || '',
      is_active: user.is_active !== undefined ? user.is_active : true,
      full_name: user.full_name || '',
      phone: user.phone || '',
      organization_name: user.organization_name || ''
    })
    setIsEditModalOpen(true)
  }

  // =============================================
  // HANDLE UPDATE USER
  // =============================================
  const handleUpdateUser = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)
    try {
      const result = await adminService.updateUser(selectedUser.id, {
        role: editData.role,
        is_active: editData.is_active,
        full_name: editData.full_name,
        phone: editData.phone,
        organization_name: editData.organization_name
      })

      if (result.success) {
        success(result.message || 'User updated successfully')
        setIsEditModalOpen(false)
        setSelectedUser(null)
        setRefreshKey(prev => prev + 1)
        fetchStats()
      } else {
        error(result.error || 'Failed to update user')
      }
    } catch (err) {
      console.error('Update user error:', err)
      error('Failed to update user')
    } finally {
      setIsSubmitting(false)
    }
  }

  // =============================================
  // HANDLE DELETE USER
  // =============================================
  const handleDeleteUser = async () => {
    if (!userToDelete) return

    setIsSubmitting(true)
    try {
      const result = await adminService.deleteUser(userToDelete)

      if (result.success) {
        success(result.message || 'User deleted successfully')
        setIsDeleteModalOpen(false)
        setUserToDelete(null)
        setRefreshKey(prev => prev + 1)
        fetchStats()
      } else {
        error(result.error || 'Failed to delete user')
      }
    } catch (err) {
      console.error('Delete user error:', err)
      error('Failed to delete user')
    } finally {
      setIsSubmitting(false)
    }
  }

  // =============================================
  // HANDLE TOGGLE USER STATUS
  // =============================================
  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const result = await adminService.updateUser(userId, {
        is_active: !currentStatus
      })

      if (result.success) {
        success(
          `User ${currentStatus ? 'deactivated' : 'activated'} successfully`
        )
        setRefreshKey(prev => prev + 1)
        fetchStats()
      } else {
        error(result.error || 'Failed to update user status')
      }
    } catch (err) {
      console.error('Toggle status error:', err)
      error('Failed to update user status')
    }
  }

  // =============================================
  // RENDER STATS CARDS
  // =============================================
  const renderStats = () => {
    const statCards = [
      {
        label: 'Total Users',
        value: stats.total,
        icon: <Users className='w-4 h-4' />,
        color: 'text-gray-500',
        bg: 'bg-gray-50 dark:bg-gray-800/50'
      },
      {
        label: 'Admins',
        value: stats.admins,
        icon: <Shield className='w-4 h-4' />,
        color: 'text-red-500',
        bg: 'bg-red-50 dark:bg-red-900/20'
      },
      {
        label: 'Managers',
        value: stats.managers,
        icon: <UserCog className='w-4 h-4' />,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20'
      },
      {
        label: 'Buyers',
        value: stats.buyers,
        icon: <User className='w-4 h-4' />,
        color: 'text-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-900/20'
      }
    ]

    return (
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
        {statCards.map((stat, index) => (
          <Card
            key={index}
            variant='axumDark'
            className='p-3 text-center hover:shadow-md transition-shadow'
          >
            <div className={`${stat.bg} rounded-lg p-2 inline-block mx-auto`}>
              <span className={stat.color}>{stat.icon}</span>
            </div>
            <p className='text-xl font-bold text-gray-900 dark:text-white mt-1'>
              {stat.value}
            </p>
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              {stat.label}
            </p>
          </Card>
        ))}
      </div>
    )
  }

  // =============================================
  // RENDER TOOLBAR
  // =============================================
  const renderToolbar = () => (
    <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3'>
      <div className='flex-1 w-full sm:w-auto'>
        <Input
          placeholder='Search by name or email...'
          value={searchQuery}
          onChange={handleSearchInput}
          leftIcon={<Search className='w-4 h-4' />}
          variant='gondarBlue'
          darkMode={false}
          className='w-full sm:min-w-[250px]'
        />
      </div>

      <Select
        options={roleOptions}
        value={roleFilter}
        onChange={handleRoleFilterChange}
        placeholder='All Roles'
        variant='gondarBlue'
        darkMode={false}
        className='w-full sm:w-40'
      />

      <Button
        variant='outline'
        size='sm'
        onClick={() => setRefreshKey(prev => prev + 1)}
        leftIcon={<RefreshCw className='w-3.5 h-3.5' />}
      >
        Refresh
      </Button>
    </div>
  )

  // =============================================
  // RENDER TABLE
  // =============================================
  const renderTable = () => {
    if (users.length === 0) {
      return (
        <div className='text-center py-12'>
          <Users className='w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3' />
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
            No users found
          </h3>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            {searchQuery || roleFilter
              ? 'Try adjusting your search or filters'
              : 'No users registered yet'}
          </p>
        </div>
      )
    }

    return (
      <div className='overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='bg-gray-50 dark:bg-gray-800/50'>
              <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                User
              </th>
              <th
                className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors'
                onClick={() => handleSort('role')}
              >
                <div className='flex items-center gap-1'>
                  Role
                  {sortField === 'role' &&
                    (sortDirection === 'asc' ? (
                      <ChevronUp className='w-3 h-3' />
                    ) : (
                      <ChevronDown className='w-3 h-3' />
                    ))}
                </div>
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                Contact
              </th>
              <th
                className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors'
                onClick={() => handleSort('created_at')}
              >
                <div className='flex items-center gap-1'>
                  Joined
                  {sortField === 'created_at' &&
                    (sortDirection === 'asc' ? (
                      <ChevronUp className='w-3 h-3' />
                    ) : (
                      <ChevronDown className='w-3 h-3' />
                    ))}
                </div>
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                Status
              </th>
              <th className='px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 dark:divide-gray-800'>
            {users.map(u => (
              <tr
                key={u.id}
                className='hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors'
              >
                <td className='px-4 py-3'>
                  <div className='flex items-center gap-3'>
                    <Avatar
                      size='sm'
                      name={u.full_name || u.email}
                      variant={
                        u.role === 'admin'
                          ? 'ethiopianRed'
                          : u.role === 'manager'
                          ? 'ethiopianGreen'
                          : 'gondarBlue'
                      }
                    />
                    <div>
                      <p className='font-medium text-gray-900 dark:text-white'>
                        {u.full_name || u.email}
                      </p>
                      <p className='text-xs text-gray-500 dark:text-gray-400'>
                        {u.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className='px-4 py-3'>
                  <Badge
                    variant={
                      u.role === 'admin'
                        ? 'ethiopianRed'
                        : u.role === 'manager'
                        ? 'ethiopianGreen'
                        : 'gondarBlue'
                    }
                    size='sm'
                  >
                    {u.role || 'user'}
                  </Badge>
                  {u.organization_name && (
                    <p className='text-xs text-gray-400 dark:text-gray-500 mt-0.5'>
                      {u.organization_name}
                    </p>
                  )}
                </td>
                <td className='px-4 py-3'>
                  {u.phone && (
                    <div className='flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400'>
                      <Phone className='w-3 h-3' />
                      {u.phone}
                    </div>
                  )}
                  {!u.phone && (
                    <span className='text-xs text-gray-400'>No phone</span>
                  )}
                </td>
                <td className='px-4 py-3 text-xs text-gray-500 dark:text-gray-400'>
                  {formatTimeAgo(u.created_at)}
                </td>
                <td className='px-4 py-3'>
                  <Badge
                    variant={
                      u.is_active !== false ? 'ethiopianGreen' : 'ethiopianRed'
                    }
                    size='sm'
                  >
                    {u.is_active !== false ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className='px-4 py-3 text-right'>
                  <div className='flex items-center justify-end gap-1'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='!p-1.5'
                      onClick={() => handleEditUser(u)}
                      title='Edit user'
                    >
                      <Edit className='w-3.5 h-3.5' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      className={`!p-1.5 ${
                        u.is_active !== false
                          ? 'text-red-500 hover:text-red-600'
                          : 'text-emerald-500 hover:text-emerald-600'
                      }`}
                      onClick={() =>
                        handleToggleStatus(u.id, u.is_active !== false)
                      }
                      title={
                        u.is_active !== false
                          ? 'Deactivate user'
                          : 'Activate user'
                      }
                    >
                      {u.is_active !== false ? (
                        <UserX className='w-3.5 h-3.5' />
                      ) : (
                        <UserCheck className='w-3.5 h-3.5' />
                      )}
                    </Button>
                    {u.id !== user?.id && (
                      <Button
                        variant='ghost'
                        size='sm'
                        className='!p-1.5 text-red-500 hover:text-red-600'
                        onClick={() => {
                          setUserToDelete(u.id)
                          setIsDeleteModalOpen(true)
                        }}
                        title='Delete user'
                      >
                        <Trash2 className='w-3.5 h-3.5' />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // =============================================
  // LOADING STATE
  // =============================================
  if (isLoading && users.length === 0) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <LoadingSpinner
          variant='ethiopianFlag'
          size='lg'
          label='Loading users...'
        />
      </div>
    )
  }

  // =============================================
  // MAIN RENDER
  // =============================================
  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
            👤 User Management
          </h1>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            Manage all users on the platform
          </p>
        </div>
        <Badge variant='gondarBlue' size='sm'>
          {formatNumber(totalCount)} total
        </Badge>
      </div>

      {/* Stats */}
      {renderStats()}

      {/* Toolbar */}
      {renderToolbar()}

      {/* Table */}
      <Card variant='gondarBlue' className='p-0 overflow-hidden'>
        <div className='p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Users className='w-4 h-4 text-gray-400' />
            <span className='text-sm font-medium text-gray-600 dark:text-gray-400'>
              {totalCount} user{totalCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className='text-xs text-gray-400 dark:text-gray-500'>
            Showing {users.length} of {totalCount}
          </div>
        </div>
        {renderTable()}
      </Card>

      {/* Pagination */}
      {totalCount > pageSize && (
        <Pagination
          totalItems={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50, 100]}
          variant='gondarBlue'
          darkMode={false}
          className='mt-4'
        />
      )}

      {/* Edit User Modal */}
      <Dialog
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedUser(null)
          setEditData({
            role: '',
            is_active: true,
            full_name: '',
            phone: '',
            organization_name: ''
          })
        }}
        title='Edit User'
        description={`Manage ${
          selectedUser?.full_name || selectedUser?.email || 'user'
        }'s account`}
        variant='gondarBlue'
        size='md'
        showConfirm
        showCancel
        confirmText='Save Changes'
        cancelText='Cancel'
        onConfirm={handleUpdateUser}
        onCancel={() => {
          setIsEditModalOpen(false)
          setSelectedUser(null)
        }}
        loading={isSubmitting}
        darkMode={false}
      >
        <div className='space-y-4'>
          <div className='flex items-center gap-3'>
            <Avatar
              size='lg'
              name={selectedUser?.full_name || selectedUser?.email}
              variant='ethiopianGreen'
            />
            <div>
              <p className='font-medium text-gray-900 dark:text-white'>
                {selectedUser?.full_name || selectedUser?.email}
              </p>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                {selectedUser?.email}
              </p>
            </div>
          </div>

          <Separator />

          <Input
            label='Full Name'
            value={editData.full_name}
            onChange={e =>
              setEditData({ ...editData, full_name: e.target.value })
            }
            placeholder='Full name'
            variant='gondarBlue'
            darkMode={false}
          />

          <Input
            label='Phone Number'
            value={editData.phone}
            onChange={e => setEditData({ ...editData, phone: e.target.value })}
            placeholder='Phone number'
            variant='gondarBlue'
            darkMode={false}
          />

          <Input
            label='Organization Name'
            value={editData.organization_name}
            onChange={e =>
              setEditData({ ...editData, organization_name: e.target.value })
            }
            placeholder='Organization name'
            variant='gondarBlue'
            darkMode={false}
          />

          <Select
            label='Role'
            value={editData.role}
            onChange={e => setEditData({ ...editData, role: e.target.value })}
            options={editRoleOptions}
            placeholder='Select role'
            variant='gondarBlue'
            darkMode={false}
          />

          <div className='flex items-center gap-3 pt-2'>
            <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
              Status:
            </label>
            <button
              type='button'
              onClick={() =>
                setEditData({ ...editData, is_active: !editData.is_active })
              }
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${
                  editData.is_active
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }
              `}
            >
              {editData.is_active ? 'Active' : 'Inactive'}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Delete User Modal */}
      <Dialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setUserToDelete(null)
        }}
        title='Delete User'
        description='Are you sure you want to delete this user? This action is permanent and cannot be undone. All associated data will be removed.'
        variant='ethiopianRed'
        size='sm'
        showConfirm
        showCancel
        confirmText='Yes, Delete User'
        cancelText='Cancel'
        onConfirm={handleDeleteUser}
        onCancel={() => {
          setIsDeleteModalOpen(false)
          setUserToDelete(null)
        }}
        loading={isSubmitting}
        darkMode={false}
      />
    </div>
  )
}

export default AdminUsers
