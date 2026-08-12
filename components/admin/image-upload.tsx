import React, { useState, useCallback } from 'react'
import { UploadCloud, X } from 'lucide-react'

interface ImageUploadProps {
  value?: string | null
  onChange: (file: File | null, previewUrl: string | null) => void
  label?: string
}

export function ImageUpload({ value, onChange, label = "Upload Image" }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.')
      return
    }
    const previewUrl = URL.createObjectURL(file)
    onChange(file, previewUrl)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }, [onChange])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null, null)
  }

  return (
    <div className="w-full">
      <label className="text-sm font-semibold mb-1 block">{label}</label>
      <div
        className={`relative flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed transition-colors ${
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
            <img src={value} alt="Preview" className="h-full object-contain" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button 
                type="button" 
                onClick={removeImage}
                className="bg-destructive text-destructive-foreground rounded-full p-2 hover:bg-destructive/90"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <UploadCloud size={32} className="mb-2 opacity-50" />
            <p className="text-sm font-medium">Click or drag image to upload</p>
            <p className="text-xs opacity-70 mt-1">SVG, PNG, JPG or GIF</p>
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
    </div>
  )
}
