'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

/** Header search sends buyers to the existing searchable gallery. */
export function ML111Search() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = query.trim();
    router.push(clean ? `/collection?q=${encodeURIComponent(clean)}` : '/collection');
  }
  return <form className="ml111-search" role="search" onSubmit={submit}>
    <label className="ml111-sr-only" htmlFor="ml111-search-field">Search sample sportswear designs</label>
    <Search aria-hidden="true" size={16} />
    <input id="ml111-search-field" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search designs..." maxLength={80}/>
    <button type="submit" aria-label="Search designs"><Search size={15}/></button>
  </form>;
}
