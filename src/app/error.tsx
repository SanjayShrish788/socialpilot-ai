"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="card">
      <h1>Something went wrong</h1>
      <p>
        Your browser-saved workspace is preserved. Retry this page or reload the
        application.
      </p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
