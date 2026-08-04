// frontend/src/components/ImageUpload.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  Upload,
  X,
  Image,
  File,
  AlertCircle,
  CheckCircle,
  Loader2,
  Trash2,
  GripVertical,
  Eye
} from 'lucide-react'
import Button from './ui/Button.jsx'
import Badge from './ui/Badge.jsx'
import { formatFileSize } from '../utils/formatters.js'
import { uploadFile, deleteFile } from '../utils/supabase.js'

const ImageUpload = ({
  label = 'Upload Images',
  accept = 'image/*',
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  bucket = 'listings',
  folder = '',
  value = [],
  onChange,
  onUploadComplete,
  onUploadError,
  disabled = false,
  darkMode = false,
  variant = 'ethiopianGreen',
  className = '',
  multiple = true,
  showPreview = true,
  showProgress = true,
  draggable = true,
  ...props
}) => {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [uploadErrors, setUploadErrors] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)
  const dropRef = useRef(null)

  // =============================================
  // 10 GRADIENT VARIANTS
  // =============================================
  const gradientVariants = {
    ethiopianGreen: 'from-emerald-500 to-green-600',
    ethiopianYellow: 'from-yellow-500 to-amber-500',
    ethiopianRed: 'from-red-600 to-rose-600',
    oromiaSunset: 'from-orange-500 via-pink-500 to-purple-600',
    amharaGold: 'from-amber-500 to-yellow-600',
    gondarBlue: 'from-blue-600 to-indigo-600',
    axumDark: 'from-gray-700 to-gray-900',
    ethiopianFlag: 'from-ethiopia-green via-ethiopia-yellow to-ethiopia-red',
    snnpPurple: 'from-purple-600 to-violet-600',
    tigrayRuby: 'from-rose-600 to-red-700'
  }

  const gradient = gradientVariants[variant] || gradientVariants.ethiopianGreen

  // =============================================
  // VALIDATE FILES
  // =============================================
  const validateFiles = useCallback(
    fileList => {
      const validFiles = []
      const errors = []

      const totalFiles = files.length + fileList.length

      if (totalFiles > maxFiles) {
        errors.push(`Cannot upload more than ${maxFiles} files`)
        return { validFiles, errors }
      }

      for (const file of fileList) {
        // Check file type
        if (!file.type.startsWith('image/')) {
          errors.push(
            `${file.name}: Invalid file type. Only images are allowed.`
          )
          continue
        }

        // Check file size
        if (file.size > maxSize) {
          errors.push(
            `${file.name}: File size exceeds ${formatFileSize(maxSize)} limit.`
          )
          continue
        }

        // Check if already uploaded
        const exists = files.some(
          f => f.name === file.name && f.size === file.size
        )
        if (exists) {
          errors.push(`${file.name}: File already uploaded.`)
          continue
        }

        validFiles.push(file)
      }

      return { validFiles, errors }
    },
    [files, maxFiles, maxSize]
  )

  // =============================================
  // HANDLE FILE SELECTION
  // =============================================
  const handleFiles = useCallback(
    fileList => {
      if (disabled) return

      const { validFiles, errors } = validateFiles(fileList)

      if (errors.length > 0) {
        setUploadErrors(prev => [...prev, ...errors])
        if (onUploadError) onUploadError(errors)
      }

      if (validFiles.length > 0) {
        const newFiles = validFiles.map(file => ({
          file,
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          preview: URL.createObjectURL(file),
          progress: 0,
          status: 'pending', // pending, uploading, success, error
          error: null
        }))

        setFiles(prev => [...prev, ...newFiles])
        if (onChange) onChange([...files, ...newFiles])
      }
    },
    [disabled, validateFiles, files, onChange]
  )

  // =============================================
  // HANDLE DRAG EVENTS
  // =============================================
  const handleDragEnter = useCallback(
    e => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) setDragActive(true)
    },
    [disabled]
  )

  const handleDragLeave = useCallback(e => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDragOver = useCallback(e => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    e => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (disabled) return

      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        handleFiles(files)
      }
    },
    [disabled, handleFiles]
  )

  // =============================================
  // HANDLE FILE INPUT CHANGE
  // =============================================
  const handleFileInput = useCallback(
    e => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFiles(files)
      }
      e.target.value = ''
    },
    [handleFiles]
  )

  // =============================================
  // REMOVE FILE
  // =============================================
  const removeFile = useCallback(
    fileId => {
      setFiles(prev => {
        const fileToRemove = prev.find(f => f.id === fileId)
        if (fileToRemove?.preview) {
          URL.revokeObjectURL(fileToRemove.preview)
        }
        const newFiles = prev.filter(f => f.id !== fileId)
        if (onChange) onChange(newFiles)
        return newFiles
      })
    },
    [onChange]
  )

  // =============================================
  // UPLOAD FILES
  // =============================================
  const uploadFiles = useCallback(async () => {
    if (files.length === 0 || uploading) return

    setUploading(true)
    setUploadErrors([])

    for (const fileObj of files) {
      if (fileObj.status === 'success') continue

      try {
        setFiles(prev =>
          prev.map(f =>
            f.id === fileObj.id ? { ...f, status: 'uploading', error: null } : f
          )
        )

        // Generate file path
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(2, 8)
        const extension = fileObj.file.name.split('.').pop()
        const fileName = `${timestamp}-${random}.${extension}`
        const filePath = folder ? `${folder}/${fileName}` : fileName

        // Upload to Supabase
        const result = await uploadFile(bucket, filePath, fileObj.file)

        if (!result.success) {
          throw new Error(result.error || 'Upload failed')
        }

        setFiles(prev =>
          prev.map(f =>
            f.id === fileObj.id
              ? {
                  ...f,
                  status: 'success',
                  error: null,
                  url: result.data.publicUrl,
                  path: result.data.path
                }
              : f
          )
        )

        if (onUploadComplete) {
          onUploadComplete({
            id: fileObj.id,
            url: result.data.publicUrl,
            path: result.data.path
          })
        }
      } catch (error) {
        setFiles(prev =>
          prev.map(f =>
            f.id === fileObj.id
              ? { ...f, status: 'error', error: error.message }
              : f
          )
        )
        setUploadErrors(prev => [
          ...prev,
          `${fileObj.file.name}: ${error.message}`
        ])
        if (onUploadError) onUploadError([error.message])
      }
    }

    setUploading(false)
  }, [files, uploading, bucket, folder, onUploadComplete, onUploadError])

  // =============================================
  // AUTO-UPLOAD ON FILE ADD
  // =============================================
  useEffect(() => {
    const pendingFiles = files.filter(f => f.status === 'pending')
    if (pendingFiles.length > 0 && !uploading) {
      uploadFiles()
    }
  }, [files, uploading, uploadFiles])

  // =============================================
  // CLEANUP
  // =============================================
  useEffect(() => {
    return () => {
      files.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview)
      })
    }
  }, [])

  // =============================================
  // RENDER FILE STATUS ICON
  // =============================================
  const renderStatusIcon = file => {
    switch (file.status) {
      case 'pending':
        return <Loader2 className='w-4 h-4 animate-spin text-gray-400' />
      case 'uploading':
        return <Loader2 className='w-4 h-4 animate-spin text-primary-500' />
      case 'success':
        return <CheckCircle className='w-4 h-4 text-green-500' />
      case 'error':
        return <AlertCircle className='w-4 h-4 text-red-500' />
      default:
        return null
    }
  }

  // =============================================
  // RENDER DROP ZONE
  // =============================================
  const renderDropZone = () => {
    if (!draggable) return null

    return (
      <div
        ref={dropRef}
        className={`
          relative
          border-2 border-dashed
          rounded-2xl
          p-8
          transition-all duration-300
          text-center
          ${
            dragActive
              ? `border-${variant}-500 bg-${variant}-50 dark:bg-${variant}-900/20`
              : 'border-gray-300 dark:border-gray-700'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${darkMode ? 'text-gray-300' : 'text-gray-600'}
          hover:border-${variant}-400
          hover:bg-${variant}-50/50
          dark:hover:bg-${variant}-900/10
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        {/* Gradient overlay on drag */}
        {dragActive && (
          <div
            className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-10 rounded-2xl`}
          />
        )}

        <div className='relative z-10 flex flex-col items-center gap-3'>
          <div
            className={`
            p-4 rounded-full
            ${
              dragActive
                ? `bg-${variant}-100 dark:bg-${variant}-900/30`
                : 'bg-gray-100 dark:bg-gray-800'
            }
            transition-all duration-300
          `}
          >
            <Upload
              className={`
              w-8 h-8
              ${dragActive ? `text-${variant}-500` : 'text-gray-400'}
            `}
            />
          </div>
          <div>
            <p className='font-medium'>
              {dragActive
                ? 'Drop files here'
                : 'Drag & drop or click to upload'}
            </p>
            <p className='text-sm text-gray-400 dark:text-gray-500'>
              Max {maxFiles} files • {formatFileSize(maxSize)} max each •{' '}
              {accept.replace('image/*', 'Images')}
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type='file'
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={disabled}
          className='hidden'
        />
      </div>
    )
  }

  // =============================================
  // RENDER FILE PREVIEW
  // =============================================
  const renderFilePreview = () => {
    if (!showPreview || files.length === 0) return null

    return (
      <div className='mt-4'>
        <div className='flex items-center justify-between mb-3'>
          <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
            {files.length} file{files.length > 1 ? 's' : ''} selected
          </span>
          <Badge variant={variant} size='sm'>
            {files.filter(f => f.status === 'success').length} uploaded
          </Badge>
        </div>

        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
          {files.map(file => (
            <div
              key={file.id}
              className={`
                relative
                rounded-xl
                overflow-hidden
                bg-gray-100 dark:bg-gray-800
                aspect-square
                group
                transition-all duration-300
                ${file.status === 'error' ? 'ring-2 ring-red-500' : ''}
                ${file.status === 'success' ? 'ring-1 ring-green-500/30' : ''}
              `}
            >
              {/* Image Preview */}
              {file.preview && (
                <img
                  src={file.preview}
                  alt={file.file.name}
                  className='w-full h-full object-cover'
                />
              )}

              {/* Status Overlay */}
              <div
                className={`
                absolute inset-0
                flex items-center justify-center
                bg-black/40
                transition-opacity duration-300
                ${
                  file.status === 'uploading'
                    ? 'opacity-100'
                    : 'opacity-0 group-hover:opacity-100'
                }
              `}
              >
                {renderStatusIcon(file)}
                {file.status === 'uploading' && (
                  <div className='absolute bottom-2 left-2 right-2'>
                    <div className='w-full h-1 bg-white/20 rounded-full overflow-hidden'>
                      <div
                        className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-300`}
                        style={{ width: `${file.progress || 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {file.status === 'error' && file.error && (
                <div className='absolute bottom-0 left-0 right-0 p-1 bg-red-500/90'>
                  <p className='text-[10px] text-white truncate'>
                    {file.error}
                  </p>
                </div>
              )}

              {/* Delete Button */}
              <button
                onClick={e => {
                  e.stopPropagation()
                  removeFile(file.id)
                }}
                className={`
                  absolute top-1 right-1
                  p-1
                  rounded-full
                  bg-black/50 backdrop-blur-sm
                  text-white/70
                  transition-all duration-300
                  hover:bg-red-500 hover:text-white
                  hover:scale-110
                  ${
                    file.status === 'uploading'
                      ? 'opacity-0 pointer-events-none'
                      : 'opacity-0 group-hover:opacity-100'
                  }
                `}
              >
                <Trash2 className='w-3 h-3' />
              </button>

              {/* File Name */}
              <div className='absolute bottom-0 left-0 right-0 p-1 bg-black/50 backdrop-blur-sm'>
                <p className='text-[10px] text-white truncate'>
                  {file.file.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // =============================================
  // RENDER ERRORS
  // =============================================
  const renderErrors = () => {
    if (uploadErrors.length === 0) return null

    return (
      <div className='mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800'>
        <div className='flex items-start gap-2'>
          <AlertCircle className='w-4 h-4 text-red-500 mt-0.5 flex-shrink-0' />
          <div>
            <p className='text-sm font-medium text-red-700 dark:text-red-300'>
              Upload Errors
            </p>
            <ul className='mt-1 text-xs text-red-600 dark:text-red-400 list-disc list-inside'>
              {uploadErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full ${className}`} {...props}>
      {/* Label */}
      {label && (
        <label
          className={`
          block text-sm font-medium mb-2
          ${darkMode ? 'text-gray-200' : 'text-gray-700'}
        `}
        >
          {label}
        </label>
      )}

      {/* Drop Zone */}
      {renderDropZone()}

      {/* File Preview */}
      {renderFilePreview()}

      {/* Errors */}
      {renderErrors()}
    </div>
  )
}

ImageUpload.displayName = 'ImageUpload'

export default ImageUpload
