export type ConfidenceLevel = 'verified' | 'likely' | 'unverified' | 'removed'
export type PrecisionLabel = 'intersection' | 'landmark' | 'block' | 'area' | 'lead'
export type ArtworkStatus = 'original' | 'changed'
export type SubmissionKind = 'new' | 'location' | 'photos_same' | 'photos_repainted'
export type StatusVote = 'still_here' | 'removed' | 'unsure'

export interface Coordinates {
  lat: number
  lng: number
}

export interface Artist {
  name: string
  instagram?: string | null   // handle without @
  url?: string | null         // any other profile / website
}

export interface Mural {
  id: string
  slug: string
  title: string
  artist: string | null
  artist_verified: boolean
  artists?: Artist[] | null
  photo_credit?: string | null
  photo_credit_url?: string | null
  location_description: string
  coordinates: Coordinates | null
  confidence: ConfidenceLevel
  precision: PrecisionLabel | null
  year: number | null
  medium: string | null
  notes: string | null
  photos: string[]          // Supabase storage URLs
  artwork_status?: ArtworkStatus      // 'changed' = same wall, repainted
  artwork_changed_at?: string | null
  previous_photos?: string[]
  cover_photo: string | null
  still_here_count: number
  removed_count: number
  unsure_count: number
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  mural_id: string
  author_name: string | null
  body: string
  status_vote: StatusVote | null
  created_at: string
}

export interface Submission {
  id: string
  title: string | null
  artist: string | null
  location_description: string
  notes: string | null
  photo_paths: string[]
  coordinates?: Coordinates | null
  location_source?: 'link' | 'device' | 'photo' | 'manual' | null
  kind?: SubmissionKind
  mural_slug?: string | null
  auto_verified?: boolean
  auto_note?: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface TourStop {
  mural: Mural
  order: number
}
