import { Link, Navigate } from "react-router-dom";
import { authService } from "../services/authService";
import { Sprout, Leaf, MapPin, Bell, Sparkles, AlertTriangle } from "lucide-react";

const features = [
  {
    icon: <Sprout size={48} />,
    title: "Crop Monitoring",
    description:
      "Monitor plant vitality, track growth stages, and receive early warnings for disease or stress.",
  },
  {
    icon: <Leaf size={48} />,
    title: "Soil & Telemetry",
    description:
      "Analyze 7 key metrics — nitrogen, phosphorus, potassium, pH, temperature, humidity, and soil moisture — in real time.",
  },
  {
    icon: <MapPin size={48} />,
    title: "Parcel Management",
    description:
      "Register, monitor, and manage your agricultural parcels with detailed location tracking and crop history.",
  },
  {
    icon: <AlertTriangle size={48} />,
    title: "Smart Alerts",
    description:
      "Get severity-based alerts when sensor readings exceed optimal thresholds, with acknowledge and resolve workflows.",
  },
  {
    icon: <Sparkles size={48} />,
    title: "AI Recommendations",
    description:
      "Receive data-driven crop recommendations ranked by soil compatibility and expected profitability.",
  },
  {
    icon: <Bell size={48} />,
    title: "Notifications",
    description:
      "Stay informed with in-app notifications for parcel updates, alert activity, and platform announcements.",
  },
];

export default function HomePage() {
  if (authService.isAuthenticated()) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Agrovista"
              className="h-10 w-10 object-contain"
            />
            <span className="text-2xl font-bold text-gray-800">Agrovista</span>
          </Link>

          <Link
            to="/login"
            className="bg-green-700 hover:bg-green-800 text-white px-5 py-2 rounded-lg font-medium transition-colors"
          >
            Admin Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-162.5 lg:h-175 overflow-hidden">
        {/* Background Image */}
        <img
          src="/assets/LandingPage2.png"
          alt="Smart Agriculture"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/35" />

        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="max-w-4xl text-center px-6">
            <h1 className="text-white text-4xl md:text-5xl lg:text-7xl font-bold leading-tight mb-6 drop-shadow-lg">
              Smarter Agriculture
              <br />
              Management
            </h1>

            <p className="text-white/90 text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed">
              Agrovista empowers farmers and administrators with real-time
              insights into crop health, soil telemetry, parcel management,
              and smart alerts — across web dashboard and mobile app.
            </p>

            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-green-700 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-all duration-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-3xl lg:text-4xl font-bold text-gray-900 mb-16">
            Key Features
          </h2>

          <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center flex flex-col items-center"
              >
                <div className="text-green-700 mb-5">{feature.icon}</div>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>

                <p className="text-gray-600 leading-relaxed max-w-xs">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
