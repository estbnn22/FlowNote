export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-error text-4xl font-semibold">
        <span className="text-warning">404</span> Page Not Found
      </h1>
      <p className="text-neutral">
        The page you are looking for does not exist or has been removed.
      </p>
    </div>
  );
}
