import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import ShareableCard from './ShareableCard';
import { 
  Book, 
  Plus, 
  Calendar, 
  ChevronRight, 
  Trash2, 
  X, 
  Save,
  RefreshCw,
  Search,
  BookOpen,
  Clock,
  Flame,
  Star,
  ExternalLink,
  LogOut,
  Lock,
  User as UserIcon,
  Share2,
  Check,
  Sparkles,
  Zap,
  Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

// --- Scripture Components ---

const ScriptureLink: React.FC<{ reference: string, onOpenBible?: (url: string) => void }> = ({ reference, onOpenBible }) => {
  const [verseText, setVerseText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const fetchVerse = async () => {
    if (verseText || !reference) return;
    setLoading(true);
    try {
      // Clean reference: remove common translation suffixes, handle "to" as range, and replace dots with colons
      const normalizedRef = reference
        .replace(/\s(NKJV|KJV|NIV|ESV|AMP|MSG|NLT|RSV|NASB)$/i, '')
        .replace(/\s?to\s?/gi, '-')
        .replace(/\./g, ':');
        
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(normalizedRef)}?translation=kjv`);
      const data = await res.json();
      if (data.text) {
        setVerseText(data.text);
      }
    } catch (err) {
      console.error("Verse fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <span 
      className="relative inline-block"
      onMouseEnter={() => {
        setShowTooltip(true);
        fetchVerse();
      }}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={(e) => {
        e.stopPropagation();
        if (onOpenBible) {
          onOpenBible(reference);
        }
      }}
    >
      <button 
        className="underline decoration-amber-400/30 decoration-1 underline-offset-4 hover:decoration-amber-500 hover:text-amber-800 transition-all cursor-pointer text-left font-medium"
      >
        {reference}
      </button>
      
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="absolute z-100 bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 bg-stone-900/95 backdrop-blur-md text-stone-50 p-5 rounded-2xl shadow-2xl text-sm font-serif pointer-events-none border border-white/10"
          >
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-stone-900/95 rotate-45 border-r border-b border-white/10" />
            {loading ? (
              <div className="flex items-center justify-center py-2">
                <RefreshCw size={16} className="animate-spin text-amber-500" />
              </div>
            ) : verseText ? (
              <p className="italic leading-relaxed text-stone-100 text-center">
                "{verseText.trim()}"
              </p>
            ) : (
              <p className="text-stone-400 text-xs italic text-center">Scripture details unavailable</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};

const ScriptureParser = ({ text, onOpenBible }: { text: string, onOpenBible?: (url: string) => void }) => {
  const scriptureRegex = /(([1-3]?\s?[A-Z][a-z]+)\s(\d+)(:|\.)(\d+)(\s*(?:-|to)\s*\d+)?(\s(?:NKJV|KJV|NIV|ESV|AMP|MSG|NLT|RSV|NASB))?)/gi;
  
  const matches = text.match(scriptureRegex) || [];
  
  let lastIndex = 0;
  const result = [];
  
  matches.forEach((match, i) => {
    const index = text.indexOf(match, lastIndex);
    result.push(text.substring(lastIndex, index));
    result.push(<ScriptureLink key={i} reference={match} onOpenBible={onOpenBible} />);
    lastIndex = index + match.length;
  });
  
  result.push(text.substring(lastIndex));
  
  return <>{result}</>;
};

// --- Types ---
interface Note {
  id: number;
  title: string;
  scripture: string;
  content: string;
  date: string;
  category: string;
  created_at: string;
  tags?: string[];
}

interface BibleVerse {
  reference: string;
  text: string;
}

interface Revelation {
  id: number;
  text: string;
  created_at: string;
}

const FALLBACK_VERSES = [
  { reference: "Romans 12:2 NKJV", text: "And do not be conformed to this world, but be transformed by the renewing of your mind, that you may prove what is that good and acceptable and perfect will of God." },
  { reference: "Philippians 1:6 NKJV", text: "Being confident of this very thing, that He who has begun a good work in you will complete it until the day of Jesus Christ." },
  { reference: "Colossians 1:28 NKJV", text: "Him we preach, warning every man and teaching every man in all wisdom, that we may present every man perfect in Christ Jesus." },
  { reference: "2 Corinthians 3:18 NKJV", text: "But we all, with unveiled face, beholding as in a mirror the glory of the Lord, are being transformed into the same image from glory to glory, just as by the Spirit of the Lord." }
];

// --- App Component ---

export default function App() {
      // Shared Library state
      const [activeTab, setActiveTab] = useState<'library' | 'shared'>('library');
      const [sharedNotes, setSharedNotes] = useState([]);
      const [sharedNoteForm, setSharedNoteForm] = useState({ title: '', scripture: '', content: '', date: new Date().toISOString().split('T')[0], author: '' });
      const [selectedSharedNote, setSelectedSharedNote] = useState<any | null>(null);
      const [sharedComments, setSharedComments] = useState([]);
      const [newComment, setNewComment] = useState('');

      // Fetch shared notes
      const fetchSharedNotes = useCallback(async () => {
        try {
          const res = await fetch('/api/shared-notes');
          const data = await res.json();
          setSharedNotes(data);
        } catch (err) {
          setSharedNotes([]);
        }
      }, []);

      // Add shared note
      const handleAddSharedNote = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
          const res = await fetch('/api/shared-notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sharedNoteForm)
          });
          if (res.ok) {
            setSharedNoteForm({ title: '', scripture: '', content: '', date: new Date().toISOString().split('T')[0], author: '' });
            fetchSharedNotes();
          }
        } catch (err) {}
      };

      // Fetch comments for a shared note
      const fetchSharedComments = useCallback(async (noteId: number) => {
        try {
          const res = await fetch(`/api/shared-notes/${noteId}/comments`);
          const data = await res.json();
          setSharedComments(data);
        } catch (err) {
          setSharedComments([]);
        }
      }, []);

      // Add comment
      const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSharedNote) return;
        try {
          const res = await fetch(`/api/shared-notes/${selectedSharedNote.id}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ author: user?.name || '', text: newComment })
          });
          if (res.ok) {
            setNewComment('');
            fetchSharedComments(selectedSharedNote.id);
          }
        } catch (err) {}
      };

      useEffect(() => {
        if (activeTab === 'shared') fetchSharedNotes();
      }, [activeTab, fetchSharedNotes]);

      useEffect(() => {
        if (selectedSharedNote) fetchSharedComments(selectedSharedNote.id);
      }, [selectedSharedNote, fetchSharedComments]);
    // Bible Study Tools state
    const [showBibleTools, setShowBibleTools] = useState(false);
    const [bibleSearch, setBibleSearch] = useState('');
    const [bibleVersion, setBibleVersion] = useState('KJV');
    const [parallelVersion, setParallelVersion] = useState('NKJV');
    const [bibleResults, setBibleResults] = useState<any | null>(null);
    const [parallelResults, setParallelResults] = useState<any | null>(null);

    // Fetch Bible passage for selected version
    const fetchBiblePassage = async (reference: string, version: string, setResults: (data: any) => void) => {
      setResults(null);
      try {
        // Example: Use bible-api.com for KJV, NKJV, etc. (expand for more APIs)
        const url = `https://bible-api.com/${encodeURIComponent(reference)}?translation=${version.toLowerCase()}`;
        const res = await fetch(url);
        const data = await res.json();
        setResults(data);
      } catch (err) {
        setResults({ error: 'Could not fetch passage.' });
      }
    };

    // Handle Bible search
    const handleBibleSearch = () => {
      if (!bibleSearch) return;
      fetchBiblePassage(bibleSearch, bibleVersion, setBibleResults);
      fetchBiblePassage(bibleSearch, parallelVersion, setParallelResults);
    };
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [randomVerse, setRandomVerse] = useState<BibleVerse | null>(null);
  const [randomSermon, setRandomSermon] = useState<Note | null>(null);
  const [dailySermons, setDailySermons] = useState<Note[]>([]);
  const [isLoadingVerse, setIsLoadingVerse] = useState(false);
  const [isLoadingRandomSermon, setIsLoadingRandomSermon] = useState(false);
  const [biblePassageReference, setBiblePassageReference] = useState<string | null>(null);
  const [biblePassageData, setBiblePassageData] = useState<any | null>(null);
  const [isLoadingBible, setIsLoadingBible] = useState(false);
  const [revelations, setRevelations] = useState<Revelation[]>([]);
  const [newRevelation, setNewRevelation] = useState('');
  const [newNote, setNewNote] = useState({ 
    title: '', 
    scripture: '', 
    content: '', 
    category: 'General',
    date: new Date().toISOString().split('T')[0],
    tags: ''
  });
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [uploadedMedia, setUploadedMedia] = useState<any[]>([]);
  
  // Auth State
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [isCookieBlocked, setIsCookieBlocked] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [magicUrl, setMagicUrl] = useState('');
  const [isMagicFilling, setIsMagicFilling] = useState(false);
  const [disableGeminiVerseApi, setDisableGeminiVerseApi] = useState(false);
  const [showIosInstallHint, setShowIosInstallHint] = useState(false);
  
  useEffect(() => {
    // Basic check for third-party cookies / storage
    try {
      localStorage.setItem('cookie_test', 'test');
      localStorage.removeItem('cookie_test');
      
      // Also try setting a test cookie
      document.cookie = "test_cookie=1; SameSite=None; Secure";
      const cookieEnabled = document.cookie.indexOf("test_cookie=1") !== -1;
      if (!cookieEnabled) {
        console.warn("Cookies appear to be disabled or blocked in this context.");
        setIsCookieBlocked(true);
      }
    } catch (e) {
      console.error("Storage/Cookie access blocked:", e);
      setIsCookieBlocked(true);
    }
  }, []);

  const handleShare = async (note: Note) => {
    const shareData = {
      title: note.title,
      text: `Sermon Note: ${note.title}\n\nScripture: ${note.scripture || 'N/A'}\n\n${note.content.substring(0, 200)}...`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}\n\nShared from Sermon Companion`);
        setIsSharing(true);
        setTimeout(() => setIsSharing(false), 2000);
      } catch (err) {
        console.error("Copy failed", err);
      }
    }
  };

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/status', { credentials: 'include' });
      const data = await res.json();
      setUser(data.user);
      setIsAdmin(data.isAdmin);
    } catch (err) {
      console.error("Auth check failed", err);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const hasGoogleClientId = !!(import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!hasGoogleClientId || !window.google || user || !showLogin) return;
    const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleResponse
    });
    const el = document.getElementById("google-login-btn");
    if (el) window.google.accounts.id.renderButton(el, { theme: "outline", size: "large", width: 240 });
  }, [user, isAuthLoading, hasGoogleClientId, showLogin]);

  const handleGoogleResponse = async (response: any) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setIsAdmin(!!data.isAdmin);
        setAuthError('');
        setShowLogin(false);
      } else {
        setAuthError(data.error || 'Login failed');
      }
    } catch (err) {
      setAuthError('Connection error');
    }
  };

  const handlePasscodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setIsAdmin(!!data.isAdmin);
        setUser(data.user || { name: data.isAdmin ? 'Admin' : 'Friend' });
        setAuthError('');
        setShowLogin(false);
      } else {
        setAuthError('Invalid passcode');
      }
    } catch (err) {
      setAuthError('Connection error');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      setUser(null);
      setIsAdmin(false);
      setShowLogin(false);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallBtn(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/crios|fxios|edgios|opr\//.test(ua);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    const dismissed = localStorage.getItem('sermo_ios_install_hint_dismissed') === '1';

    if (isIOS && isSafari && !isStandalone && !dismissed) {
      setShowIosInstallHint(true);
    }
  }, []);

  const dismissIosInstallHint = () => {
    setShowIosInstallHint(false);
    localStorage.setItem('sermo_ios_install_hint_dismissed', '1');
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/notes', { credentials: 'include' });
      if (res.status === 401) {
        console.error("Session expired or invalid");
        setUser(null);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotes(data);
      } else {
        console.error("Notes data is not an array:", data);
        setNotes([]);
      }
    } catch (err) {
      console.error("Failed to fetch notes", err);
      setNotes([]);
    }
  }, [user]);

  const fetchRevelations = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/revelations', { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setRevelations(data);
      } else {
        setRevelations([]);
      }
    } catch (err) {
      console.error("Failed to fetch revelations", err);
      setRevelations([]);
    }
  }, [user]);

  const fetchRandomVerse = async () => {
    setIsLoadingVerse(true);
    try {
      const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || (import.meta as any).env?.VITE_GEMINI_API_KEY;
      const isPlaceholderKey = !apiKey || /your_|placeholder|example|replace/i.test(String(apiKey));
      
      if (isPlaceholderKey || disableGeminiVerseApi) {
        // No key: use fallback without calling API (avoids 400 error spam)
        const randomIndex = Math.floor(Math.random() * FALLBACK_VERSES.length);
        setRandomVerse(FALLBACK_VERSES[randomIndex]);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: "Give me a random, uplifting, and encouraging Bible verse from any book (Genesis to Revelation). Return it in JSON format with 'text' (the verse) and 'reference' (Book Chapter:Verse Version). Choose a different one every time.",
        config: { responseMimeType: "application/json" }
      });
      
      const data = JSON.parse(response.text || '{}');
      if (data.text && data.reference) {
        setRandomVerse(data);
      } else {
        throw new Error("Invalid AI response");
      }
    } catch (err: any) {
      const message = String(err?.message || '');
      if (message.includes('400') || message.includes('401') || message.includes('403')) {
        setDisableGeminiVerseApi(true);
        console.warn('Gemini random verse disabled for this session due to API error. Falling back to local verses.');
      }
      const randomIndex = Math.floor(Math.random() * FALLBACK_VERSES.length);
      setRandomVerse(FALLBACK_VERSES[randomIndex]);
    } finally {
      setIsLoadingVerse(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchRandomVerse();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchRandomVerse();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchRandomSermon = async () => {
    setIsLoadingRandomSermon(true);
    try {
      const res = await fetch('/api/notes/random', { credentials: 'include' });
      const data = await res.json();
      setRandomSermon(data);
    } catch (err) {
      console.error("Failed to fetch random sermon", err);
    } finally {
      setIsLoadingRandomSermon(false);
    }
  };

  const fetchDailySermons = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/notes', { credentials: 'include' });
      const allNotes = await res.json();
      if (Array.isArray(allNotes) && allNotes.length > 0) {
        // Shuffle and take up to 3
        const shuffled = [...allNotes].sort(() => 0.5 - Math.random());
        setDailySermons(shuffled.slice(0, 3));
      }
    } catch (err) {
      console.error("Failed to fetch daily sermons", err);
    }
  }, [user]);

  const openBibleReader = async (reference: string) => {
    // Clean reference: remove common translation suffixes, handle "to" as range, and replace dots with colons
    const normalizedRef = reference
      .replace(/\s(NKJV|KJV|NIV|ESV|AMP|MSG|NLT|RSV|NASB)$/i, '')
      .replace(/\s?to\s?/gi, '-')
      .replace(/\./g, ':');
      
    setBiblePassageReference(reference);
    setBiblePassageData(null);
    setIsLoadingBible(true);
    try {
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(normalizedRef)}?translation=kjv`);
      const data = await res.json();
      setBiblePassageData(data);
    } catch (err) {
      console.error("Bible fetch error", err);
    } finally {
      setIsLoadingBible(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotes();
      fetchRevelations();
      fetchRandomVerse();
      fetchRandomSermon();
      fetchDailySermons();
    }
  }, [user, fetchNotes, fetchDailySermons, fetchRevelations]);

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.title || !newNote.content) return;

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote),
        credentials: 'include'
      });
      if (res.ok) {
        setNewNote({ title: '', scripture: '', content: '', date: new Date().toISOString().split('T')[0], tags: '' });
        setUploadedMedia([]);
        setIsAddingNote(false);
        fetchNotes();
      }
    } catch (err) {
      console.error("Failed to save note", err);
    }
  };

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNote || !editNote.title || !editNote.content) return;

    try {
      const res = await fetch(`/api/notes/${editNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editNote),
        credentials: 'include'
      });
      if (res.ok) {
        setIsEditingNote(false);
        setEditNote(null);
        setUploadedMedia([]);
        fetchNotes();
        // Update selected note if it's the one we just edited
        if (selectedNote?.id === editNote.id) {
          setSelectedNote(editNote);
        }
      }
    } catch (err) {
      console.error("Failed to update note", err);
    }
  };

  const handleAddRevelation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRevelation.trim()) return;
    try {
      const res = await fetch('/api/revelations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newRevelation }),
        credentials: 'include'
      });
      if (res.ok) {
        setNewRevelation('');
        fetchRevelations();
      }
    } catch (err) {
      console.error("Failed to add revelation", err);
    }
  };

  const deleteRevelation = async (id: number) => {
    try {
      const res = await fetch(`/api/revelations/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        fetchRevelations();
      }
    } catch (err) {
      console.error("Failed to delete revelation", err);
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (!confirm("Delete this sermon note?")) return;
    try {
      await fetch(`/api/notes/${id}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      fetchNotes();
      if (selectedNote?.id === id) setSelectedNote(null);
    } catch (err) {
      console.error("Failed to delete note", err);
    }
  };

  useEffect(() => {
    const savedBookmarks = localStorage.getItem('sermon_bookmarks');
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }
  }, []);

  const toggleBookmark = (id: number) => {
    const newBookmarks = bookmarks.includes(id) 
      ? bookmarks.filter(b => b !== id) 
      : [...bookmarks, id];
    setBookmarks(newBookmarks);
    localStorage.setItem('sermon_bookmarks', JSON.stringify(newBookmarks));
  };

  const handleMagicFill = async () => {
    if (!magicUrl) return;
    setIsMagicFilling(true);
    try {
      const res = await fetch('/api/magic-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: magicUrl }),
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setNewNote({
          ...newNote,
          title: data.title || '',
          scripture: data.scripture || '',
          content: data.content || '',
          date: data.date || new Date().toISOString().split('T')[0]
        });
        setMagicUrl('');
      }
    } catch (err) {
      console.error("Magic fill failed", err);
    } finally {
      setIsMagicFilling(false);
    }
  };

  const filteredNotes = (Array.isArray(notes) ? notes : []).filter(note => {
    const matchesSearch = (note.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (note.content?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (note.scripture?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#fdfcf9] flex items-center justify-center">
        <RefreshCw className="text-amber-600 animate-spin" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fdfcf9] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-stone-100 overflow-hidden"
        >
          {isCookieBlocked && (
            <div className="bg-red-50 p-4 border-b border-red-100 text-red-600 text-xs font-medium text-center">
              ⚠️ Browser storage or cookies appear to be blocked. This app requires cookies to stay logged in.
            </div>
          )}
          <div className="p-8 text-center bg-stone-50 border-b border-stone-100">
            <div className="w-16 h-16 bg-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Flame className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-serif font-bold text-stone-800">Sermon Companion</h1>
            <p className="text-stone-500 text-sm mt-2">Private access for friends and family</p>
          </div>
          
          <div className="p-8 space-y-6">
            {hasGoogleClientId && <div id="google-login-btn" className="w-full"></div>}
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-stone-400 font-bold tracking-widest">Or use passcode</span>
              </div>
            </div>

            <form onSubmit={handlePasscodeLogin} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input 
                  type="password" 
                  placeholder="Enter access code"
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-serif"
                  value={passcode}
                  onChange={e => setPasscode(e.target.value)}
                />
              </div>
              {authError && <p className="text-red-500 text-xs text-center font-medium">{authError}</p>}
              <button 
                type="submit"
                className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-stone-800 transition-all shadow-md active:scale-95"
              >
                Enter Sanctuary
              </button>
            </form>
          </div>
          
          <div className="p-4 bg-stone-50 text-center border-t border-stone-100">
            <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">
              Secure Spiritual Archive
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfcf9] text-stone-900 font-sans overflow-x-hidden">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-30 bg-white border-b border-stone-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex flex-wrap items-center gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-amber-600 p-2 rounded-lg shadow-inner">
            <Flame className="text-white" size={20} />
          </div>
          <h1 className="text-base sm:text-lg md:text-xl font-serif font-bold tracking-tight text-stone-800">Sermon Companion</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 w-full lg:flex-1 lg:w-auto lg:justify-end">
          <div className="relative w-full lg:flex-1 lg:max-w-md order-3 lg:order-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input 
              type="text" 
              placeholder="Search library..."
              className="pl-10 pr-10 py-2 sm:py-2.5 bg-stone-50 border border-stone-100 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 rounded-full text-sm transition-all w-full outline-none font-serif"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {isAdmin && (
            <button 
              onClick={() => setIsAddingNote(true)}
              className="order-1 lg:order-0 flex items-center gap-2 bg-stone-900 text-stone-50 px-3 sm:px-4 py-2 rounded-full hover:bg-stone-800 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm font-semibold shrink-0"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">New Entry</span>
            </button>
          )}

          {!user && (
            <button 
              onClick={() => setShowLogin(true)}
              className="order-2 lg:order-0 flex items-center gap-2 bg-amber-600 text-white px-3 sm:px-4 py-2 rounded-full hover:bg-amber-700 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm font-bold shrink-0"
            >
              <Lock size={16} />
              <span>Login</span>
            </button>
          )}

          {showInstallBtn && (
            <button 
              onClick={handleInstallClick}
              className="order-2 lg:order-0 flex items-center gap-2 bg-amber-600 text-white px-3 sm:px-4 py-2 rounded-full hover:bg-amber-700 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm font-bold shrink-0 animate-pulse"
            >
              <span className="text-lg">✨</span>
              <span>Install App</span>
            </button>
          )}

          {user ? (
            <div className="ml-auto lg:ml-0 flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-stone-200">
              <div className="hidden md:block text-right">
                <p className="text-xs font-bold text-stone-800">{user?.name || 'Admin'}</p>
                <p className="text-[10px] text-stone-400 uppercase tracking-widest">Authorized</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <div className="pl-4 border-l border-stone-200">
              <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Public Library</p>
            </div>
          )}
        </div>
      </nav>

      {showIosInstallHint && (
        <div className="mx-3 sm:mx-4 md:mx-6 mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 sm:px-5 sm:py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-amber-700">
              <Share2 size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-bold text-amber-900">Install on iPhone</p>
              <p className="mt-1 text-xs sm:text-sm text-amber-800 leading-relaxed">
                Tap Safari Share, then choose Add to Home Screen to place the app icon on your device.
              </p>
            </div>
            <button
              type="button"
              onClick={dismissIosInstallHint}
              className="rounded-full p-1 text-amber-700 hover:bg-amber-100 transition-colors"
              aria-label="Dismiss install hint"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 p-3 sm:p-4 md:p-6">
        {/* Tab Switcher */}
        {selectedSharedNote && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setSelectedSharedNote(null)} />
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-3xl rounded-2xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                    <div className="px-4 sm:px-6 md:px-10 py-4 sm:py-6 md:py-8 border-b border-stone-100 flex justify-between items-center gap-3">
                      <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-amber-600 line-clamp-2">{selectedSharedNote.title}</h2>
                      <button onClick={() => setSelectedSharedNote(null)} className="text-stone-400 hover:text-stone-900"><X size={28} /></button>
                    </div>
                    <div className="p-4 sm:p-6 md:p-10 space-y-6 overflow-y-auto">
                      <div className="text-xs text-amber-600 font-bold mb-2">{selectedSharedNote.author || 'Anonymous'} | {new Date(selectedSharedNote.date).toLocaleDateString()}</div>
                      {selectedSharedNote.scripture && <div className="text-xs text-stone-500 mb-2 italic font-serif">{selectedSharedNote.scripture}</div>}
                      <div className="text-stone-800 text-base sm:text-lg font-serif whitespace-pre-wrap mb-6 wrap-break-word">{selectedSharedNote.content}</div>
                      {/* Comments Section */}
                      <div className="bg-stone-50 rounded-xl border border-stone-200 p-6">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">Comments</h4>
                        <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                          {sharedComments.length > 0 ? sharedComments.map(c => (
                            <div key={c.id} className="flex items-start gap-3 group border-b border-stone-50 pb-3 last:border-0">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                              <div className="flex-1">
                                <p className="text-xs font-serif leading-relaxed text-stone-700">{c.text}</p>
                                <p className="text-[8px] text-stone-300 uppercase tracking-widest font-bold mt-1">{c.author || 'Anonymous'} • {new Date(c.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          )) : <p className="text-[10px] text-stone-300 italic text-center py-4">No comments yet.</p>}
                        </div>
                        <form onSubmit={handleAddComment} className="mt-6 flex flex-col sm:flex-row gap-2">
                          <input type="text" placeholder="Add a comment..." className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm font-serif" value={newComment} onChange={e => setNewComment(e.target.value)} />
                          <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-700 transition-all">Comment</button>
                        </form>
                      </div>
                    </div>
                  </motion.div>
                </div>
        </AnimatePresence>
        )}
        
        {/* Left Sidebar: Random Verse & Stats */}
        <aside className="lg:col-span-3 space-y-6">
          <section className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Star size={80} className="text-amber-600" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Daily Inspiration</h3>
                <button 
                  onClick={fetchRandomVerse}
                  disabled={isLoadingVerse}
                  className="text-stone-300 hover:text-amber-600 transition-colors"
                >
                  <RefreshCw size={14} className={isLoadingVerse ? 'animate-spin' : ''} />
                </button>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={randomVerse?.reference}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-3"
                >
                  <p className="text-stone-700 font-serif italic leading-relaxed text-lg">
                    "{randomVerse?.text}"
                  </p>
                  <p className="text-xs font-bold text-stone-900 uppercase tracking-widest">
                    — {randomVerse?.reference}
                  </p>
                </motion.div>
              </AnimatePresence>
              <div className="mt-4 pt-4 border-t border-stone-50 flex items-center gap-2 text-[9px] text-stone-400 uppercase tracking-wider">
                <Timer size={10} className="animate-pulse" />
                <span>Auto-refreshing every minute</span>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-6">Library Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500 font-serif italic">Total Sermons</span>
                <span className="text-sm font-bold bg-stone-50 px-2 py-1 rounded-lg border border-stone-100">{notes.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500 font-serif italic">This Month</span>
                <span className="text-sm font-bold bg-stone-50 px-2 py-1 rounded-lg border border-stone-100">
                  {notes.filter(n => new Date(n.date).getMonth() === new Date().getMonth()).length}
                </span>
              </div>
            </div>
            <button 
              onClick={fetchNotes}
              className="mt-4 w-full flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-stone-400 hover:text-amber-600 transition-colors py-2 border-t border-stone-50"
            >
              <RefreshCw size={12} />
              Refresh Library
            </button>
          </section>

          {/* Random Sermon Prompt Section */}
          <section className="bg-amber-900 text-amber-50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <BookOpen size={100} />
            </div>
            <div className="relative z-10">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400 mb-4">Daily Meditations</h3>
              {dailySermons.length > 0 ? (
                <div className="space-y-3">
                                  <label className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">Tags</label>
                                  <input 
                                    type="text" 
                                    placeholder="e.g. faith, prayer, grace"
                                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-serif text-lg"
                                    value={newNote.tags}
                                    onChange={e => setNewNote({...newNote, tags: e.target.value})}
                                  />
                  {dailySermons.map(sermon => (
                    <button 
                      key={sermon.id}
                      onClick={() => setSelectedNote(sermon)}
                      className="w-full text-left bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all group"
                    >
                      <p className="text-xs font-serif italic leading-tight line-clamp-2 group-hover:text-white">
                        {sermon.title}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-amber-200 font-serif italic">No sermons to revisit yet.</p>
              )}
              <button 
                onClick={fetchDailySermons}
                className="mt-4 text-[10px] uppercase tracking-widest text-amber-400 hover:text-white transition-colors flex items-center gap-2"
              >
                <RefreshCw size={10} />
                Refresh Daily List
              </button>
            </div>
          </section>

          {/* Daily Meditation Scripture Section */}
          <section className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-4">My Daily Meditation Scripture</h3>
            {isAdmin && (
              <form onSubmit={handleAddRevelation} className="mb-6">
                <div className="relative">
                  <textarea 
                    rows={3}
                    placeholder="Jot down your revelation..."
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-serif resize-none custom-scrollbar"
                    value={newRevelation}
                    onChange={e => setNewRevelation(e.target.value)}
                  />
                  <button type="submit" className="absolute right-3 bottom-3 text-amber-600 hover:text-amber-700 bg-white p-1 rounded-lg shadow-sm">
                    <Plus size={16} />
                  </button>
                </div>
              </form>
            )}
            <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {revelations.length > 0 ? revelations.map(rev => (
                <div key={rev.id} className="flex items-start gap-3 group border-b border-stone-50 pb-3 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-serif leading-relaxed text-stone-700">
                      {rev.text}
                    </p>
                    <p className="text-[8px] text-stone-300 uppercase tracking-widest font-bold mt-1">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => deleteRevelation(rev.id)}
                      className="text-stone-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              )) : (
                <p className="text-[10px] text-stone-300 italic text-center py-4">The scrolls are waiting for your insights.</p>
              )}
            </div>
          </section>

          {isAdmin && (
            <section className="bg-stone-900 text-stone-400 rounded-2xl p-6 shadow-sm border border-stone-800">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500 mb-4">Admin Controls</h3>
              <div className="space-y-4">
                <div className="p-3 bg-stone-800/50 rounded-xl border border-stone-700/50">
                  <p className="text-[9px] uppercase tracking-widest font-bold text-stone-500 mb-1">Owner Access</p>
                  <p className="text-xs text-stone-300 font-serif italic">You have full authority to add, edit, and delete entries.</p>
                </div>
                <div className="p-3 bg-stone-800/50 rounded-xl border border-stone-700/50">
                  <p className="text-[9px] uppercase tracking-widest font-bold text-stone-500 mb-1">Friends Access</p>
                  <p className="text-xs text-stone-300 font-serif italic">Give friends the "View-Only" passcode to let them browse your library.</p>
                </div>
              </div>
            </section>
          )}
        </aside>

        {/* Main Content: Notes List */}
        <main className="lg:col-span-9 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-800 flex items-center gap-3">
              <BookOpen size={24} className="text-amber-600" />
              Spiritual Library
            </h2>
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2 flex-wrap">
              <Book size={14} />
              All Sermons
              <span className="mx-2 opacity-20">|</span>
              {filteredNotes.length} Entries Found
            </div>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 md:p-16 text-center shadow-sm">
              <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="text-stone-300" size={40} />
              </div>
              <h3 className="text-xl font-serif font-bold text-stone-700">
                {searchQuery ? 'No matches found' : 'Your library is empty'}
              </h3>
              <p className="text-stone-500 mt-2 font-serif italic">
                {searchQuery ? `We couldn't find any entries for "${searchQuery}"` : 'Capture the word and keep it in your heart.'}
              </p>
              
              <div className="mt-8 flex flex-col items-center gap-4">
                <button 
                  onClick={() => {
                    fetchNotes();
                    fetchDailySermons();
                  }}
                  className="flex items-center gap-2 text-amber-600 font-bold hover:underline"
                >
                  <RefreshCw size={16} />
                  Refresh Library
                </button>

                {isAdmin && !searchQuery && (
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => setIsAddingNote(true)}
                      className="bg-stone-900 text-stone-50 px-8 py-3 rounded-full font-bold hover:bg-stone-800 transition-all shadow-lg"
                    >
                      Capture Your First Revelation
                    </button>
                    <button 
                      onClick={async () => {
                        const res = await fetch('/api/debug/db');
                        const data = await res.json();
                        alert(`DB Status: ${data.notesCount} notes, ${data.revelationsCount} revelations`);
                      }}
                      className="text-[10px] text-stone-400 uppercase tracking-widest hover:text-stone-600"
                    >
                      Check DB Status
                    </button>
                  </div>
                )}
              </div>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-8 text-amber-600 font-bold hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {filteredNotes.map(note => (
                <motion.div 
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm hover:shadow-xl transition-all group cursor-pointer border-b-4 border-b-transparent hover:border-b-amber-500"
                  onClick={() => setSelectedNote(note)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                      <Calendar size={10} />
                      {new Date(note.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(note.id);
                        }}
                        className={`p-1 transition-all ${bookmarks.includes(note.id) ? 'text-red-500' : 'text-stone-300 hover:text-red-400'}`}
                      >
                        <Star size={16} fill={bookmarks.includes(note.id) ? 'currentColor' : 'none'} />
                      </button>
                      {isAdmin && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                          className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-800 mb-3 group-hover:text-amber-700 transition-colors line-clamp-2 leading-tight wrap-break-word">
                    {note.title}
                  </h3>
                  {note.scripture && (
                    <div className="flex items-center gap-2 text-xs text-stone-500 mb-4 italic font-serif">
                      <BookOpen size={14} className="text-stone-300" />
                      <ScriptureLink reference={note.scripture} onOpenBible={openBibleReader} />
                    </div>
                  )}
                  <div className="text-stone-600 text-sm line-clamp-4 leading-relaxed font-serif">
                    <ScriptureParser text={note.content} onOpenBible={openBibleReader} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Note Detail Modal */}
      <AnimatePresence>
        {selectedNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
              onClick={() => setSelectedNote(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-4xl rounded-2xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            >
              <div className="p-4 sm:p-6 md:p-8 border-b border-stone-100 flex justify-between items-start sm:items-center gap-4 bg-stone-50/50">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-100 text-amber-600 p-3 rounded-2xl shadow-inner">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-stone-800 leading-tight wrap-break-word">{selectedNote.title}</h2>
                    <p className="text-[10px] text-stone-400 uppercase tracking-[0.3em] font-bold mt-1">
                      {new Date(selectedNote.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedNote(null)} className="text-stone-400 hover:text-stone-900 p-2 rounded-full hover:bg-stone-100 transition-all">
                  <X size={28} />
                </button>
              </div>
              
              <div className="p-4 sm:p-6 md:p-10 overflow-y-auto space-y-6 sm:space-y-8 md:space-y-10 custom-scrollbar">
                {selectedNote.scripture && (
                  <div className="bg-amber-50/50 border-l-4 border-amber-500 p-4 sm:p-6 md:p-8 rounded-r-3xl">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 mb-3">Anchor Scripture</h4>
                    <div className="font-serif text-xl sm:text-2xl italic text-stone-800 leading-relaxed wrap-break-word">
                      <ScriptureLink reference={selectedNote.scripture} onOpenBible={openBibleReader} />
                    </div>
                  </div>
                )}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300 border-b border-stone-100 pb-2">Sermon Content</h4>
                  <div className="text-stone-800 text-base sm:text-lg md:text-xl leading-[1.8] whitespace-pre-wrap font-serif wrap-break-word">
                    <ScriptureParser text={selectedNote.content} onOpenBible={openBibleReader} />
                  </div>
                </div>
                {/* Display attached media for this note */}
                {selectedNote.media && selectedNote.media.length > 0 && (
                  <div className="space-y-4 mt-8">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 mb-2">Attached Media</h4>
                    {selectedNote.media.map((media, idx) => (
                      <div key={idx} className="border border-stone-200 rounded-xl p-2 bg-white">
                        {media.type.startsWith('image') && (
                          <img src={media.url} alt={media.filename} className="max-w-xs max-h-40 rounded-lg" />
                        )}
                        {media.type.startsWith('audio') && (
                          <audio controls src={media.url} className="w-full" />
                        )}
                        {media.type.startsWith('video') && (
                          <video controls src={media.url} className="w-full max-h-40 rounded-lg" />
                        )}
                        <div className="text-xs text-stone-400 mt-1">{media.filename}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-6 md:p-8 border-t border-stone-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-stone-50/30">
                <div className="flex flex-col sm:flex-row gap-3">
                  {isAdmin && (
                    <button 
                      onClick={() => {
                        setEditNote(selectedNote);
                        setUploadedMedia([]);
                        setIsEditingNote(true);
                      }}
                      className="px-6 py-3 border border-stone-200 text-stone-600 rounded-full font-bold hover:bg-white transition-all text-sm"
                    >
                      Edit Note
                    </button>
                  )}
                  <button 
                    onClick={() => handleShare(selectedNote)}
                    className="flex items-center gap-2 px-6 py-3 border border-stone-200 text-stone-600 rounded-full font-bold hover:bg-white transition-all text-sm"
                  >
                    {isSharing ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
                    {isSharing ? 'Copied!' : 'Share'}
                  </button>
                </div>
                <button 
                  onClick={() => setSelectedNote(null)}
                  className="px-6 sm:px-10 py-3 bg-stone-900 text-stone-50 rounded-full font-bold hover:bg-stone-800 transition-all shadow-lg"
                >
                  Finished Reading
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Note Modal */}
      <AnimatePresence>
        {isEditingNote && editNote && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
              onClick={() => setIsEditingNote(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-3xl rounded-2xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            >
              <div className="px-4 sm:px-6 md:px-10 py-4 sm:py-6 md:py-8 border-b border-stone-100 flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-800">Edit Entry</h2>
                <button onClick={() => setIsEditingNote(false)} className="text-stone-400 hover:text-stone-900">
                  <X size={28} />
                </button>
              </div>
              
              <form onSubmit={handleUpdateNote} className="p-4 sm:p-6 md:p-10 space-y-6 sm:space-y-8 overflow-y-auto">
                {/* Magic Fill Section */}
                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-amber-600 font-bold flex items-center gap-2">
                      <Sparkles size={14} />
                      Magic Fill from URL
                    </label>
                    <span className="text-[10px] text-amber-400 font-medium italic">Paste a sermon URL to auto-fill</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                      type="url" 
                      placeholder="https://example.com/sermon-notes"
                      className="flex-1 bg-white border border-amber-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-serif"
                      value={magicUrl}
                      onChange={e => setMagicUrl(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={handleMagicFill}
                      disabled={isMagicFilling || !magicUrl}
                      className="bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-700 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {isMagicFilling ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                      Fill
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">Sermon Title</label>
                    <input 
                      autoFocus
                      type="text" 
                      required
                      placeholder="e.g. Understanding the Will of God"
                      className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-serif text-lg"
                      value={editNote.title}
                      onChange={e => setEditNote({...editNote, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">Service Date</label>
                    <input 
                      type="date" 
                      required
                      className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-serif"
                      value={editNote.date}
                      onChange={e => setEditNote({...editNote, date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">Anchor Scripture</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Romans 12:2 NKJV"
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-serif text-lg"
                    value={editNote.scripture}
                    onChange={e => setEditNote({...editNote, scripture: e.target.value})}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">Notes & Revelations</label>
                  <textarea 
                    required
                    rows={10}
                    placeholder="Capture the points, scriptures, and revelations..."
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-serif text-lg resize-none custom-scrollbar"
                    value={editNote.content}
                    onChange={e => setEditNote({...editNote, content: e.target.value})}
                  />
                </div>

                <div className="pt-6 flex flex-col-reverse sm:flex-row justify-end gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsEditingNote(false)}
                    className="px-8 py-4 rounded-full text-stone-500 hover:bg-stone-50 transition-colors font-bold uppercase text-xs tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex items-center gap-3 bg-stone-900 text-stone-50 px-10 py-4 rounded-full hover:bg-stone-800 transition-all shadow-xl font-bold uppercase text-xs tracking-widest"
                  >
                    <Save size={18} />
                    <span>Update Entry</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Note Modal */}
      <AnimatePresence>
        {isAddingNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
              onClick={() => setIsAddingNote(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-3xl rounded-2xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            >
              <div className="px-4 sm:px-6 md:px-10 py-4 sm:py-6 md:py-8 border-b border-stone-100 flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-800">New Entry</h2>
                <button onClick={() => setIsAddingNote(false)} className="text-stone-400 hover:text-stone-900">
                  <X size={28} />
                </button>
              </div>
              
              <form onSubmit={handleSaveNote} className="p-4 sm:p-6 md:p-10 space-y-6 sm:space-y-8 overflow-y-auto">
                                {/* AI Sermon Capture Section */}
                                <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100 space-y-3">
                                  <label className="text-[10px] uppercase tracking-[0.2em] text-amber-600 font-bold flex items-center gap-2">
                                    Paste YouTube Sermon Link
                                  </label>
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <input 
                                      type="url" 
                                      placeholder="https://youtube.com/watch?v=..."
                                      className="flex-1 bg-white border border-amber-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-serif"
                                      value={youtubeUrl}
                                      onChange={e => setYoutubeUrl(e.target.value)}
                                    />
                                    <button 
                                      type="button"
                                      onClick={async () => {
                                        setIsCapturing(true);
                                        setTranscript('');
                                        setAiSummary('');
                                        setTimeout(() => {
                                          setTranscript('Sample transcript from YouTube sermon...');
                                          setAiSummary('Sample AI summary: Key Message, Key Points, Scriptures...');
                                          setIsCapturing(false);
                                        }, 2000);
                                      }}
                                      disabled={!youtubeUrl || isCapturing}
                                      className="bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-700 transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                      {isCapturing ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                                      Capture
                                    </button>
                                  </div>
                                  {transcript && (
                                    <div className="mt-4">
                                      <label className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">Transcript</label>
                                      <textarea
                                        rows={4}
                                        className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 font-serif text-sm resize-none"
                                        value={transcript}
                                        readOnly
                                      />
                                    </div>
                                  )}
                                  {aiSummary && (
                                    <div className="mt-4">
                                      <label className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">AI Summary</label>
                                      <textarea
                                        rows={4}
                                        className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 font-serif text-sm resize-none"
                                        value={aiSummary}
                                        readOnly
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Unified Media Upload Section */}
                                <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100 space-y-3">
                                  <label className="text-[10px] uppercase tracking-[0.2em] text-amber-600 font-bold flex items-center gap-2">
                                    Attach Media (Audio, Video, Image)
                                  </label>
                                  <input
                                    type="file"
                                    accept="audio/*,video/*,image/*"
                                    multiple
                                    className="block w-full mb-2"
                                    disabled={!newNote.id}
                                    title={!newNote.id ? 'Save the note first to attach media' : undefined}
                                    onChange={async (e) => {
                                      const files = e.target.files;
                                      if (!files || files.length === 0) return;
                                      if (!newNote.id) {
                                        alert('Save the note first to attach media.');
                                        return;
                                      }
                                      const formData = new FormData();
                                      for (let i = 0; i < files.length; i++) {
                                        formData.append('media', files[i]);
                                      }
                                      formData.append('noteId', String(newNote.id));
                                      try {
                                        const res = await fetch('/api/media/upload', {
                                          method: 'POST',
                                          body: formData,
                                          credentials: 'include'
                                        });
                                        const data = await res.json();
                                        if (res.ok && data.media) {
                                          setUploadedMedia(prev => [...prev, ...data.media]);
                                        } else {
                                          alert(data.error || 'Media upload failed');
                                        }
                                      } catch (err) {
                                        alert('Media upload error');
                                      }
                                      e.target.value = '';
                                    }}
                                  />
                                  {/* Display uploaded media previews */}
                                  {uploadedMedia && uploadedMedia.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                      {uploadedMedia.map((media, idx) => (
                                        <div key={idx} className="border border-stone-200 rounded-xl p-2 bg-white">
                                          {media.type.startsWith('image') && (
                                            <img src={media.url} alt={media.filename} className="max-w-xs max-h-40 rounded-lg" />
                                          )}
                                          {media.type.startsWith('audio') && (
                                            <audio controls src={media.url} className="w-full" />
                                          )}
                                          {media.type.startsWith('video') && (
                                            <video controls src={media.url} className="w-full max-h-40 rounded-lg" />
                                          )}
                                          <div className="text-xs text-stone-400 mt-1">{media.filename}</div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                {/* Magic Fill Section */}
                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-amber-600 font-bold flex items-center gap-2">
                      <Sparkles size={14} />
                      Magic Fill from URL
                    </label>
                    <span className="text-[10px] text-amber-400 font-medium italic">Paste a sermon URL to auto-fill</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                      type="url" 
                      placeholder="https://example.com/sermon-notes"
                      className="flex-1 bg-white border border-amber-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-serif"
                      value={magicUrl}
                      onChange={e => setMagicUrl(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={handleMagicFill}
                      disabled={isMagicFilling || !magicUrl}
                      className="bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-700 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {isMagicFilling ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                      Fill
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">Sermon Title</label>
                    <input 
                      autoFocus
                      type="text" 
                      required
                      placeholder="e.g. Understanding the Will of God"
                      className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-serif text-lg"
                      value={newNote.title}
                      onChange={e => setNewNote({...newNote, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">Service Date</label>
                    <input 
                      type="date" 
                      required
                      className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-serif"
                      value={newNote.date}
                      onChange={e => setNewNote({...newNote, date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">Anchor Scripture</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Romans 12:2 NKJV"
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-serif text-lg"
                    value={newNote.scripture}
                    onChange={e => setNewNote({...newNote, scripture: e.target.value})}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">Notes & Revelations</label>
                  <textarea 
                    required
                    rows={10}
                    placeholder="Capture the points, scriptures, and revelations..."
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-serif text-lg resize-none custom-scrollbar"
                    value={newNote.content}
                    onChange={e => setNewNote({...newNote, content: e.target.value})}
                  />
                </div>

                <div className="pt-6 flex flex-col-reverse sm:flex-row justify-end gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsAddingNote(false)}
                    className="px-8 py-4 rounded-full text-stone-500 hover:bg-stone-50 transition-colors font-bold uppercase text-xs tracking-widest"
                  >
                    Discard
                  </button>
                  <button 
                    type="submit"
                    className="flex items-center gap-3 bg-stone-900 text-stone-50 px-10 py-4 rounded-full hover:bg-stone-800 transition-all shadow-xl font-bold uppercase text-xs tracking-widest"
                  >
                    <Save size={18} />
                    <span>Save Entry</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* In-App Bible Viewer Modal (API Driven) */}
      <AnimatePresence>
        {biblePassageReference && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
              onClick={() => setBiblePassageReference(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-3xl h-[88vh] sm:h-[80vh] rounded-2xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-4 sm:p-6 md:p-8 border-b border-stone-100 flex justify-between items-start sm:items-center gap-3 bg-stone-50">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-600 p-3 rounded-2xl shadow-lg">
                    <BookOpen className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-stone-800 wrap-break-word">{biblePassageReference}</h2>
                    <p className="text-[10px] text-stone-400 uppercase tracking-[0.3em] font-bold mt-1">
                      King James Version (KJV)
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setBiblePassageReference(null)}
                  className="text-stone-400 hover:text-stone-900 p-2 rounded-full hover:bg-stone-200 transition-all"
                >
                  <X size={28} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 bg-[#fdfcf9] custom-scrollbar">
                {isLoadingBible ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4">
                    <RefreshCw className="text-amber-600 animate-spin" size={40} />
                    <p className="text-stone-400 font-serif italic">Opening the scrolls...</p>
                  </div>
                ) : biblePassageData && biblePassageData.verses ? (
                  <div className="max-w-2xl mx-auto space-y-8">
                    <div className="space-y-6">
                      {biblePassageData.verses?.map((v: any) => (
                        <div key={`${v.chapter}-${v.verse}`} className="flex gap-4 group">
                          <span className="text-[10px] font-bold text-amber-600 mt-2 opacity-40 group-hover:opacity-100 transition-opacity">
                            {v.verse}
                          </span>
                          <p className="text-base sm:text-lg md:text-xl text-stone-800 leading-relaxed font-serif">
                            {v.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <X className="text-red-300" size={40} />
                    <p className="text-stone-500 font-serif italic">Could not find this passage. Please check the reference.</p>
                  </div>
                )}
              </div>

              <div className="p-6 text-center bg-stone-50 border-t border-stone-100">
                <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">
                  Direct API Connection &bull; Open Source Bible Data
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-16 py-12 text-center border-t border-stone-100">
        <p className="text-stone-300 text-[10px] font-bold uppercase tracking-[0.4em]">
          Sermon Companion &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
