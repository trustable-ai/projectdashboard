import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-bold sm:text-5xl">404</h1>
      <p className="text-lg text-muted-foreground sm:text-xl">
        Oops! Page not found
      </p>
      <Link
        to="/"
        className="inline-flex min-h-[44px] items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;