import crypto from 'crypto'
import sharp from 'sharp'

export interface PhotoMetadata {
  captureTimestamp?: Date
  deviceInfo?: string
  gpsLatitude?: number
  gpsLongitude?: number
  cameraModel?: string
  imageHash: string
  exifData?: any
}

export async function extractPhotoMetadata(
  imageBuffer: Buffer
): Promise<PhotoMetadata> {
  try {
    // Get image hash for integrity verification
    const imageHash = crypto
      .createHash('sha256')
      .update(imageBuffer)
      .digest('hex')

    // Extract EXIF metadata using sharp
    const metadata = await sharp(imageBuffer).metadata()
    
    const exifData = metadata.exif
      ? parseExifBuffer(metadata.exif)
      : {}

    // Extract capture timestamp
    let captureTimestamp: Date | undefined
    if (exifData.DateTimeOriginal) {
      captureTimestamp = parseExifDate(exifData.DateTimeOriginal)
    } else if (exifData.DateTime) {
      captureTimestamp = parseExifDate(exifData.DateTime)
    }

    // Extract GPS coordinates
    let gpsLatitude: number | undefined
    let gpsLongitude: number | undefined
    
    if (exifData.GPSLatitude && exifData.GPSLongitude) {
      gpsLatitude = convertGPSToDecimal(
        exifData.GPSLatitude,
        exifData.GPSLatitudeRef
      )
      gpsLongitude = convertGPSToDecimal(
        exifData.GPSLongitude,
        exifData.GPSLongitudeRef
      )
    }

    // Extract camera/device info
    const cameraModel = exifData.Model || exifData.Make || undefined
    const deviceInfo = [exifData.Make, exifData.Model]
      .filter(Boolean)
      .join(' ') || undefined

    return {
      captureTimestamp,
      deviceInfo,
      gpsLatitude,
      gpsLongitude,
      cameraModel,
      imageHash,
      exifData: JSON.stringify(exifData),
    }
  } catch (error) {
    console.error('Error extracting photo metadata:', error)
    
    // Return minimal metadata with hash
    const imageHash = crypto
      .createHash('sha256')
      .update(imageBuffer)
      .digest('hex')
    
    return {
      imageHash,
    }
  }
}

function parseExifBuffer(buffer: Buffer): any {
  // Simple EXIF parsing - in production, use a library like exif-parser
  try {
    return {}
  } catch {
    return {}
  }
}

function parseExifDate(dateString: string): Date | undefined {
  try {
    // EXIF date format: "YYYY:MM:DD HH:MM:SS"
    const [datePart, timePart] = dateString.split(' ')
    const [year, month, day] = datePart.split(':')
    const [hour, minute, second] = timePart.split(':')
    
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    )
  } catch {
    return undefined
  }
}

function convertGPSToDecimal(
  coordinate: number[],
  ref: string
): number {
  const decimal = coordinate[0] + coordinate[1] / 60 + coordinate[2] / 3600
  return ref === 'S' || ref === 'W' ? -decimal : decimal
}

export function verifyPhotoTimestamp(
  captureTimestamp: Date,
  submissionTimestamp: Date,
  narrativeDate: Date
): {
  isValid: boolean
  warning?: string
  reason?: string
} {
  // Check if capture timestamp exists
  if (!captureTimestamp) {
    return {
      isValid: false,
      warning: 'No capture timestamp found',
      reason: 'Photo metadata missing or removed',
    }
  }

  // Check if photo was captured in the future
  if (captureTimestamp > submissionTimestamp) {
    return {
      isValid: false,
      warning: 'Photo timestamp is in the future',
      reason: 'Possible device clock manipulation',
    }
  }

  // Check if photo is too old (more than 7 days before narrative date)
  const daysDiff = Math.floor(
    (narrativeDate.getTime() - captureTimestamp.getTime()) / (1000 * 60 * 60 * 24)
  )
  
  if (daysDiff > 7) {
    return {
      isValid: false,
      warning: `Photo was taken ${daysDiff} days before the narrative date`,
      reason: 'Photo may not be from the actual work day',
    }
  }

  // Check if photo is from a different day than narrative
  const captureDay = captureTimestamp.toDateString()
  const narrativeDay = narrativeDate.toDateString()
  
  if (captureDay !== narrativeDay) {
    return {
      isValid: true,
      warning: `Photo was taken on ${captureDay}, but narrative is for ${narrativeDay}`,
      reason: 'Verify that photo is from the correct date',
    }
  }

  return {
    isValid: true,
  }
}

export function verifyGPSLocation(
  latitude: number,
  longitude: number,
  expectedLatitude?: number,
  expectedLongitude?: number,
  maxDistanceKm: number = 5
): {
  isValid: boolean
  distance?: number
  warning?: string
} {
  if (!expectedLatitude || !expectedLongitude) {
    return { isValid: true }
  }

  // Calculate distance using Haversine formula
  const distance = calculateDistance(
    latitude,
    longitude,
    expectedLatitude,
    expectedLongitude
  )

  if (distance > maxDistanceKm) {
    return {
      isValid: false,
      distance,
      warning: `Photo taken ${distance.toFixed(2)}km away from workplace`,
    }
  }

  return {
    isValid: true,
    distance,
  }
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}
