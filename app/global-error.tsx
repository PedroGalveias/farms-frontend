"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for failures in the root layout itself. It replaces the
 * whole document, so it can't use the app's providers/styles — keep it minimal,
 * self-contained, and English-only.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#f4f4ef",
          color: "#14161b",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ maxWidth: "28rem", lineHeight: 1.6, color: "#5b5e66" }}>
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            border: "none",
            borderRadius: "999px",
            background: "#14161b",
            color: "#fff",
            padding: "0.85rem 1.75rem",
            fontSize: "0.9rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
          type="button"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
