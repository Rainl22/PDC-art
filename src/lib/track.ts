import { track as vercelTrack } from '@vercel/analytics'

/** The only custom events we record. Names only, no properties, no personal data. */
export type EventName =
  | 'explore_map_click'   // landing: "Explore the map"
  | 'how_it_works_click'  // landing: "See how it works"
  | 'install_click'       // landing or side menu: tapped "Install the app"
  | 'app_installed'       // browser confirmed the install
  | 'tour_started'        // first stop added to an empty tour
  | 'favourite_saved'     // heart tapped on (not off)

/** Fire-and-forget. Never throws, so analytics can't break the app (blocked scripts, private mode, SSR). */
export function track(name: EventName): void {
  try { vercelTrack(name) } catch { /* ignore */ }
}
