"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Upload } from "lucide-react"
import { classed } from "@tw-classed/react"
import { Button } from "@/components/ui/Button"

const ImagePreview = classed.div(
  "size-[84px] rounded-full border border-dashed border-gray duration-200 flex items-center justify-center cursor-pointer bg-white-light hover:bg-white-dark transition-colors overflow-hidden",
)

interface FileUploaderProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSize?: number
}

export const FileUploader = ({ onFileSelect, accept = "image/*", maxSize }: FileUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]

      if (maxSize && file.size > maxSize) {
        alert(`File size must be less than ${maxSize / (1024 * 1024)}MB`)
        return
      }

      setSelectedFile(file)
      onFileSelect(file)

      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      } else {
        setPreviewUrl(null)
      }
    }
  }

  const handleCircleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex items-center gap-4">
      <ImagePreview onClick={handleCircleClick}>
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <Upload className="size-4 text-black" />
        )}
      </ImagePreview>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="sr-only"
            id="file-upload"
            accept={accept}
          />
          <label
            htmlFor="file-upload"
            className="flex items-center w-full px-3 py-1 text-sm rounded-md border border-[#E4E4E7] cursor-pointer gap-2 lg:min-w-[370px]"
          >
            <span className="font-medium text-base-foreground">Choose file</span>
            <span className="text-base-foreground font-normal">
              {selectedFile ? selectedFile.name : "No file chosen"}
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}
