export default function PublicFormUnavailable() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <span
        className="mb-6 flex size-12 items-center justify-center rounded-xl bg-text font-semibold text-white"
        aria-hidden="true"
      >
        tf
      </span>
      <h1 className="text-2xl font-medium">This form isn’t available</h1>
      <p className="mt-3 max-w-sm leading-6 text-text-muted">
        The form may not be published yet. Please check with the person who
        shared it.
      </p>
    </main>
  );
}
