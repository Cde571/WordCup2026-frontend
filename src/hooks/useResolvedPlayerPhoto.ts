// src/hooks/useResolvedPlayerPhoto.ts
import { useEffect, useMemo, useRef, useState } from "react";

const memCache = new Map<string, string>();

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function useInView<T extends HTMLElement>(rootMargin = "200px") {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}

export function useResolvedPlayerPhoto(opts: {
  apiBase: string;
  playerName: string;
  playerPhoto?: string | null;
  teamName: string;
  fallback: string;
}) {
  const { apiBase, playerName, playerPhoto, teamName, fallback } = opts;

  const cacheKey = useMemo(
    () => `${norm(playerName)}|${norm(teamName)}`,
    [playerName, teamName]
  );

  const [url, setUrl] = useState<string | null>(
    playerPhoto?.trim() ? playerPhoto : null
  );

  const { ref, inView } = useInView<HTMLDivElement>("250px");

  useEffect(() => {
    if (url) return;
    if (!inView) return;

    const cached = memCache.get(cacheKey);
    if (cached) {
      setUrl(cached);
      return;
    }

    const ac = new AbortController();

    (async () => {
      try {
        const r = await fetch(
          `${apiBase}/api/players/photo?name=${encodeURIComponent(
            playerName
          )}&team=${encodeURIComponent(teamName)}`,
          { signal: ac.signal }
        );

        const data = await r.json();
        const found = (data?.url as string | null) ?? null;

        if (found) {
          memCache.set(cacheKey, found);
          setUrl(found);
        } else {
          setUrl(null);
        }
      } catch {
        setUrl(null);
      }
    })();

    return () => ac.abort();
  }, [apiBase, cacheKey, inView, playerName, teamName, url]);

  return { containerRef: ref, photoUrl: url ?? fallback };
}
