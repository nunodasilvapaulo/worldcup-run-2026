import { getCachedNation, getCachedStarterNationIds, isGameDataLoaded } from './gameData'
import { NON_WC_NATIONS } from './nonWcNations'
import type { Nation } from './types'

/** All 48 FIFA World Cup 2026 qualified nations (fan reference data) */
export const NATIONS_2026: Nation[] = [
  { id: 'canada', name: 'Canada', flag: '🇨🇦', confederation: 'CONCACAF', tier: 'B', archetype: 'host', colors: ['#FF0000', '#FFFFFF', '#FF0000'], isHost: true },
  { id: 'mexico', name: 'Mexico', flag: '🇲🇽', confederation: 'CONCACAF', tier: 'B', archetype: 'host', colors: ['#006847', '#FFFFFF', '#CE1126'], isHost: true },
  { id: 'usa', name: 'USA', flag: '🇺🇸', confederation: 'CONCACAF', tier: 'B', archetype: 'host', colors: ['#3C3B6E', '#FFFFFF', '#B22234'], isHost: true },
  { id: 'australia', name: 'Australia', flag: '🇦🇺', confederation: 'AFC', tier: 'B', archetype: 'balanced', colors: ['#00008B', '#FFFFFF', '#FF0000'] },
  { id: 'iraq', name: 'Iraq', flag: '🇮🇶', confederation: 'AFC', tier: 'B', archetype: 'counter', colors: ['#CE1126', '#FFFFFF', '#000000'] },
  { id: 'iran', name: 'IR Iran', flag: '🇮🇷', confederation: 'AFC', tier: 'B', archetype: 'counter', colors: ['#239F40', '#FFFFFF', '#DA0000'] },
  { id: 'japan', name: 'Japan', flag: '🇯🇵', confederation: 'AFC', tier: 'A', archetype: 'press', colors: ['#FFFFFF', '#BC002D', '#FFFFFF'] },
  { id: 'jordan', name: 'Jordan', flag: '🇯🇴', confederation: 'AFC', tier: 'C', archetype: 'underdog', colors: ['#000000', '#FFFFFF', '#007A3D'], debut2026: true },
  { id: 'korea', name: 'Korea Republic', flag: '🇰🇷', confederation: 'AFC', tier: 'A', archetype: 'balanced', colors: ['#FFFFFF', '#CD2E3A', '#0047A0'] },
  { id: 'qatar', name: 'Qatar', flag: '🇶🇦', confederation: 'AFC', tier: 'B', archetype: 'balanced', colors: ['#8D1B3D', '#FFFFFF', '#8D1B3D'] },
  { id: 'saudi', name: 'Saudi Arabia', flag: '🇸🇦', confederation: 'AFC', tier: 'B', archetype: 'counter', colors: ['#006C35', '#FFFFFF', '#006C35'] },
  { id: 'uzbekistan', name: 'Uzbekistan', flag: '🇺🇿', confederation: 'AFC', tier: 'C', archetype: 'underdog', colors: ['#1EB53A', '#FFFFFF', '#0099B5'], debut2026: true },
  { id: 'algeria', name: 'Algeria', flag: '🇩🇿', confederation: 'CAF', tier: 'B', archetype: 'counter', colors: ['#FFFFFF', '#006233', '#D21034'] },
  { id: 'cabo-verde', name: 'Cabo Verde', flag: '🇨🇻', confederation: 'CAF', tier: 'C', archetype: 'underdog', colors: ['#003893', '#FFFFFF', '#CF2027'], debut2026: true },
  { id: 'congo-dr', name: 'Congo DR', flag: '🇨🇩', confederation: 'CAF', tier: 'B', archetype: 'flair', colors: ['#007FFF', '#F7D618', '#CE1026'] },
  { id: 'ivory-coast', name: "Côte d'Ivoire", flag: '🇨🇮', confederation: 'CAF', tier: 'A', archetype: 'flair', colors: ['#F77F00', '#FFFFFF', '#009E60'] },
  { id: 'egypt', name: 'Egypt', flag: '🇪🇬', confederation: 'CAF', tier: 'B', archetype: 'balanced', colors: ['#CE1126', '#FFFFFF', '#000000'] },
  { id: 'ghana', name: 'Ghana', flag: '🇬🇭', confederation: 'CAF', tier: 'B', archetype: 'flair', colors: ['#CE1126', '#FCD116', '#006B3F'] },
  { id: 'morocco', name: 'Morocco', flag: '🇲🇦', confederation: 'CAF', tier: 'A', archetype: 'counter', colors: ['#C1272D', '#006233', '#C1272D'] },
  { id: 'senegal', name: 'Senegal', flag: '🇸🇳', confederation: 'CAF', tier: 'A', archetype: 'counter', colors: ['#00853F', '#FDEF42', '#E31B23'] },
  { id: 'south-africa', name: 'South Africa', flag: '🇿🇦', confederation: 'CAF', tier: 'B', archetype: 'balanced', colors: ['#007749', '#FFB81C', '#000000'] },
  { id: 'tunisia', name: 'Tunisia', flag: '🇹🇳', confederation: 'CAF', tier: 'B', archetype: 'counter', colors: ['#E70013', '#FFFFFF', '#E70013'] },
  { id: 'curacao', name: 'Curaçao', flag: '🇨🇼', confederation: 'CONCACAF', tier: 'C', archetype: 'underdog', colors: ['#002B7F', '#F7D417', '#002B7F'], debut2026: true },
  { id: 'haiti', name: 'Haiti', flag: '🇭🇹', confederation: 'CONCACAF', tier: 'C', archetype: 'underdog', colors: ['#00209F', '#D21034', '#00209F'] },
  { id: 'panama', name: 'Panama', flag: '🇵🇦', confederation: 'CONCACAF', tier: 'C', archetype: 'underdog', colors: ['#FFFFFF', '#DA121A', '#072357'] },
  { id: 'argentina', name: 'Argentina', flag: '🇦🇷', confederation: 'CONMEBOL', tier: 'S', archetype: 'flair', colors: ['#75AADB', '#FFFFFF', '#F6B40E'] },
  { id: 'brazil', name: 'Brazil', flag: '🇧🇷', confederation: 'CONMEBOL', tier: 'S', archetype: 'flair', colors: ['#009C3B', '#FFDF00', '#002776'] },
  { id: 'colombia', name: 'Colombia', flag: '🇨🇴', confederation: 'CONMEBOL', tier: 'A', archetype: 'flair', colors: ['#FCD116', '#003893', '#CE1126'] },
  { id: 'ecuador', name: 'Ecuador', flag: '🇪🇨', confederation: 'CONMEBOL', tier: 'B', archetype: 'flair', colors: ['#FFD100', '#0033A0', '#ED1C24'] },
  { id: 'paraguay', name: 'Paraguay', flag: '🇵🇾', confederation: 'CONMEBOL', tier: 'B', archetype: 'counter', colors: ['#D52B1E', '#FFFFFF', '#0038A8'] },
  { id: 'uruguay', name: 'Uruguay', flag: '🇺🇾', confederation: 'CONMEBOL', tier: 'A', archetype: 'balanced', colors: ['#FFFFFF', '#0038A8', '#FFFFFF'] },
  { id: 'new-zealand', name: 'New Zealand', flag: '🇳🇿', confederation: 'OFC', tier: 'C', archetype: 'underdog', colors: ['#000000', '#FFFFFF', '#000000'] },
  { id: 'austria', name: 'Austria', flag: '🇦🇹', confederation: 'UEFA', tier: 'B', archetype: 'press', colors: ['#ED2939', '#FFFFFF', '#ED2939'] },
  { id: 'belgium', name: 'Belgium', flag: '🇧🇪', confederation: 'UEFA', tier: 'A', archetype: 'balanced', colors: ['#000000', '#FAE042', '#ED2939'] },
  { id: 'bosnia', name: 'Bosnia and Herzegovina', flag: '🇧🇦', confederation: 'UEFA', tier: 'B', archetype: 'balanced', colors: ['#002395', '#FECB00', '#FFFFFF'] },
  { id: 'croatia', name: 'Croatia', flag: '🇭🇷', confederation: 'UEFA', tier: 'A', archetype: 'press', colors: ['#FF0000', '#FFFFFF', '#171796'] },
  { id: 'czechia', name: 'Czechia', flag: '🇨🇿', confederation: 'UEFA', tier: 'B', archetype: 'balanced', colors: ['#11457E', '#FFFFFF', '#D7141A'] },
  { id: 'england', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA', tier: 'S', archetype: 'balanced', colors: ['#FFFFFF', '#CE1124', '#FFFFFF'] },
  { id: 'france', name: 'France', flag: '🇫🇷', confederation: 'UEFA', tier: 'S', archetype: 'balanced', colors: ['#002395', '#FFFFFF', '#ED2939'] },
  { id: 'germany', name: 'Germany', flag: '🇩🇪', confederation: 'UEFA', tier: 'S', archetype: 'balanced', colors: ['#000000', '#DD0000', '#FFCE00'] },
  { id: 'netherlands', name: 'Netherlands', flag: '🇳🇱', confederation: 'UEFA', tier: 'A', archetype: 'press', colors: ['#FF6600', '#FFFFFF', '#21468B'] },
  { id: 'norway', name: 'Norway', flag: '🇳🇴', confederation: 'UEFA', tier: 'B', archetype: 'balanced', colors: ['#BA0C2F', '#00205B', '#FFFFFF'] },
  { id: 'portugal', name: 'Portugal', flag: '🇵🇹', confederation: 'UEFA', tier: 'S', archetype: 'press', colors: ['#006600', '#FF0000', '#006600'] },
  { id: 'scotland', name: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', confederation: 'UEFA', tier: 'B', archetype: 'counter', colors: ['#0065BD', '#FFFFFF', '#0065BD'] },
  { id: 'spain', name: 'Spain', flag: '🇪🇸', confederation: 'UEFA', tier: 'S', archetype: 'press', colors: ['#AA151B', '#F1BF00', '#AA151B'] },
  { id: 'sweden', name: 'Sweden', flag: '🇸🇪', confederation: 'UEFA', tier: 'B', archetype: 'balanced', colors: ['#006AA7', '#FECC00', '#006AA7'] },
  { id: 'switzerland', name: 'Switzerland', flag: '🇨🇭', confederation: 'UEFA', tier: 'B', archetype: 'balanced', colors: ['#FF0000', '#FFFFFF', '#FF0000'] },
  { id: 'turkey', name: 'Türkiye', flag: '🇹🇷', confederation: 'UEFA', tier: 'B', archetype: 'counter', colors: ['#E30A17', '#FFFFFF', '#E30A17'] },
]

export const NATION_BY_ID = Object.fromEntries(NATIONS_2026.map((n) => [n.id, n])) as Record<string, Nation>

/** All 48 World Cup nations are playable */
export const STARTER_NATION_IDS = NATIONS_2026.map((n) => n.id)

export function getNation(id: string): Nation {
  if (isGameDataLoaded()) {
    const cached = getCachedNation(id)
    if (cached) return cached
  }
  return NATION_BY_ID[id] ?? NON_WC_NATIONS.find((n) => n.id === id) ?? NATIONS_2026[0]!
}

export function getStarterNationIds(): readonly string[] {
  if (isGameDataLoaded()) return getCachedStarterNationIds()
  return STARTER_NATION_IDS
}
