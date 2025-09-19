import { describe, expect, it } from 'vitest'

import { parseDate } from './App.jsx'

describe('parseDate', () => {
  it('normalizes Figment snapshot dates that use month abbreviations with periods and ordinal suffixes', () => {
    const text = 'Figment dashboard snapshot — Aug. 2nd 2025'
    expect(parseDate(text)).toBe('2025-08-02')
  })

  it('normalizes Figment activity strings that include commas without spaces and ordinal suffixes', () => {
    const text = 'Latest Figment activity: Sept. 14th,25'
    expect(parseDate(text)).toBe('2025-09-14')
  })

  it('normalizes slash-separated dates to ISO format', () => {
    expect(parseDate('Report generated 8/2/2025')).toBe('2025-08-02')
  })
})
