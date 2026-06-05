/** WC 2026 host venues — images via Wikimedia Commons (fan / personal use) */
export interface StadiumVenue {
  id: string
  name: string
  city: string
  country: 'USA' | 'Mexico' | 'Canada'
  flag: string
  imageUrl: string
  credit: string
}

export const STADIUMS_2026: StadiumVenue[] = [
  {
    id: 'metlife',
    name: 'MetLife Stadium',
    city: 'East Rutherford, NJ',
    country: 'USA',
    flag: '🇺🇸',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Metlife_stadium_ext.jpg/1280px-Metlife_stadium_ext.jpg',
    credit: 'MetLife Stadium · Wikimedia CC',
  },
  {
    id: 'azteca',
    name: 'Estadio Azteca',
    city: 'Mexico City',
    country: 'Mexico',
    flag: '🇲🇽',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Estadio_Azteca_2018.jpg/1280px-Estadio_Azteca_2018.jpg',
    credit: 'Estadio Azteca · Wikimedia CC',
  },
  {
    id: 'sofi',
    name: 'SoFi Stadium',
    city: 'Inglewood, CA',
    country: 'USA',
    flag: '🇺🇸',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/SoFi_Stadium_interior_2022.jpg/1280px-SoFi_Stadium_interior_2022.jpg',
    credit: 'SoFi Stadium · Wikimedia CC',
  },
  {
    id: 'bc-place',
    name: 'BC Place',
    city: 'Vancouver',
    country: 'Canada',
    flag: '🇨🇦',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/BC_Place_Stadium.jpg/1280px-BC_Place_Stadium.jpg',
    credit: 'BC Place · Wikimedia CC',
  },
  {
    id: 'att',
    name: 'AT&T Stadium',
    city: 'Arlington, TX',
    country: 'USA',
    flag: '🇺🇸',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/AT%26T_Stadium_interior.jpg/1280px-AT%26T_Stadium_interior.jpg',
    credit: 'AT&T Stadium · Wikimedia CC',
  },
  {
    id: 'mercedes',
    name: 'Mercedes-Benz Stadium',
    city: 'Atlanta, GA',
    country: 'USA',
    flag: '🇺🇸',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Mercedes-Benz_Stadium_interior.jpg/1280px-Mercedes-Benz_Stadium_interior.jpg',
    credit: 'Mercedes-Benz Stadium · Wikimedia CC',
  },
  {
    id: 'hard-rock',
    name: 'Hard Rock Stadium',
    city: 'Miami Gardens, FL',
    country: 'USA',
    flag: '🇺🇸',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Hard_Rock_Stadium_%28American_Airlines%29.jpg/1280px-Hard_Rock_Stadium_%28American_Airlines%29.jpg',
    credit: 'Hard Rock Stadium · Wikimedia CC',
  },
  {
    id: 'akron',
    name: 'Estadio Akron',
    city: 'Guadalajara',
    country: 'Mexico',
    flag: '🇲🇽',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Estadio_Akron_%28Chivas%29.jpg/1280px-Estadio_Akron_%28Chivas%29.jpg',
    credit: 'Estadio Akron · Wikimedia CC',
  },
]

export function stadiumForStage(layer: number, isFinal: boolean): StadiumVenue {
  if (isFinal) return STADIUMS_2026.find((s) => s.id === 'metlife') ?? STADIUMS_2026[0]!
  return STADIUMS_2026[layer % STADIUMS_2026.length]!
}
