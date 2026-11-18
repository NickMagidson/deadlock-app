import type { FormEvent } from 'react'

interface PlayerSearchFormProps {
  initialQuery: string
  onSubmit: (query: string) => void
}

export function PlayerSearchForm({ initialQuery, onSubmit }: PlayerSearchFormProps) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    onSubmit(String(data.get('q') ?? '').trim())
  }

  return (
    <form action="/" className="player-search" method="get" role="search" onSubmit={submit}>
      <label htmlFor="player-query">Steam name or ID</label>
      <div className="player-search__control">
        <input
          id="player-query"
          maxLength={100}
          name="q"
          placeholder="ExamplePlayer or 7656119…"
          type="search"
          defaultValue={initialQuery}
        />
        <button type="submit">Open the archive</button>
      </div>
      <p>Steam display name, SteamID3, or SteamID64</p>
    </form>
  )
}
