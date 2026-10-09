import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">This page isn’t available</h1>
      <p className="text-text-muted">
        Check the link or return to your workspace.
      </p>
      <Link
        className="rounded-lg bg-text px-4 py-2.5 font-medium text-white"
        href="/forms"
      >
        Go to workspace
      </Link>
    </main>
  );
}
