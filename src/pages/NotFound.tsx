import { Link } from "react-router-dom";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-[10rem] sm:text-[12rem] font-bold leading-none mb-4 bg-linear-to-b from-green-700 to-green-400 bg-clip-text text-transparent">
          404
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Page Not Found
        </h1>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved. Check the
          URL or head back home.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-green hover:bg-green-600 text-white font-medium transition-colors text-sm"
        >
          <Home size={18} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
