import { useEffect, useRef, useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { fetchGeoapifyAutocomplete } from '../services/geoapify.js'

/**
 * A text input backed by the real Geoapify Autocomplete API. Calls
 * onSelect({ label, lat, lng }) with the actual place the user picked —
 * never a guessed or hardcoded coordinate. Debounced so it doesn't fire a
 * request on every keystroke.
 */
export default function PlaceAutocompleteInput({ placeholder, value, onSelect, accent = 'beacon' }) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef(null)
  const containerRef = useRef(null)
  const skipNextFetchRef = useRef(false)

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  useEffect(() => {
    function handleOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query || query.trim().length < 3) {
      setSuggestions([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const results = await fetchGeoapifyAutocomplete(query)
        setSuggestions(results)
        setIsOpen(true)
      } catch {
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, 350)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  const handlePick = (place) => {
    skipNextFetchRef.current = true
    setQuery(place.label)
    setSuggestions([])
    setIsOpen(false)
    onSelect(place)
  }

  const accentClass = accent === 'transit' ? 'text-transit' : 'text-beacon'

  return (
    <div ref={containerRef} className="relative">
      <div className="neu-inset flex items-center gap-3 rounded-2xl px-4 py-3">
        <MapPin size={16} className={accentClass} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
        />
        {isLoading && <Loader2 size={14} className="animate-spin text-mist-faint" />}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="glass absolute z-30 mt-2 w-full overflow-hidden rounded-2xl">
          {suggestions.map((s, i) => (
            <button
              key={`${s.lat}-${s.lng}-${i}`}
              type="button"
              onClick={() => handlePick(s)}
              className="flex w-full items-start gap-2.5 px-4 py-3 text-left font-body text-[13px] text-mist hover:bg-white/[0.06]"
            >
              <MapPin size={13} className="mt-0.5 shrink-0 text-mist-faint" />
              <span className="line-clamp-2">{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
