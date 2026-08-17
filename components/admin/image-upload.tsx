'use client'

import React, { useState, useCallback } from 'react'
import { FaXmark, FaCrop, FaCloudArrowUp } from 'react-icons/fa6'
import { ImageCropperModal } from './image-cropper-modal'

interface ImageUploadProps {
  value?: string | null
  onChange: (file: File | null, previewUrl: string | null) => void
  label?: string
  aspectRatio?: number // e.g. 16/9 or 2/1
  enableCrop?: boolean
}

export function ImageUpload({
  value,
  onChange,
  label = "Upload Image",
  aspectRatio = 16 / 9,
  enableCrop = true,
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [rawImageForCrop, setRawImageForCrop] = useState<string | null>(null)
  
  // SVG handling
  const [isSvg, setIsSvg] = useState(false)
  const [originalSvgText, setOriginalSvgText] = useState<string | null>(null)
  const [svgFileName, setSvgFileName] = useState<string>('image.svg')

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  // Helper to convert SVG text to PNG File
  const convertSvgToPng = (svgText: string, fileName: string): Promise<{ file: File, url: string }> => {
    return new Promise((resolve) => {
      const blob = new Blob([svgText], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        // Scale up to ensure high quality (e.g., max 1024px)
        const scale = Math.max(1, 1024 / Math.max(img.width || 1024, img.height || 1024))
        canvas.width = (img.width || 512) * scale
        canvas.height = (img.height || 512) * scale
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          canvas.toBlob((pngBlob) => {
            if (pngBlob) {
              const newFile = new File([pngBlob], fileName.replace(/\.svg$/i, '.png'), { type: 'image/png' })
              const newUrl = URL.createObjectURL(pngBlob)
              resolve({ file: newFile, url: newUrl })
            }
          }, 'image/png')
        }
      }
      // Trigger load
      img.src = url
    })
  }

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.')
      return
    }
    
    if (file.type === 'image/svg+xml') {
      setIsSvg(true)
      setSvgFileName(file.name)
      const text = await file.text()
      setOriginalSvgText(text)
      
      // Convert to PNG immediately for the initial upload
      const { file: pngFile, url: pngUrl } = await convertSvgToPng(text, file.name)
      if (enableCrop) {
        setRawImageForCrop(pngUrl)
      } else {
        onChange(pngFile, pngUrl)
      }
      return
    }

    setIsSvg(false)
    setOriginalSvgText(null)
    const rawUrl = URL.createObjectURL(file)
    if (enableCrop) {
      setRawImageForCrop(rawUrl)
    } else {
      onChange(file, rawUrl)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }, [enableCrop, onChange])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
    // reset input value so re-uploading same file triggers change
    e.target.value = ''
  }

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null, null)
  }

  const handleOpenEditCrop = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (value) {
      setRawImageForCrop(value)
    }
  }

  const handleCropComplete = (croppedFile: File, previewUrl: string) => {
    setRawImageForCrop(null)
    onChange(croppedFile, previewUrl)
  }

  const applySvgColor = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    if (!originalSvgText) return

    let newText = originalSvgText
      .replace(/fill="(?!(none|transparent))[^"]+"/gi, `fill="${color}"`)
      .replace(/stroke="(?!(none|transparent))[^"]+"/gi, `stroke="${color}"`)
      .replace(/fill:(?!(none|transparent))[^;"]+/gi, `fill:${color}`)
      .replace(/stroke:(?!(none|transparent))[^;"]+/gi, `stroke:${color}`)

    // If the SVG didn't have explicit fills, we inject a style to force it
    if (newText === originalSvgText) {
      const styleInjection = `<style>path, rect, circle, polygon, line, polyline, ellipse { fill: ${color} !important; }</style>`
      newText = newText.replace(/(<svg[^>]*>)/i, `$1${styleInjection}`)
    }

    const { file: pngFile, url: pngUrl } = await convertSvgToPng(newText, svgFileName)
    onChange(pngFile, pngUrl)
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-semibold block">{label}</label>
        {enableCrop && (
          <span className="text-[11px] text-muted-foreground font-medium">
            Aspect Ratio: {aspectRatio.toFixed(2)}:1
          </span>
        )}
      </div>

      <div
        className={`relative flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed transition-colors ${
          dragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:bg-muted/50'
        } ${value ? 'border-solid p-2 border-border/50' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !value && document.getElementById('image-upload')?.click()}
      >
        {value ? (
          <div className="relative w-full h-full flex items-center justify-center bg-background rounded-lg overflow-hidden group">
            <img src={value} alt="Preview" className="h-full max-w-full object-contain" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {isSvg && (
                <div className="relative overflow-hidden cursor-pointer bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 shadow-md">
                  <div className="absolute inset-0 opacity-0 cursor-pointer">
                    <input type="color" className="w-full h-full cursor-pointer" onChange={applySvgColor} />
                  </div>
                  <span>🎨 Color</span>
                </div>
              )}
              {enableCrop && (
                <button
                  type="button"
                  onClick={handleOpenEditCrop}
                  title="Crop / Adjust Image"
                  className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 shadow-md"
                >
                  <FaCrop size={14} /> Crop
                </button>
              )}
              <button
                type="button"
                onClick={removeImage}
                title="Remove Image"
                className="bg-destructive text-destructive-foreground rounded-lg p-1.5 hover:bg-destructive/90 shadow-md"
              >
                <FaXmark size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <FaCloudArrowUp size={30} className="mb-1.5 text-primary opacity-80" />
            <p className="text-xs font-semibold text-foreground">Click or drag image to upload</p>
            <p className="text-[11px] opacity-70 mt-0.5">PNG, JPG, WEBP • Cropper will open</p>
          </div>
        )}
        <input
          id="image-upload"
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleChange}
        />
      </div>

      {/* Cropper Modal */}
      {rawImageForCrop && (
        <ImageCropperModal
          imageSrc={rawImageForCrop}
          aspectRatio={aspectRatio}
          onCrop={handleCropComplete}
          onCancel={() => setRawImageForCrop(null)}
          title={`Crop Image (${aspectRatio.toFixed(2)}:1)`}
        />
      )}
    </div>
  )
}
