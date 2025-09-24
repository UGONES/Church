import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Header = ({ user, logout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  // Check if user is authenticated
  const isAuthenticated = user?.isLoggedIn;
  const userRole = user?.role;

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center cursor-pointer">
            <i className="fas fa-church text-[#FF7E45] text-3xl mr-2" />
            <h1 className="text-xl md:text-2xl font-bold">
              St. Michael's & All Angels Church
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex">
            <ul className="flex space-x-1 gap-2">
              <li>
                <Link
                  to="/"
                  className={`nav-link hover:text-[#FF7E45] hover:underline ${isActive("/")}`}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/events"
                  className={`nav-link hover:text-[#FF7E45] hover:underline ${isActive("/events")}`}
                >
                  Events
                </Link>
              </li>
              <li>
                <Link
                  to="/sermons"
                  className={`nav-link hover:text-[#FF7E45] hover:underline ${isActive("/sermons")}`}
                >
                  Sermons
                </Link>
              </li>
              <li>
                <Link
                  to="/donate"
                  className={`nav-link hover:text-[#FF7E45] hover:underline ${isActive("/donate")}`}
                >
                  Donate
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className={`nav-link hover:text-[#FF7E45] hover:underline ${isActive("/blog")}`}
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/ministries"
                  className={`nav-link hover:text-[#FF7E45] hover:underline ${isActive("/ministries")}`}
                >
                  Ministries
                </Link>
              </li>
              <li>
                <Link
                  to="/testimonials"
                  className={`nav-link hover:text-[#FF7E45] hover:underline ${isActive("/testimonials")}`}
                >
                  Testimonials
                </Link>
              </li>
              <li>
                <Link
                  to="/prayer"
                  className={`nav-link hover:text-[#FF7E45] hover:underline ${isActive("/prayer")}`}
                >
                  Prayer
                </Link>
              </li>
              {userRole === "admin" && (
                <li>
                  <Link
                    to="/admin"
                    className={`nav-link hover:text-[#FF7E45] hover:underline ${isActive("/admin")}`}
                  >
                    Admin
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {/* Login/Profile Button */}
          <div className="hidden md:block">
            {!isAuthenticated ? (
              <Link
                to="/login"
                className="btn btn-primary hover:text-[#FF7E45] hover:underline"
              >
                Login
              </Link>
            ) : (
              <div className="relative group">
                <button className="flex items-center space-x-1 btn btn-outline">
                  <i className="fas fa-user" />
                  <span>{user.name || "User"}</span>
                </button>

                {/* Dropdown */}
                <div
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-20
                  opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
                >
                  <div className="py-2">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <i className="fas fa-user-circle mr-2" />
                      Profile
                    </Link>
                    {userRole === "user" && (
                      <Link
                        to="/my-rsvps"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <i className="fas fa-calendar-check mr-2" />
                        My RSVPs
                      </Link>
                    )}
                    <hr className="my-2" />
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={handleLogout}
                    >
                      <i className="fas fa-sign-out-alt mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <i
              className={`fas ${
                mobileMenuOpen ? "fa-times" : "fa-bars"
              } text-2xl`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${
          mobileMenuOpen ? "block" : "hidden"
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-800 bg-opacity-75"
          onClick={() => setMobileMenuOpen(false)}
        />
        <nav
          className={`fixed top-0 left-0 bottom-0 w-64 bg-white z-50 transform ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 ease-in-out`}
        >
          <div className="p-4 border-b">
            <div className="flex items-center">
              <Link to="/">
                <i className="fas fa-church text-[#FF7E45] text-xl mr-2" />
                <h2 className="font-bold text-lg">St. Michael's Church</h2>
              </Link>
            </div>
          </div>
          <ul className="p-4 space-y-2">
            <li>
              <Link
                to="/"
                className="block p-2 hover:text-[#FF7E45] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-home mr-2" />
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/events"
                className="block p-2 hover:text-[#FF7E45] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-calendar mr-2" />
                Events
              </Link>
            </li>
            <li>
              <Link
                to="/sermons"
                className="block p-2 hover:text-[#FF7E45] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-play-circle mr-2" />
                Sermons
              </Link>
            </li>
            <li>
              <Link
                to="/donate"
                className="block p-2 hover:text-[#FF7E45] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-donate mr-2" />
                Donate
              </Link>
            </li>
            <li>
              <Link
                to="/blog"
                className="block p-2 hover:text-[#FF7E45] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-blog mr-2" />
                Blog
              </Link>
            </li>
            <li>
              <Link
                to="/ministries"
                className="block p-2 hover:text-[#FF7E45] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-hands-helping mr-2" />
                Ministries
              </Link>
            </li>
            <li>
              <Link
                to="/testimonials"
                className="block p-2 hover:text-[#FF7E45] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-quote-left mr-2" />
                Testimonials
              </Link>
            </li>
            <li>
              <Link
                to="/prayer"
                className="block p-2 hover:text-[#FF7E45] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-pray mr-2" />
                Prayer Requests
              </Link>
            </li>
            {userRole === "admin" && (
              <li>
                <Link
                  to="/admin"
                  className="block p-2 hover:text-[#FF7E45] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className="fas fa-cog mr-2" />
                  Admin Dashboard
                </Link>
              </li>
            )}
          </ul>
          <div className="p-4 border-t">
            {!isAuthenticated ? (
              <Link
                to="/login"
                className="w-full btn btn-primary flex items-center justify-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-sign-in-alt mr-2" />
                Login
              </Link>
            ) : (
              <div className="space-y-2">
                <p className="font-medium flex items-center">
                  <i className="fas fa-user-circle mr-2 text-[#FF7E45]" />
                  {user.name || "User"}
                </p>
                <Link
                  to="/profile"
                  className="w-full btn btn-outline flex items-center justify-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className="fas fa-user mr-2" />
                  Profile
                </Link>
                {userRole === "user" && (
                  <Link
                    to="/my-rsvps"
                    className="w-full btn btn-outline flex items-center justify-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <i className="fas fa-calendar-check mr-2" />
                    My RSVPs
                  </Link>
                )}
                <button
                  className="w-full btn btn-primary flex items-center justify-center"
                  onClick={handleLogout}
                >
                  <i className="fas fa-sign-out-alt mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
