'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';

interface BibleIndex {
  [bookName: string]: {
    hi: string;
    chapters: {
      [chapterNum: string]: {
        verseCount: number;
        chapterFile: string;
      };
    };
  };
}

interface BibleFull {
  en: {
    [bookName: string]: {
      name_en: string;
      name_hi: string;
      chapters: {
        [chapterNum: string]: {
          [verseNum: string]: string;
        };
      };
    };
  };
  hi: {
    [bookName: string]: {
      name_en: string;
      name_hi: string;
      chapters: {
        [chapterNum: string]: {
          [verseNum: string]: string;
        };
      };
    };
  };
}

type Workspace = 'search' | 'reader' | 'settings';

interface BibleState {
  activeWorkspace: Workspace;
  bibleIndex: BibleIndex | null;
  bibleFull: BibleFull | null;
  language: 'en' | 'hi';
  currentBook: string;
  currentChapter: string;
  currentVerse: string;
  readingVerseIndex: number;  // White highlight - current reading position
  readingSlideIndex: number;   // White highlight slide index for split verses
  liveVerseIndex: number;    // Green highlight - live/presentation mode
  presentationSlideIndex: number;  // Current slide index for split verses
  presentationTotalSlides: number;  // Total slides for current verse
  searchQuery: string;
  justNavigatedFromSearch: boolean;  // Flag to prevent Enter toggle after search navigation
}

type Action =
  | { type: 'SET_WORKSPACE'; payload: Workspace }
  | { type: 'SET_BIBLE_DATA'; payload: { index: BibleIndex; full: BibleFull } }
  | { type: 'SET_LANGUAGE'; payload: 'en' | 'hi' }
  | { type: 'SET_LOCATION'; payload: { book: string; chapter: string; verse: string } }
  | { type: 'SET_READING_VERSE'; payload: number }
  | { type: 'SET_READING_SLIDE'; payload: number }
  | { type: 'SET_LIVE_VERSE'; payload: number }
  | { type: 'CLEAR_LIVE_VERSE' }
  | { type: 'SET_PRESENTATION_SLIDE'; payload: { index: number; total: number } }
  | { type: 'CLEAR_PRESENTATION_SLIDES' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_JUST_NAVIGATED'; payload: boolean };

const initialState: BibleState = {
  activeWorkspace: 'search',
  bibleIndex: null,
  bibleFull: null,
  language: 'en',
  currentBook: '',
  currentChapter: '',
  currentVerse: '',
  readingVerseIndex: -1,
  readingSlideIndex: 0,
  liveVerseIndex: -1,
  presentationSlideIndex: 0,
  presentationTotalSlides: 1,
  searchQuery: '',
  justNavigatedFromSearch: false,
};

function reducer(state: BibleState, action: Action): BibleState {
  switch (action.type) {
    case 'SET_WORKSPACE':
      return { ...state, activeWorkspace: action.payload };
    case 'SET_BIBLE_DATA':
      return { ...state, bibleIndex: action.payload.index, bibleFull: action.payload.full };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'SET_LOCATION':
      return { 
        ...state, 
        currentBook: action.payload.book, 
        currentChapter: action.payload.chapter, 
        currentVerse: action.payload.verse,
        readingVerseIndex: -1,
        readingSlideIndex: 0,
        liveVerseIndex: -1,
        presentationSlideIndex: 0,
        presentationTotalSlides: 1
      };
    case 'SET_READING_VERSE':
      return { ...state, readingVerseIndex: action.payload, readingSlideIndex: 0 };
    case 'SET_READING_SLIDE':
      return { ...state, readingSlideIndex: action.payload };
    case 'SET_LIVE_VERSE':
      return { ...state, liveVerseIndex: action.payload };
    case 'CLEAR_LIVE_VERSE':
      return { ...state, liveVerseIndex: -1, presentationSlideIndex: 0, presentationTotalSlides: 1 };
    case 'SET_PRESENTATION_SLIDE':
      return { ...state, presentationSlideIndex: action.payload.index, presentationTotalSlides: action.payload.total };
    case 'CLEAR_PRESENTATION_SLIDES':
      return { ...state, presentationSlideIndex: 0, presentationTotalSlides: 1 };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_JUST_NAVIGATED':
      return { ...state, justNavigatedFromSearch: action.payload };
    default:
      return state;
  }
}

interface BibleContextValue {
  state: BibleState;
  setWorkspace: (w: Workspace) => void;
  setLanguage: (lang: 'en' | 'hi') => void;
  setLocation: (book: string, chapter: string, verse: string) => void;
  setReadingVerse: (index: number) => void;
  setReadingSlide: (slideIndex: number) => void;
  toggleLiveVerse: (index: number, slideIndex?: number) => void;
  setPresentationSlide: (index: number, total: number) => void;
  nextPresentationSlide: () => void;
  prevPresentationSlide: () => void;
  setSearchQuery: (q: string) => void;
  goToReference: (book: string, chapter?: string, verse?: string) => void;
  goToReferenceLive: (book: string, chapter?: string, verse?: string) => void;
}

const BibleContext = createContext<BibleContextValue | null>(null);

export function useBible(): BibleContextValue {
  const ctx = useContext(BibleContext);
  if (!ctx) throw new Error('useBible must be used inside BibleContextProvider');
  return ctx;
}

export const BibleContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Load Bible data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const indexRes = await fetch('/bible_index.json');
        const indexData = await indexRes.json();
        
        // Load full Bible data by fetching individual book files in batches
        const fullData: BibleFull = { en: {}, hi: {} };
        const bookNames = Object.keys(indexData);
        
        // Load English books in batches of 10 to avoid overwhelming
        for (let i = 0; i < bookNames.length; i += 10) {
          const batch = bookNames.slice(i, i + 10);
          await Promise.all(
            batch.map(async (bookName) => {
              try {
                const bookRes = await fetch(`/data/en/${bookName.toLowerCase()}.json`);
                if (bookRes.ok) {
                  fullData.en[bookName] = await bookRes.json();
                } else {
                  console.warn(`Failed to load English book: ${bookName} - ${bookRes.status}`);
                }
              } catch (e) {
                console.warn(`Failed to load English book: ${bookName}`, e);
              }
            })
          );
        }
        
        // Load Hindi books in batches of 10
        for (let i = 0; i < bookNames.length; i += 10) {
          const batch = bookNames.slice(i, i + 10);
          await Promise.all(
            batch.map(async (bookName) => {
              const hindiName = indexData[bookName].hi;
              try {
                const bookRes = await fetch(`/data/hi/${hindiName}.json`);
                if (bookRes.ok) {
                  fullData.hi[hindiName] = await bookRes.json();
                } else {
                  console.warn(`Failed to load Hindi book: ${hindiName} - ${bookRes.status}`);
                }
              } catch (e) {
                console.warn(`Failed to load Hindi book: ${hindiName}`, e);
              }
            })
          );
        }
        
        console.log('Bible data loaded:', Object.keys(fullData.en).length, 'English books,', Object.keys(fullData.hi).length, 'Hindi books');
        dispatch({ type: 'SET_BIBLE_DATA', payload: { index: indexData, full: fullData } });
      } catch (error) {
        console.error('Error loading Bible data:', error);
      }
    };
    loadData();
  }, []);

  const setWorkspace = useCallback((w: Workspace) => {
    dispatch({ type: 'SET_WORKSPACE', payload: w });
  }, []);

  const setLanguage = useCallback((lang: 'en' | 'hi') => {
    dispatch({ type: 'SET_LANGUAGE', payload: lang });
  }, []);

  const setLocation = useCallback((book: string, chapter: string, verse: string) => {
    dispatch({ type: 'SET_LOCATION', payload: { book, chapter, verse } });
  }, []);

  const setReadingVerse = useCallback((index: number) => {
    dispatch({ type: 'SET_READING_VERSE', payload: index });
  }, []);

  const setReadingSlide = useCallback((slideIndex: number) => {
    dispatch({ type: 'SET_READING_SLIDE', payload: slideIndex });
  }, []);

  const toggleLiveVerse = useCallback((index: number, slideIndex: number = 0) => {
    const current = stateRef.current;
    // Toggle: if already live, clear live, otherwise set live
    // Also always update reading position
    dispatch({ type: 'SET_READING_VERSE', payload: index });
    
    if (current.liveVerseIndex === index) {
      dispatch({ type: 'CLEAR_LIVE_VERSE' });
      // Send clear command to presentation
      const channel = new BroadcastChannel('bible_presentation_channel');
      channel.postMessage({ action: 'clearDisplay' });
      localStorage.setItem('biblePresentationCommand', JSON.stringify({ action: 'clearDisplay' }));
      channel.close();
    } else {
      dispatch({ type: 'SET_LIVE_VERSE', payload: index });
      // Send verse to presentation with slide index
      if (current.bibleFull && current.currentBook && current.currentChapter) {
        const bookKey = current.language === 'en' ? current.currentBook : (current.bibleIndex?.[current.currentBook]?.hi || current.currentBook);
        const bookData = current.bibleFull[current.language]?.[bookKey];
        if (bookData && bookData.chapters[current.currentChapter]) {
          const verseNum = Object.keys(bookData.chapters[current.currentChapter])[index];
          const verseText = bookData.chapters[current.currentChapter][verseNum];
          const verseData = {
            book: current.currentBook,
            chapter: current.currentChapter,
            verse: verseNum,
            text: verseText,
            reference: `${current.currentBook} ${current.currentChapter}:${verseNum}`,
            slideIndex: slideIndex
          };
          const channel = new BroadcastChannel('bible_presentation_channel');
          channel.postMessage({ action: 'showVerse', data: verseData });
          localStorage.setItem('biblePresentationCommand', JSON.stringify({ action: 'showVerse', data: verseData }));
          channel.close();
        }
      }
    }
  }, []);

  const setPresentationSlide = useCallback((index: number, total: number) => {
    dispatch({ type: 'SET_PRESENTATION_SLIDE', payload: { index, total } });
  }, []);

  const nextPresentationSlide = useCallback(() => {
    const channel = new BroadcastChannel('bible_presentation_channel');
    channel.postMessage({ action: 'nextSlide' });
    localStorage.setItem('biblePresentationCommand', JSON.stringify({ action: 'nextSlide' }));
    channel.close();
  }, []);

  const prevPresentationSlide = useCallback(() => {
    const channel = new BroadcastChannel('bible_presentation_channel');
    channel.postMessage({ action: 'prevSlide' });
    localStorage.setItem('biblePresentationCommand', JSON.stringify({ action: 'prevSlide' }));
    channel.close();
  }, []);

  const setSearchQuery = useCallback((q: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: q });
  }, []);

  const goToReference = useCallback((book: string, chapter?: string, verse?: string) => {
    const current = stateRef.current;
    if (!current.bibleIndex || !current.bibleFull) return;
    
    // Find matching book (case-insensitive)
    const bookName = Object.keys(current.bibleIndex).find(
      b => b.toLowerCase() === book.toLowerCase()
    );
    
    if (!bookName) return;
    
    const targetChapter = chapter || '1';
    const targetVerse = verse || '1';
    
    // Find the verse index for the target verse first
    const bookKey = current.language === 'en' ? bookName : (current.bibleIndex[bookName]?.hi || bookName);
    const bookData = current.bibleFull[current.language]?.[bookKey];
    
    let verseIndex = -1;
    if (bookData && bookData.chapters[targetChapter]) {
      const verseKeys = Object.keys(bookData.chapters[targetChapter]);
      verseIndex = verseKeys.indexOf(targetVerse);
    }
    
    // Set flag to prevent Enter toggle in reader
    dispatch({ type: 'SET_JUST_NAVIGATED', payload: true });
    
    // Clear live mode
    dispatch({ type: 'CLEAR_LIVE_VERSE' });
    
    // Set location
    dispatch({ 
      type: 'SET_LOCATION', 
      payload: { book: bookName, chapter: targetChapter, verse: targetVerse } 
    });
    
    if (verseIndex >= 0) {
      // Set reading position to the target verse (not live)
      dispatch({ type: 'SET_READING_VERSE', payload: verseIndex });
    }
    
    // Switch to reader workspace
    dispatch({ type: 'SET_WORKSPACE', payload: 'reader' });
    
    // Clear the flag after a short delay
    setTimeout(() => {
      dispatch({ type: 'SET_JUST_NAVIGATED', payload: false });
    }, 500);
  }, []);

  const goToReferenceLive = useCallback((book: string, chapter?: string, verse?: string) => {
    const current = stateRef.current;
    if (!current.bibleIndex || !current.bibleFull) return;
    
    // Find matching book (case-insensitive)
    const bookName = Object.keys(current.bibleIndex).find(
      b => b.toLowerCase() === book.toLowerCase()
    );
    
    if (!bookName) return;
    
    const targetChapter = chapter || '1';
    const targetVerse = verse || '1';
    
    // Find the verse index for the target verse first
    const bookKey = current.language === 'en' ? bookName : (current.bibleIndex[bookName]?.hi || bookName);
    const bookData = current.bibleFull[current.language]?.[bookKey];
    
    let verseIndex = -1;
    if (bookData && bookData.chapters[targetChapter]) {
      const verseKeys = Object.keys(bookData.chapters[targetChapter]);
      verseIndex = verseKeys.indexOf(targetVerse);
    }
    
    // Set location
    dispatch({ 
      type: 'SET_LOCATION', 
      payload: { book: bookName, chapter: targetChapter, verse: targetVerse } 
    });
    
    if (verseIndex >= 0) {
      // Set both reading and live position to the target verse
      dispatch({ type: 'SET_READING_VERSE', payload: verseIndex });
      dispatch({ type: 'SET_LIVE_VERSE', payload: verseIndex });
      
      // Send verse to presentation
      const verseText = bookData.chapters[targetChapter][targetVerse];
      const verseData = {
        book: bookName,
        chapter: targetChapter,
        verse: targetVerse,
        text: verseText,
        reference: `${bookName} ${targetChapter}:${targetVerse}`,
        slideIndex: 0
      };
      const channel = new BroadcastChannel('bible_presentation_channel');
      channel.postMessage({ action: 'showVerse', data: verseData });
      localStorage.setItem('biblePresentationCommand', JSON.stringify({ action: 'showVerse', data: verseData }));
      channel.close();
    }
    
    dispatch({ type: 'SET_WORKSPACE', payload: 'reader' });
  }, []);

  return (
    <BibleContext.Provider value={{
      state,
      setWorkspace,
      setLanguage,
      setLocation,
      setReadingVerse,
      setReadingSlide,
      toggleLiveVerse,
      setPresentationSlide,
      nextPresentationSlide,
      prevPresentationSlide,
      setSearchQuery,
      goToReference,
      goToReferenceLive,
    }}>
      {children}
    </BibleContext.Provider>
  );
};
