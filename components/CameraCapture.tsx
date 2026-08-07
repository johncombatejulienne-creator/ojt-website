'use client'

import React, { useRef, useState, useCallback } from 'react'
import { Button } from './ui/Button'
import { Camera, X, Upload, Image as ImageIcon } from 'lucide-react'

interface CapturedImage {
  url: string
  file: File
}

interface CameraCaptureProps {
  onImagesChange: (images: CapturedImage[]) => void
  maxImages?: number
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onImagesChange,
  maxImages = 10,
}) => {
  const [images, setImages] = useState<CapturedImage[]>([])
  const [isCamera, setIsCamera] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setIsCamera(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Could not access camera. Please check permissions.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsCamera(false)
  }, [stream])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)

    canvas.toBlob((blob) => {
      if (!blob) return

      const file = new File(
        [blob],
        `capture-${Date.now()}.jpg`,
        { type: 'image/jpeg' }
      )
      const url = URL.createObjectURL(blob)

      const newImage = { url, file }
      const updatedImages = [...images, newImage]
      setImages(updatedImages)
      onImagesChange(updatedImages)
    }, 'image/jpeg', 0.9)
  }, [images, onImagesChange])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newImages: CapturedImage[] = []

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)
        newImages.push({ url, file })
      }
    })

    const updatedImages = [...images, ...newImages].slice(0, maxImages)
    setImages(updatedImages)
    onImagesChange(updatedImages)
  }, [images, maxImages, onImagesChange])

  const removeImage = useCallback((index: number) => {
    const updatedImages = images.filter((_, i) => i !== index)
    setImages(updatedImages)
    onImagesChange(updatedImages)
    URL.revokeObjectURL(images[index].url)
  }, [images, onImagesChange])

  React.useEffect(() => {
    return () => {
      stopCamera()
      images.forEach(img => URL.revokeObjectURL(img.url))
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        {!isCamera && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={startCamera}
              disabled={images.length >= maxImages}
            >
              <Camera className="w-4 h-4 mr-2" />
              Open Camera
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length >= maxImages}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Photos
            </Button>
          </>
        )}
        {isCamera && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={stopCamera}
          >
            <X className="w-4 h-4 mr-2" />
            Close Camera
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {isCamera && (
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto"
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <Button
              type="button"
              onClick={capturePhoto}
              disabled={images.length >= maxImages}
              size="lg"
            >
              <Camera className="w-5 h-5 mr-2" />
              Capture Photo
            </Button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Captured Photos ({images.length}/{maxImages})
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((image, index) => (
              <div
                key={index}
                className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200"
              >
                <img
                  src={image.url}
                  alt={`Captured ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
