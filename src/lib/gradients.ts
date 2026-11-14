const GRADIENTS: Record<string, string> = {
  'la-chica':                   'linear-gradient(145deg,#C83878,#E05530,#F4A820)',
  'black-white-portrait-jocka': 'linear-gradient(145deg,#1A1A1A,#5A5A5A,#2A2A2A)',
  'two-women-water':             'linear-gradient(145deg,#1488A0,#2AC4D0,#0A6878)',
  'zapatista':                   'linear-gradient(145deg,#C8A010,#E0C030,#906800)',
  'corazon-playa':               'linear-gradient(145deg,#E05580,#C83050,#F090A0)',
  'mayan-warrior':               'linear-gradient(145deg,#5A3010,#A06020,#C88040)',
  'selva-girl':                  'linear-gradient(145deg,#206030,#40A050,#80C060)',
  'quetzal':                     'linear-gradient(145deg,#006040,#20A070,#40C898)',
  'ocean-mural':                 'linear-gradient(145deg,#1050A0,#2070C0,#40A0E0)',
  'frida':                       'linear-gradient(145deg,#A02040,#C04060,#E06080)',
  'cenote-diver':                'linear-gradient(145deg,#006080,#0090B0,#20C0D0)',
  'catrina':                     'linear-gradient(145deg,#301050,#601080,#9020A0)',
  'jaguar':                      'linear-gradient(145deg,#602000,#A04010,#C07020)',
  'tribute-wall':                'linear-gradient(145deg,#204060,#406080,#60A0C0)',
  'abstract-geometric':          'linear-gradient(145deg,#602060,#A030A0,#C060C0)',
  'mariachi':                    'linear-gradient(145deg,#802010,#C04020,#E08030)',
  'revolution':                  'linear-gradient(145deg,#601010,#A02020,#C03030)',
}

const DEFAULT = 'linear-gradient(145deg,#326A82,#245970,#1A3A4A)'

export function getMuralGradient(slug: string): string {
  return GRADIENTS[slug] ?? DEFAULT
}
