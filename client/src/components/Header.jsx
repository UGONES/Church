// src/components/layouts/Header.jsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth"; // ✅ corrected import (your hooks are in src/hooks)

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  const isActive = (path) => (location.pathname === path ? "active" : "");

  // Safely check authentication and user properties
  const isAuthenticated = !!user && user.role && user.role !== "guest";
  const userRole = (user?.role || "guest").toLowerCase();
  const userId = user?.id || user?._id || null;
  const userName = user?.name || user?.firstName || "User";

  // Unified dashboard path based on role
  const getDashboardPath = () => {
    if (!userId) return null;
    if (userRole === "admin") return `/admin/${userId}/dashboard`;
    if (userRole === "moderator") return `/moderator/${userId}/dashboard`;
    if (userRole === "user") return `/user/${userId}/dashboard`;
    return null;
  };

  const dashboardPath = getDashboardPath();

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center cursor-pointer">
            <i className="fas fa-church text-[#FF7E45] text-3xl mr-2" />
            <h1 className="text-xl md:text-2xl font-bold">
              St. Michael&apos;s & All Angels Church
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex">
            <ul className="flex space-x-1">
              <li>
                <Link to="/" className={`nav-link ${isActive("/")}`}>
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/events"
                  className={`nav-link ${isActive("/events")}`}
                >
                  Events
                </Link>
              </li>
              <li>
                <Link
                  to="/sermons"
                  className={`nav-link ${isActive("/sermons")}`}
                >
                  Sermons
                </Link>
              </li>
              <li>
                <Link
                  to="/donate"
                  className={`nav-link ${isActive("/donate")}`}
                >
                  Donate
                </Link>
              </li>
              <li>
                <Link to="/blog" className={`nav-link ${isActive("/blog")}`}>
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/ministries"
                  className={`nav-link ${isActive("/ministries")}`}
                >
                  Ministries
                </Link>
              </li>
              <li>
                <Link
                  to="/testimonials"
                  className={`nav-link ${isActive("/testimonials")}`}
                >
                  Testimonials
                </Link>
              </li>
              <li>
                <Link
                  to="/prayer"
                  className={`nav-link ${isActive("/prayer")}`}
                >
                  Prayer
                </Link>
              </li>

              {/* Role-aware Dashboard */}
              {dashboardPath && (
                <li>
                  <Link
                    to={dashboardPath}
                    className={`nav-link ${isActive(dashboardPath)}`}
                  >
                    {userRole === "admin"
                      ? "Admin"
                      : userRole === "moderator"
                        ? "Moderator"
                        : "Dashboard"}
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {/* Right Section */}
          <div className="hidden md:block">
            {!isAuthenticated ? (
              <Link to="/login" className="btn btn-primary">
                Login
              </Link>
            ) : (
              <div className="relative group">
                <button className="flex items-center space-x-1 btn btn-outline">
                  <i className="fas fa-user" />
                  <span>{userName}</span>
                </button>

                {/* Dropdown */}
                <div
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-20
                  opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
                >
                  <div className="py-2">
                    {userId && (
                      <>
                        <Link
                          to={`/profile/${userId}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Profile
                        </Link>
                        <Link
                          to={`/my-rsvps/${userId}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          My RSVPs
                        </Link>
                        <hr className="my-2" />
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            <i
              className={`fas ${mobileMenuOpen ? "fa-times" : "fa-bars"} text-2xl`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${mobileMenuOpen ? "block" : "hidden"}`}
      >
        <div
          className="fixed inset-0 bg-[#33333387] bg-opacity-75"
          onClick={() => setMobileMenuOpen(false)}
        />
        <nav
          className={`fixed top-0 left-0 bottom-0 w-64 bg-white z-50 transform ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 ease-in-out`}
        >
          <div className="p-4 border-b">
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>
              <i className="fas fa-church text-[#FF7E45] text-xl mr-2" />
              <h2 className="font-bold text-lg">St. Michael&apos;s Church</h2>
            </Link>
          </div>
          <ul className="p-4 space-y-2">
            {/* public links... */}
            <li>
              <Link
                to="/"
                className="block p-2 hover:text-[#FF7E45]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-home mr-2" />
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/events"
                className="block p-2 hover:text-[#FF7E45]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-calendar-alt mr-2" />
                Events
              </Link>
            </li>
            <li>
              <Link
                to="/sermons"
                className="block p-2 hover:text-[#FF7E45]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-video mr-2" />
                Sermons
              </Link>
            </li>
            <li>
              <Link
                to="/donate"
                className="block p-2 hover:text-[#FF7E45]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-dollar-sign mr-2" />
                Donate
              </Link>
            </li>
            <li>
              <Link
                to="/blog"
                className="block p-2 hover:text-[#FF7E45]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-blog mr-2" />
                Blog
              </Link>
            </li>
            <li>
              <Link
                to="/ministries"
                className="block p-2 hover:text-[#FF7E45]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-people-carry mr-2" />
                Ministries
              </Link>
            </li>
            <li>
              <Link
                to="/testimonials"
                className="block p-2 hover:text-[#FF7E45]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-comments mr-2" />
                Testimonials
              </Link>
            </li>
            <li>
              <Link
                to="/prayer"
                className="block p-2 hover:text-[#FF7E45]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-praying-hands mr-2" />
                Prayer
              </Link>
            </li>

            {/* role-aware dashboard */}
            {dashboardPath && (
              <li>
                <Link
                  to={dashboardPath}
                  className="block p-2 hover:text-[#FF7E45]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className="fas fa-cog mr-2" />
                  {userRole === "admin"
                    ? "Admin Dashboard"
                    : userRole === "moderator"
                      ? "Moderator Dashboard"
                      : "User Dashboard"}
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
                  {userName}
                </p>
                {userId && (
                  <>
                    <Link
                      to={`/profile/${userId}`}
                      className="w-full btn btn-outline flex items-center justify-center hover:text-[#FF7E45]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <i className="fas fa-user mr-2" />
                      Profile
                    </Link>
                    <Link
                      to={`/my-rsvps/${userId}`}
                      className="w-full btn btn-outline flex items-center justify-center hover:text-[#FF7E45]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <i className="fas fa-calendar-check mr-2" />
                      My RSVPs
                    </Link>
                  </>
                )}
                <button
                  className="w-full btn btn-primary flex items-center justify-center hover:text-[#e74c3c]"
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
