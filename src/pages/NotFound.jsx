import { Link } from "react-router-dom";
import Seo from "../components/common/Seo.jsx";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-panel">
      <Seo title="Page not found" />
      <div className="text-center">
        <p className="text-5xl font-bold text-accent mb-2">404</p>
        <p className="text-ink font-medium mb-1">Page not found</p>
        <p className="text-sm text-muted mb-5">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
