'use client'
import { useArtistDirectory } from '@/lib/artistDirectory'

/** Artist names already known (directory + murals), for autocomplete suggestions. */
export function useKnownArtists(): string[] {
  return useArtistDirectory().names
}
