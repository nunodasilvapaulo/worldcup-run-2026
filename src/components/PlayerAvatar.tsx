import { useEffect, useMemo, useState } from 'react'

import { lookupPlayerPhoto } from '@/game/players2026'

import { fetchSportsDbPhoto, resolvePhotoUrl } from '@/game/photoUrls'



export function PlayerAvatar({

  name,

  photoUrl,

  nationId,

  size = 48,

}: {

  name: string

  photoUrl?: string

  nationId?: string

  size?: number

}) {

  const resolved = useMemo(() => {

    const raw = photoUrl || (nationId ? lookupPlayerPhoto(name, nationId) : '')

    return resolvePhotoUrl(raw)

  }, [photoUrl, nationId, name])



  const [failed, setFailed] = useState(false)

  const [src, setSrc] = useState(resolved)

  const [sportsDbTried, setSportsDbTried] = useState(false)



  useEffect(() => {

    setSrc(resolved)

    setFailed(false)

    setSportsDbTried(false)

  }, [resolved, name])



  useEffect(() => {

    if (resolved || sportsDbTried || failed) return

    setSportsDbTried(true)

    void fetchSportsDbPhoto(name).then((url) => {

      if (url) setSrc(url)

      else setFailed(true)

    })

  }, [resolved, name, sportsDbTried, failed])



  const initials = name

    .split(' ')

    .map((w) => w[0])

    .join('')

    .slice(0, 2)

    .toUpperCase()



  const handleError = () => {

    if (!sportsDbTried) {

      setSportsDbTried(true)

      void fetchSportsDbPhoto(name).then((url) => {

        if (url) setSrc(url)

        else setFailed(true)

      })

      return

    }

    setFailed(true)

  }



  if (!src || failed) {

    return (

      <div

        className="rounded-full bg-[var(--color-wc-panel)] border border-white/20 flex items-center justify-center shrink-0 font-bold text-white/80"

        style={{ width: size, height: size, fontSize: size * 0.32 }}

      >

        {initials}

      </div>

    )

  }



  return (

    <img

      src={src}

      alt={name}

      width={size}

      height={size}

      className="rounded-full object-cover border-2 border-white/25 shrink-0 bg-black/40"

      style={{ width: size, height: size }}

      onError={handleError}

      loading="lazy"

      decoding="async"

      referrerPolicy="no-referrer"

    />

  )

}


