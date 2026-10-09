import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../api/client";

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>(path: string | null): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<string | null>(null);
  const [requestNumber, setRequestNumber] = useState(0);

  const refetch = useCallback(() => {
    setRequestNumber((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    apiClient
      .get<{ data: T }>(path)
      .then((response) => {
        if (!cancelled) setData(response.data.data);
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;

        if (
          typeof requestError === "object" &&
          requestError !== null &&
          "response" in requestError
        ) {
          const response = requestError.response;
          if (typeof response === "object" && response !== null && "data" in response) {
            const body = response.data;
            if (
              typeof body === "object" &&
              body !== null &&
              "message" in body &&
              typeof body.message === "string"
            ) {
              setError(body.message);
              return;
            }
          }
        }

        setError("Could not load this information. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [path, requestNumber]);

  return { data, loading, error, refetch };
}