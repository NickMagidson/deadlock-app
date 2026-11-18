import { useState, type FormEvent } from 'react'

interface PlayerSearchFormProps {
  initialQuery: string
  onSubmit: (query: string) => void
}

export function PlayerSearchForm({ initialQuery, onSubmit }: PlayerSearchFormProps) {
  const [query, setQuery] = useState(initialQuery)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(query.trim())
  }

  return (
    <form className="player-search" role="search" onSubmit={submit}>
      <label htmlFor="player-query">Steam name or ID</label>
      <div className="player-search__control">
        <input
          id="player-query"
          maxLength={100}
          name="q"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ExamplePlayer or 7656119…"
          type="search"
          value={query}
        />
        <button type="submit">Open the archive</button>
      </div>
      <p>Steam display name, SteamID3, or SteamID64</p>
    </form>
  )
}
