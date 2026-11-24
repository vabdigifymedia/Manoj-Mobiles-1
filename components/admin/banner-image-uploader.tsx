'use client'

import { useState, useRef, useEffect } from 'react'
import {
  FaCloudArrowUp,
  FaCheck,
  FaTriangleExclamation,
  FaTrashCan,
  FaRotateRight,
  FaImage,
  FaArrowUpFromBracket,
} from 'react-icons/fa6'
import { apiClient } from '@/lib/apiClient'

interface BannerImageUploaderProps {
  label: string
  recommendedSize?: string
  helperText?: string
  existingUrl?: string
  onUploadSuccess: (url: string) => void
  onRemove: () => void
  onUploadingStateChange?: (isUploading: boolean) => void
  onDimensionsDetected?: (dims: { width: number; height: number; aspectRatio: number }) => void
  folder?: string
}

export function BannerImageUploader({
  label,
  recommendedSize,
  helperText,
  existingUrl,
  onUploadSuccess,
  onRemove,
  onUploadingStateChange,
  onDimensionsDetected,
  folder = 'banners',
}: BannerImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>(existingUrl || '')
  const [progress, setProgress] = useState<number>(0)
  const [uploadState, setUploadState] = useState<'IDLE' | 'UPLOADING' | 'SUCCESS' | 'ERROR'>(
    existingUrl ? 'SUCCESS' : 'IDLE'
  )
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [detectedDimensions, setDetectedDimensions] = useState<{
    width: number
    height: number
    aspectRatio: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Automatically detect dimensions when preview URL changes
  useEffect(() => {
    if (!previewUrl) {
      setDetectedDimensions(null)
      return
    }
    const img = new Image()
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        const dims = {
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight,
        }
        setDetectedDimensions(dims)
        onDimensionsDetected?.(dims)
      }
    }
    img.src = previewUrl
  }, [previewUrl, onDimensionsDetected])

  useEffect(() => {
    if (existingUrl && !file) {
      setPreviewUrl(existingUrl)
      setUploadState('SUCCESS')
    }
  }, [existingUrl, file])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const validateFile = (selectedFile: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validTypes.includes(selectedFile.type)) {
      setErrorMessage('Please upload a JPG, PNG, or WEBP image.')
      setUploadState('ERROR')
      return false
    }
    // 10MB limit
    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds 10MB limit. Please choose a smaller image.')
      setUploadState('ERROR')
      return false
    }
    return true
  }

  const handleFileSelect = (selectedFile: File) => {
    setErrorMessage('')
    if (!validateFile(selectedFile)) return

    setFile(selectedFile)
    // Instant local preview
    const localPreview = URL.createObjectURL(selectedFile)
    setPreviewUrl(localPreview)
    uploadFile(selectedFile)
  }

  const uploadFile = async (targetFile: File) => {
    setUploadState('UPLOADING')
    setProgress(0)
    onUploadingStateChange?.(true)

    try {
      const res = await apiClient.uploadImageWithProgress(
        targetFile,
        (percent) => {
          setProgress(percent)
        },
        folder
      )
      const uploadedUrl = res.data.data
      setPreviewUrl(uploadedUrl)
      setUploadState('SUCCESS')
      onUploadSuccess(uploadedUrl)
    } catch (err: unknown) {
      console.error('Image upload failed', err)
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setErrorMessage(axiosErr?.response?.data?.message || 'Upload failed. Please try again.')
      setUploadState('ERROR')
    } finally {
      onUploadingStateChange?.(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleRemove = () => {
    setFile(null)
    setPreviewUrl('')
    setProgress(0)
    setUploadState('IDLE')
    setErrorMessage('')
    setDetectedDimensions(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onRemove()
  }

  const handleTriggerSelect = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
        <label className="text-sm font-bold text-foreground">{label}</label>
        {recommendedSize && (
          <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
            Recommended size: {recommendedSize}
          </span>
        )}
      </div>

      {helperText && <p className="text-xs text-muted-foreground mb-3">{helperText}</p>}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0])
          }
        }}
        className="hidden"
      />

      {/* State A: No image uploaded yet -> Drag & Drop Zone */}
      {uploadState === 'IDLE' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleTriggerSelect}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-border hover:border-primary/50 hover:bg-muted/40 bg-card'
          }`}
        >
          <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
            <FaCloudArrowUp size={26} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">
              Click to upload or drag & drop banner
            </p>
            <p className="text-xs text-muted-foreground">
              Supports JPG, PNG, WEBP up to 10MB • Dimensions are automatically detected
            </p>
          </div>
          <button
            type="button"
            className="mt-1 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <FaArrowUpFromBracket size={12} />
            <span>Select Image File</span>
          </button>
        </div>
      )}

      {/* State B: Uploading, Success or Error -> Preview card with actions */}
      {(uploadState === 'UPLOADING' || uploadState === 'SUCCESS' || uploadState === 'ERROR') && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-sm">
          {/* Image Preview Box with Dynamic Aspect-Ratio */}
          <div
            className="relative w-full rounded-xl overflow-hidden bg-zinc-950 flex items-center justify-center border border-border"
            style={{
              aspectRatio: detectedDimensions ? `${detectedDimensions.aspectRatio}` : '16 / 7',
              maxHeight: '340px',
              minHeight: '120px',
            }}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Banner preview"
                className="w-full h-full object-contain block"
              />
            ) : (
              <div className="text-muted-foreground flex flex-col items-center justify-center p-6">
                <FaImage size={32} className="opacity-40 mb-2" />
                <span className="text-xs">No preview available</span>
              </div>
            )}

            {uploadState === 'UPLOADING' && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                <div className="size-10 border-3 border-white/20 border-t-white rounded-full animate-spin mb-2" />
                <span className="text-xs font-bold">Uploading {progress}%...</span>
              </div>
            )}

            {uploadState === 'SUCCESS' && (
              <div className="absolute top-3 right-3 bg-emerald-500 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
                <FaCheck size={12} /> Upload Complete
              </div>
            )}
          </div>

          {/* Details & Status Bar */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate max-w-[220px] sm:max-w-[320px]">
                  {file ? file.name : 'Uploaded Banner'}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  {file && (
                    <span className="text-[11px] text-muted-foreground font-semibold">
                      {formatFileSize(file.size)}
                    </span>
                  )}
                  {detectedDimensions && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Auto-detected: {detectedDimensions.width} × {detectedDimensions.height}px (Ratio: {detectedDimensions.aspectRatio.toFixed(2)}:1)
                    </span>
                  )}
                </div>
              </div>

              {uploadState === 'SUCCESS' && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 shrink-0">
                  Ready
                </span>
              )}
            </div>

            {/* Real Progress Bar */}
            {uploadState === 'UPLOADING' && (
              <div className="space-y-1.5 bg-muted/30 p-3 rounded-xl border border-border">
                <div className="flex items-center justify-between text-xs font-bold text-primary">
                  <span>Uploading Banner...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {uploadState === 'ERROR' && (
              <div className="text-xs font-semibold text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <FaTriangleExclamation size={14} />
                  <span>Upload Failed</span>
                </div>
                <p className="text-[11px]">{errorMessage}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              {uploadState === 'ERROR' && file && (
                <button
                  type="button"
                  onClick={() => uploadFile(file)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <FaRotateRight size={12} />
                  <span>Try Again</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleTriggerSelect}
                disabled={uploadState === 'UPLOADING'}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
              >
                <FaCloudArrowUp size={12} />
                <span>Replace Image</span>
              </button>

              <button
                type="button"
                onClick={handleRemove}
                disabled={uploadState === 'UPLOADING'}
                className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/20 disabled:opacity-50 transition-colors"
              >
                <FaTrashCan size={12} />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
