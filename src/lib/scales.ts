/** A scale as semitone steps above its root (the root, 0, is always first). */
export interface Scale {
  id: string
  name: string
  group: 'Common' | 'Modes' | 'More'
  intervals: number[]
}

export const SCALES: Scale[] = [
  { id: 'major', name: 'Major', group: 'Common', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'minor', name: 'Natural Minor', group: 'Common', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: 'major-pentatonic', name: 'Major Pentatonic', group: 'Common', intervals: [0, 2, 4, 7, 9] },
  {
    id: 'minor-pentatonic',
    name: 'Minor Pentatonic',
    group: 'Common',
    intervals: [0, 3, 5, 7, 10]
  },
  { id: 'blues', name: 'Blues', group: 'Common', intervals: [0, 3, 5, 6, 7, 10] },
  {
    id: 'harmonic-minor',
    name: 'Harmonic Minor',
    group: 'Common',
    intervals: [0, 2, 3, 5, 7, 8, 11]
  },
  {
    id: 'melodic-minor',
    name: 'Melodic Minor',
    group: 'Common',
    intervals: [0, 2, 3, 5, 7, 9, 11]
  },
  { id: 'dorian', name: 'Dorian', group: 'Modes', intervals: [0, 2, 3, 5, 7, 9, 10] },
  { id: 'phrygian', name: 'Phrygian', group: 'Modes', intervals: [0, 1, 3, 5, 7, 8, 10] },
  { id: 'lydian', name: 'Lydian', group: 'Modes', intervals: [0, 2, 4, 6, 7, 9, 11] },
  { id: 'mixolydian', name: 'Mixolydian', group: 'Modes', intervals: [0, 2, 4, 5, 7, 9, 10] },
  { id: 'locrian', name: 'Locrian', group: 'Modes', intervals: [0, 1, 3, 5, 6, 8, 10] },
  {
    id: 'phrygian-dominant',
    name: 'Phrygian Dominant',
    group: 'More',
    intervals: [0, 1, 4, 5, 7, 8, 10]
  },
  {
    id: 'hungarian-minor',
    name: 'Hungarian Minor',
    group: 'More',
    intervals: [0, 2, 3, 6, 7, 8, 11]
  },
  { id: 'whole-tone', name: 'Whole Tone', group: 'More', intervals: [0, 2, 4, 6, 8, 10] },
  {
    id: 'diminished',
    name: 'Diminished (W–H)',
    group: 'More',
    intervals: [0, 2, 3, 5, 6, 8, 9, 11]
  }
]

/** Interval names by semitones above the root. */
const DEGREES = ['1', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7']

/** The interval name of a note `semitones` above the root (wrapped to one octave): 3 → "♭3". */
export function degreeName(semitones: number): string {
  return DEGREES[((semitones % 12) + 12) % 12]
}

/** A scale's formula: "1 2 ♭3 4 5 ♭6 ♭7". */
export function formula(scale: Scale): string {
  return scale.intervals.map(degreeName).join(' ')
}

export function findScale(id: string): Scale | undefined {
  return SCALES.find((scale) => scale.id === id)
}
