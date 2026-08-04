// frontend/src/hooks/useMediaQuery.js
import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Custom hook for detecting media query matches
 * @param {string} query - The CSS media query string
 * @param {Object} options - Configuration options
 * @param {boolean} options.defaultState - Default state if no match found (default: false)
 * @param {number} options.debounceDelay - Debounce delay in milliseconds (default: 100)
 * @param {boolean} options.ssr - Whether to skip initial check for SSR (default: false)
 * @returns {boolean} - Whether the media query matches
 */
export const useMediaQuery = (query, options = {}) => {
  const { defaultState = false, debounceDelay = 100, ssr = false } = options;

  const [matches, setMatches] = useState(() => {
    // If SSR is enabled, return default state on first render
    if (ssr && typeof window === "undefined") {
      return defaultState;
    }
    // Check if the media query matches on initial render (client-side)
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia(query).matches;
    }
    return defaultState;
  });

  const timeoutRef = useRef(null);

  /**
   * Check if the media query matches
   */
  const checkMatch = useCallback(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return defaultState;
    }

    try {
      return window.matchMedia(query).matches;
    } catch (error) {
      console.warn(`Invalid media query: "${query}"`, error);
      return defaultState;
    }
  }, [query, defaultState]);

  /**
   * Update the matches state
   */
  const updateMatches = useCallback(() => {
    const newMatches = checkMatch();
    setMatches(newMatches);
  }, [checkMatch]);

  /**
   * Debounced update for performance
   */
  const debouncedUpdate = useCallback(() => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a new timeout
    timeoutRef.current = setTimeout(() => {
      updateMatches();
      timeoutRef.current = null;
    }, debounceDelay);
  }, [updateMatches, debounceDelay]);

  // Set up the media query listener
  useEffect(() => {
    // Skip if running on the server
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    let mediaQueryList;

    try {
      mediaQueryList = window.matchMedia(query);
    } catch (error) {
      console.warn(`Invalid media query: "${query}"`, error);
      return;
    }

    // Set initial state
    setMatches(mediaQueryList.matches);

    // Define listener function
    const listener = (event) => {
      // Use debounced update for better performance
      if (debounceDelay > 0) {
        debouncedUpdate();
      } else {
        setMatches(event.matches);
      }
    };

    // Add listener (using addEventListener if available, fallback to addListener)
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", listener);
    } else if (mediaQueryList.addListener) {
      mediaQueryList.addListener(listener);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener("change", listener);
      } else if (mediaQueryList.removeListener) {
        mediaQueryList.removeListener(listener);
      }
    };
  }, [query, debounceDelay, debouncedUpdate]);

  /**
   * Manually check and update the match status
   */
  const refresh = useCallback(() => {
    const newMatches = checkMatch();
    setMatches(newMatches);
    return newMatches;
  }, [checkMatch]);

  /**
   * Get the media query string being used
   */
  const getQuery = useCallback(() => {
    return query;
  }, [query]);

  /**
   * Check if the media query is supported
   */
  const isSupported = useCallback(() => {
    return typeof window !== "undefined" && !!window.matchMedia;
  }, []);

  return {
    matches,
    isMatch: matches,
    refresh,
    getQuery,
    isSupported,
  };
};

// =============================================
// COMMON BREAKPOINT PRESETS
// =============================================

/**
 * Predefined media query presets for common use cases
 */
export const MEDIA_QUERIES = {
  // Screen sizes
  MOBILE: "(max-width: 639px)",
  TABLET: "(min-width: 640px) and (max-width: 1023px)",
  DESKTOP: "(min-width: 1024px)",
  LARGE_DESKTOP: "(min-width: 1280px)",
  XL_DESKTOP: "(min-width: 1536px)",

  // Mobile-first
  SM: "(min-width: 640px)",
  MD: "(min-width: 768px)",
  LG: "(min-width: 1024px)",
  XL: "(min-width: 1280px)",
  TWO_XL: "(min-width: 1536px)",

  // Max widths
  MAX_SM: "(max-width: 639px)",
  MAX_MD: "(max-width: 767px)",
  MAX_LG: "(max-width: 1023px)",
  MAX_XL: "(max-width: 1279px)",
  MAX_TWO_XL: "(max-width: 1535px)",

  // Orientation
  PORTRAIT: "(orientation: portrait)",
  LANDSCAPE: "(orientation: landscape)",

  // Dark/Light mode
  DARK_MODE: "(prefers-color-scheme: dark)",
  LIGHT_MODE: "(prefers-color-scheme: light)",

  // Reduced motion
  REDUCED_MOTION: "(prefers-reduced-motion: reduce)",

  // High contrast
  HIGH_CONTRAST: "(prefers-contrast: high)",

  // Touch vs mouse
  TOUCH: "(hover: none) and (pointer: coarse)",
  FINE_POINTER: "(hover: hover) and (pointer: fine)",

  // Print
  PRINT: "print",
  SCREEN: "screen",

  // Height
  SHORT_HEIGHT: "(max-height: 600px)",
  TALL_HEIGHT: "(min-height: 900px)",

  // Aspect ratio
  SQUARE: "(aspect-ratio: 1/1)",
  WIDE: "(min-aspect-ratio: 16/9)",
  TALL: "(max-aspect-ratio: 9/16)",
};

// =============================================
// HELPER HOOKS FOR COMMON USE CASES
// =============================================

/**
 * Check if the screen is mobile size
 */
export const useIsMobile = () => {
  return useMediaQuery(MEDIA_QUERIES.MOBILE);
};

/**
 * Check if the screen is tablet size
 */
export const useIsTablet = () => {
  return useMediaQuery(MEDIA_QUERIES.TABLET);
};

/**
 * Check if the screen is desktop size
 */
export const useIsDesktop = () => {
  return useMediaQuery(MEDIA_QUERIES.DESKTOP);
};

/**
 * Check if the screen is large desktop size
 */
export const useIsLargeDesktop = () => {
  return useMediaQuery(MEDIA_QUERIES.LARGE_DESKTOP);
};

/**
 * Check if the screen is in portrait orientation
 */
export const useIsPortrait = () => {
  return useMediaQuery(MEDIA_QUERIES.PORTRAIT);
};

/**
 * Check if the screen is in landscape orientation
 */
export const useIsLandscape = () => {
  return useMediaQuery(MEDIA_QUERIES.LANDSCAPE);
};

/**
 * Check if dark mode is preferred
 */
export const useIsDarkMode = () => {
  return useMediaQuery(MEDIA_QUERIES.DARK_MODE);
};

/**
 * Check if reduced motion is preferred
 */
export const useIsReducedMotion = () => {
  return useMediaQuery(MEDIA_QUERIES.REDUCED_MOTION);
};

/**
 * Check if the device is touch-enabled
 */
export const useIsTouchDevice = () => {
  return useMediaQuery(MEDIA_QUERIES.TOUCH);
};

/**
 * Get the current breakpoint name
 * Returns: 'mobile', 'tablet', 'desktop', 'large-desktop', 'xl-desktop'
 */
export const useBreakpoint = () => {
  const isMobile = useMediaQuery(MEDIA_QUERIES.MOBILE);
  const isTablet = useMediaQuery(MEDIA_QUERIES.TABLET);
  const isDesktop = useMediaQuery(MEDIA_QUERIES.DESKTOP);
  const isLargeDesktop = useMediaQuery(MEDIA_QUERIES.LARGE_DESKTOP);
  const isXlDesktop = useMediaQuery(MEDIA_QUERIES.XL_DESKTOP);

  if (isXlDesktop) return "xl-desktop";
  if (isLargeDesktop) return "large-desktop";
  if (isDesktop) return "desktop";
  if (isTablet) return "tablet";
  if (isMobile) return "mobile";
  return "mobile";
};

export default useMediaQuery;
