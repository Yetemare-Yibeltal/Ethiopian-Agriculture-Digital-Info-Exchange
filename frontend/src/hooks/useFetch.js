// frontend/src/hooks/useFetch.js
import { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_CONFIG = {
  method: "GET",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  timeout: 30000,
  retries: 0,
  retryDelay: 1000,
  cache: false,
  cacheDuration: 60000,
};

export const useFetch = (url, options = {}, deps = [], skip = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [statusCode, setStatusCode] = useState(null);

  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const cacheRef = useRef(new Map());
  const retryCountRef = useRef(0);
  const fetchCountRef = useRef(0);

  const mergedOptions = { ...DEFAULT_CONFIG, ...options };
  const shouldSkip = typeof skip === "function" ? skip() : !!skip;

  const getCacheKey = useCallback(() => {
    const optionString = JSON.stringify({
      method: mergedOptions.method,
      body: mergedOptions.body || null,
      headers: mergedOptions.headers || {},
    });
    return `${url}-${optionString}`;
  }, [url, mergedOptions.method, mergedOptions.body, mergedOptions.headers]);

  const performFetch = useCallback(async () => {
    if (!url || shouldSkip) {
      setLoading(false);
      return;
    }

    // Cache check
    if (mergedOptions.cache && mergedOptions.method === "GET") {
      const cacheKey = getCacheKey();
      const cached = cacheRef.current.get(cacheKey);
      if (
        cached &&
        Date.now() - cached.timestamp < mergedOptions.cacheDuration
      ) {
        setData(cached.data);
        setIsSuccess(true);
        setError(null);
        setLoading(false);
        return;
      }
    }

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);
    setError(null);
    setIsSuccess(false);
    fetchCountRef.current += 1;
    const currentFetchId = fetchCountRef.current;

    try {
      const timeoutId = setTimeout(() => {
        abortController.abort();
        setError({ message: "Request timeout", code: "TIMEOUT" });
        setLoading(false);
      }, mergedOptions.timeout);

      const fetchOptions = {
        method: mergedOptions.method,
        headers: { ...mergedOptions.headers },
        body: mergedOptions.body
          ? JSON.stringify(mergedOptions.body)
          : undefined,
        credentials: mergedOptions.credentials,
        signal: abortController.signal,
      };

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      if (!isMountedRef.current || currentFetchId !== fetchCountRef.current)
        return;

      const status = response.status;
      setStatusCode(status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText || "Request failed" };
        }
        throw {
          message: errorData.message || errorData.error || "Request failed",
          status,
          data: errorData,
        };
      }

      let responseData;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (isMountedRef.current && currentFetchId === fetchCountRef.current) {
        setData(responseData);
        setIsSuccess(true);
        setError(null);
        setLoading(false);
        if (mergedOptions.cache && mergedOptions.method === "GET") {
          cacheRef.current.set(getCacheKey(), {
            data: responseData,
            timestamp: Date.now(),
          });
        }
        retryCountRef.current = 0;
      }
    } catch (err) {
      if (err.name === "AbortError" || err.code === "ERR_CANCELED") return;
      if (!isMountedRef.current) return;

      const isNetworkError = err.message === "Failed to fetch" || !err.status;
      if (isNetworkError && retryCountRef.current < mergedOptions.retries) {
        retryCountRef.current += 1;
        const delay =
          mergedOptions.retryDelay * Math.pow(2, retryCountRef.current - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        if (isMountedRef.current && currentFetchId === fetchCountRef.current) {
          return performFetch();
        }
        return;
      }

      setError({
        message: err.message || "An error occurred",
        status: err.status || null,
        data: err.data || null,
      });
      setIsSuccess(false);
      setLoading(false);
    }
  }, [url, shouldSkip, mergedOptions, getCacheKey]);

  const refetch = useCallback(async () => {
    if (mergedOptions.cache) {
      cacheRef.current.delete(getCacheKey());
    }
    retryCountRef.current = 0;
    return performFetch();
  }, [performFetch, mergedOptions.cache, getCacheKey]);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    if (!shouldSkip && url) {
      performFetch();
    } else {
      setLoading(false);
    }
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [url, shouldSkip, ...deps]);

  return {
    data,
    loading,
    error,
    isSuccess,
    statusCode,
    refetch,
    abort,
    isLoading: loading,
    isFetching: loading && !data,
    hasData: data !== null && data !== undefined,
    hasError: !!error,
  };
};

export default useFetch;
