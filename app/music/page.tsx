"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Music2, Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Plus, Trash2, ListMusic, Loader2,
  AlertCircle, ExternalLink,
} from "lucide-react";
import clsx from "clsx";

// ── Minimal YT IFrame API types ──────────────────────────────
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  loadVideoById(videoId: string): void;
  setVolume(volume: number): void;
  getVolume(): number;
  getDuration(): number;
  getCurrentTime(): number;
  getPlayerState(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  destroy(): void;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          height?: string | number;
          width?: string | number;
          videoId?: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: { ENDED: 0; PLAYING: 1; PAUSED: 2; BUFFERING: 3 };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface VideoItem {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
}

function formatTime(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

function decodeHtml(html: string) {
  if (typeof document === "undefined") return html;
  const el = document.createElement("textarea");
  el.innerHTML = html;
  return el.value;
}

export default function MusicPage() {
  const [query, setQuery]             = useState("");
  const [results, setResults]         = useState<VideoItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [queue, setQueue]           = useState<VideoItem[]>([]);
  const [nowIdx, setNowIdx]         = useState<number | null>(null);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [volume, setVolume]         = useState(80);
  const [muted, setMuted]           = useState(false);
  const [progress, setProgress]     = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]     = useState(0);
  const [playerReady, setPlayerReady] = useState(false);

  const playerRef      = useRef<YTPlayer | null>(null);
  const queueRef       = useRef(queue);
  const nowIdxRef      = useRef(nowIdx);
  const loadedVideoRef = useRef<string | null>(null);
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerDivId    = "yt-player-embed";

  useEffect(() => { queueRef.current  = queue;  }, [queue]);
  useEffect(() => { nowIdxRef.current = nowIdx; }, [nowIdx]);

  // ── Initialize YT IFrame API ─────────────────────────────
  useEffect(() => {
    function init() {
      playerRef.current = new window.YT.Player(playerDivId, {
        height: "1",
        width: "1",
        playerVars: { autoplay: 0, controls: 0, rel: 0 },
        events: {
          onReady: () => setPlayerReady(true),
          onStateChange: (e) => {
            if (e.data === 1) setIsPlaying(true);
            if (e.data === 2) setIsPlaying(false);
            if (e.data === 0) {
              // Ended — advance to next
              const q   = queueRef.current;
              const idx = nowIdxRef.current;
              if (idx !== null && idx < q.length - 1) {
                setNowIdx(idx + 1);
              } else {
                setIsPlaying(false);
                setProgress(0);
                setCurrentTime(0);
              }
            }
          },
        },
      });
    }

    if (window.YT?.Player) {
      init();
    } else {
      window.onYouTubeIframeAPIReady = init;
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const s = document.createElement("script");
        s.src   = "https://www.youtube.com/iframe_api";
        s.async = true;
        document.head.appendChild(s);
      }
    }

    return () => { playerRef.current?.destroy(); };
  }, []);

  // ── Load video when nowIdx or queue changes ──────────────
  useEffect(() => {
    if (nowIdx === null || !queue[nowIdx] || !playerRef.current || !playerReady) return;
    const videoId = queue[nowIdx].id;
    if (loadedVideoRef.current === videoId) return; // already loaded
    loadedVideoRef.current = videoId;
    playerRef.current.loadVideoById(videoId);
    setIsPlaying(true);
  }, [nowIdx, queue, playerReady]);

  // ── Progress polling ─────────────────────────────────────
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        const p = playerRef.current;
        if (!p) return;
        const ct = p.getCurrentTime();
        const d  = p.getDuration();
        setCurrentTime(ct);
        setDuration(d);
        setProgress(d > 0 ? ct / d : 0);
      }, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying]);

  // ── Volume sync ──────────────────────────────────────────
  useEffect(() => {
    if (!playerRef.current || !playerReady) return;
    playerRef.current.setVolume(muted ? 0 : volume);
  }, [volume, muted, playerReady]);

  // ── Debounced search ─────────────────────────────────────
  useEffect(() => {
    if (!query.trim()) { setResults([]); setSearchError(null); return; }
    const t = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const res  = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.error) { setSearchError(data.error); setResults([]); return; }
        type RawItem = {
          id: { videoId: string };
          snippet: { title: string; channelTitle: string; thumbnails: { default: { url: string } } };
        };
        setResults(
          (data.items ?? []).map((item: RawItem): VideoItem => ({
            id:        item.id.videoId,
            title:     decodeHtml(item.snippet.title),
            channel:   item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.default.url,
          }))
        );
      } catch {
        setSearchError("Search failed. Check your connection.");
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [query]);

  // ── Controls ─────────────────────────────────────────────
  function togglePlay() {
    if (!playerRef.current) return;
    if (isPlaying) { playerRef.current.pauseVideo(); setIsPlaying(false); }
    else           { playerRef.current.playVideo();  setIsPlaying(true); }
  }

  function playNext() {
    if (nowIdx !== null && nowIdx < queue.length - 1) setNowIdx(nowIdx + 1);
  }

  function playPrev() {
    if (currentTime > 3) {
      playerRef.current?.seekTo(0, true);
    } else if (nowIdx !== null && nowIdx > 0) {
      setNowIdx(nowIdx - 1);
    }
  }

  function playItem(video: VideoItem) {
    const existingIdx = queue.findIndex(q => q.id === video.id);
    if (existingIdx !== -1) {
      loadedVideoRef.current = null; // force reload
      setNowIdx(existingIdx);
    } else {
      const newIdx = queue.length;
      setQueue(prev => [...prev, video]);
      setNowIdx(newIdx);
    }
  }

  function addToQueue(video: VideoItem) {
    if (queue.some(q => q.id === video.id)) return;
    setQueue(prev => {
      const next = [...prev, video];
      if (nowIdx === null) setNowIdx(0);
      return next;
    });
  }

  function removeFromQueue(idx: number) {
    const newQueue = queue.filter((_, i) => i !== idx);
    setQueue(newQueue);
    if (nowIdx === null) return;
    if (idx === nowIdx) {
      if (newQueue.length === 0) {
        setNowIdx(null);
        setIsPlaying(false);
        loadedVideoRef.current = null;
      } else if (idx < newQueue.length) {
        // Same index now points to next video — force reload
        loadedVideoRef.current = null;
      } else {
        setNowIdx(newQueue.length - 1);
      }
    } else if (idx < nowIdx) {
      setNowIdx(nowIdx - 1);
    }
  }

  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (playerRef.current && duration > 0) {
      playerRef.current.seekTo(frac * duration, true);
      setProgress(frac);
    }
  }

  const nowPlaying = nowIdx !== null ? queue[nowIdx] ?? null : null;

  return (
    <div className="flex flex-col min-h-full">
      {/* Hidden YT player div — must stay mounted */}
      <div className="fixed -left-[9999px] -top-[9999px] w-px h-px overflow-hidden" aria-hidden>
        <div id={playerDivId} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-6 h-14 flex items-center gap-3">
        <Music2 size={16} className="text-red-400" />
        <h1 className="text-sm font-semibold text-slate-200">YouTube Music</h1>
        <span className="text-xs text-slate-600">via YouTube Data API</span>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0">

        {/* ── Left: Search + Results ───────────────────── */}
        <div className="flex flex-col lg:w-[400px] border-r border-slate-800 min-h-0 lg:min-h-[calc(100vh-3.5rem)]">
          {/* Search input */}
          <div className="px-4 py-3 border-b border-slate-800 shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search songs, artists, albums…"
                className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
              />
              {isSearching && (
                <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 animate-spin" />
              )}
            </div>
          </div>

          {/* Results list */}
          <div className="flex-1 overflow-y-auto">
            {/* Error / setup instructions */}
            {searchError && (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle size={15} />
                  <span className="text-sm">{searchError}</span>
                </div>
                {searchError.includes("YOUTUBE_API_KEY") && (
                  <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                    <p className="font-semibold text-slate-300">One-time setup needed:</p>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-500">
                      <li>
                        Open{" "}
                        <a
                          href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 underline inline-flex items-center gap-0.5"
                        >
                          Google Cloud Console <ExternalLink size={10} />
                        </a>
                      </li>
                      <li>Enable the <strong className="text-slate-400">YouTube Data API v3</strong></li>
                      <li>Go to Credentials → Create API key</li>
                      <li>
                        Add to <code className="bg-slate-800 px-1.5 py-0.5 rounded text-green-400">.env.local</code>:
                      </li>
                    </ol>
                    <pre className="bg-slate-800 rounded-lg p-3 text-[11px] text-green-400 font-mono overflow-x-auto">
{`YOUTUBE_API_KEY=AIzaSy…your_key_here`}
                    </pre>
                    <p className="text-slate-600">Then restart the dev server (<code className="text-slate-500">npm run dev</code>).</p>
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {!searchError && results.length === 0 && !isSearching && (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
                  <Search size={20} className="text-slate-600" />
                </div>
                <p className="text-slate-400 text-sm font-medium mb-1">Search for music</p>
                <p className="text-slate-600 text-xs">Type an artist, song, or album</p>
              </div>
            )}

            {/* Results */}
            {results.map(video => (
              <div
                key={video.id}
                onClick={() => playItem(video)}
                className={clsx(
                  "flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/60 transition-colors cursor-pointer border-b border-slate-800/40 group",
                  nowPlaying?.id === video.id && "bg-blue-600/10"
                )}
              >
                {/* Thumbnail */}
                <div className="relative shrink-0 w-14 h-10 rounded-lg overflow-hidden bg-slate-800">
                  <img src={video.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
                  {nowPlaying?.id === video.id && isPlaying && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="flex gap-0.5 items-end h-3.5">
                        {[1, 1.5, 0.7].map((h, i) => (
                          <div
                            key={i}
                            className="w-1 bg-blue-400 rounded-full animate-[bounce_0.8s_infinite]"
                            style={{ height: `${h * 10}px`, animationDelay: `${i * 0.2}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={clsx("text-sm truncate", nowPlaying?.id === video.id ? "text-blue-300 font-medium" : "text-slate-200")}>
                    {video.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{video.channel}</p>
                </div>

                {/* Add to queue */}
                <button
                  onClick={e => { e.stopPropagation(); addToQueue(video); }}
                  title="Add to queue"
                  className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-slate-300 p-1.5 rounded transition-all"
                >
                  <Plus size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Player + Queue ────────────────────── */}
        <div className="flex flex-col flex-1 min-h-0">

          {/* Now Playing */}
          <div className="px-6 py-6 border-b border-slate-800 shrink-0">
            {nowPlaying ? (
              <div className="flex flex-col items-center text-center gap-5 max-w-xs mx-auto">
                {/* Thumbnail */}
                <div className="w-40 h-28 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl shadow-black/50">
                  <img src={nowPlaying.thumbnail} alt="" className="w-full h-full object-cover" />
                </div>

                {/* Title / channel */}
                <div className="w-full">
                  <p className="text-base font-semibold text-slate-100 truncate">{nowPlaying.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{nowPlaying.channel}</p>
                </div>

                {/* Progress bar */}
                <div className="w-full space-y-1.5">
                  <div
                    className="w-full h-1.5 bg-slate-800 rounded-full cursor-pointer group/prog relative"
                    onClick={seekTo}
                  >
                    <div
                      className="h-full bg-blue-500 group-hover/prog:bg-blue-400 rounded-full transition-all"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Transport controls */}
                <div className="flex items-center gap-6">
                  <button
                    onClick={playPrev}
                    className="text-slate-500 hover:text-slate-200 transition-colors disabled:opacity-30"
                    disabled={nowIdx === 0 && currentTime <= 3}
                  >
                    <SkipBack size={22} />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white shadow-xl shadow-blue-600/30 transition-colors"
                  >
                    {isPlaying
                      ? <Pause size={20} />
                      : <Play  size={20} className="ml-0.5" />
                    }
                  </button>
                  <button
                    onClick={playNext}
                    disabled={nowIdx === null || nowIdx >= queue.length - 1}
                    className="text-slate-500 hover:text-slate-200 transition-colors disabled:opacity-30"
                  >
                    <SkipForward size={22} />
                  </button>
                </div>

                {/* Volume */}
                <div className="flex items-center gap-2 w-full max-w-[180px]">
                  <button
                    onClick={() => setMuted(v => !v)}
                    className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
                  >
                    {muted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                  <input
                    type="range" min={0} max={100}
                    value={muted ? 0 : volume}
                    onChange={e => { setVolume(+e.target.value); setMuted(false); }}
                    className="flex-1 accent-blue-500"
                  />
                  <span className="text-xs text-slate-600 w-7 text-right tabular-nums">
                    {muted ? 0 : volume}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 text-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <Music2 size={24} className="text-slate-700" />
                </div>
                <div>
                  <p className="text-slate-500 text-sm font-medium">Nothing playing</p>
                  <p className="text-slate-700 text-xs mt-1">Search and click a song to start</p>
                </div>
              </div>
            )}
          </div>

          {/* Queue */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="px-4 py-2.5 border-b border-slate-800 flex items-center gap-2 sticky top-0 bg-slate-950/80 backdrop-blur z-10">
              <ListMusic size={13} className="text-slate-500" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Queue</span>
              <span className="text-xs text-slate-600">({queue.length})</span>
            </div>

            {queue.length === 0 ? (
              <p className="text-xs text-slate-700 italic text-center py-10 px-4">
                Queue is empty — click <Plus size={10} className="inline" /> next to a search result to add it
              </p>
            ) : (
              queue.map((video, idx) => (
                <div
                  key={`${video.id}-${idx}`}
                  onClick={() => { loadedVideoRef.current = null; setNowIdx(idx); }}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-800/60 transition-colors border-b border-slate-800/30 group",
                    idx === nowIdx && "bg-blue-600/10"
                  )}
                >
                  <span className={clsx("text-xs w-5 text-right shrink-0 font-mono", idx === nowIdx ? "text-blue-400" : "text-slate-700")}>
                    {idx + 1}
                  </span>
                  <div className="w-9 h-7 rounded overflow-hidden bg-slate-800 shrink-0">
                    <img src={video.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={clsx("text-xs truncate", idx === nowIdx ? "text-blue-300 font-medium" : "text-slate-300")}>
                      {video.title}
                    </p>
                    <p className="text-[10px] text-slate-600 truncate">{video.channel}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); removeFromQueue(idx); }}
                    className="opacity-0 group-hover:opacity-100 text-slate-700 hover:text-red-400 p-1 transition-all"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
