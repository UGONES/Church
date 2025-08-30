import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const [countdown, setCountdown] = useState(30);
  const navigate = useNavigate();

  useEffect(() => {
        document.title = "SMC: - Not-Found | St. Micheal`s & All Angels Church | Ifite-Awka";
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const quickLinks = [
    { path: "/", label: "Home", icon: "home" },
    { path: "/events", label: "Events", icon: "calendar" },
    { path: "/sermons", label: "Sermons", icon: "play-circle" },
    { path: "/ministries", label: "Ministries", icon: "users" },
    { path: "/contact", label: "Contact", icon: "envelope" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F0] to-[#FFF9E6] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Animated 404 Graphic */}
        <div className="mb-8 relative">
          <div className="text-[120px] md:text-[180px] font-bold text-[#FF7E45] opacity-20">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-[#FF7E45] rounded-full flex items-center justify-center animate-bounce">
              <i className="fas fa-exclamation-triangle text-white text-4xl"></i>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Page Not Found
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Oops! The page you're looking for seems to have wandered off into the digital wilderness.
          </p>

          {/* Quick Links */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Quick Navigation
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-[#FFF5F0] transition-colors group"
                >
                  <i className={`fas fa-${link.icon} text-[#FF7E45] text-lg mb-2 group-hover:scale-110 transition-transform`}></i>
                  <span className="text-sm font-medium text-gray-700">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link
              to="/"
              className="bg-[#FF7E45] hover:bg-[#E56A36] text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
            >
              <i className="fas fa-home mr-2"></i>
              Return to Homepage
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="border border-gray-300 hover:border-[#FF7E45] text-gray-700 hover:text-[#FF7E45] font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Go Back
            </button>
          </div>

          {/* Countdown Timer */}
          <div className="text-sm text-gray-500">
            <p>
              Redirecting to homepage in{" "}
              <span className="font-bold text-[#FF7E45]">{countdown}</span> seconds...
            </p>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Need Help?
          </h3>
          <p className="text-gray-600 mb-4">
            If you believe this is an error or need assistance, please contact us:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@stmichaels.org"
              className="text-[#FF7E45] hover:text-[#E56A36] flex items-center justify-center"
            >
              <i className="fas fa-envelope mr-2"></i>
              support@stmichaels.org
            </a>
            <a
              href="tel:+15551234567"
              className="text-[#FF7E45] hover:text-[#E56A36] flex items-center justify-center"
            >
              <i className="fas fa-phone mr-2"></i>
              (555) 123-4567
            </a>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-6">
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search our website..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent"
            />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;