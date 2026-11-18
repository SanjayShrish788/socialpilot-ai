import Link from "next/link";
export default function NotFound() {
  return (
    <div className="card">
      <h1>Page not found</h1>
      <p>Return to your social media workspace.</p>
      <Link href="/" className="button primary">
        Open dashboard
      </Link>
    </div>
  );
}
