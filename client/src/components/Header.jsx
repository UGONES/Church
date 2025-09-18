// src/components/layouts/Header.jsx
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path ? "active" : "";

  // Safely check authentication and user properties
  const isAuthenticated = user && user.role && user.role !== "guest";
  const userRole = (user?.role || "guest").toLowerCase();
  const userId = user?.id || user?._id || null;
  const userName = user?.name || user?.firstName || "User";

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center cursor-pointer">
            <i className="fas fa-church text-[#FF7E45] text-3xl mr-2"></i>
            <h1 className="text-xl md:text-2xl font-bold">
              St. Michael&apos;s & All Angels Church
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex">
            <ul className="flex space-x-1 gap-2">
              <li><Link to="/" className={`nav-link ${isActive("/")}`}>Home</Link></li>
              <li><Link to="/events" className={`nav-link ${isActive("/events")}`}>Events</Link></li>
              <li><Link to="/sermons" className={`nav-link ${isActive("/sermons")}`}>Sermons</Link></li>
              <li><Link to="/donate" className={`nav-link ${isActive("/donate")}`}>Donate</Link></li>
              <li><Link to="/blog" className={`nav-link ${isActive("/blog")}`}>Blog</Link></li>
              <li><Link to="/ministries" className={`nav-link ${isActive("/ministries")}`}>Ministries</Link></li>
              <li><Link to="/testimonials" className={`nav-link ${isActive("/testimonials")}`}>Testimonials</Link></li>
              <li><Link to="/prayer" className={`nav-link ${isActive("/prayer")}`}>Prayer</Link></li>

              {userRole === "admin" && userId && (
                <li>
                  <Link to={`/admin/${userId}/dashboard`} className={`nav-link ${isActive(`/admin/${userId}/dashboard`)}`}>
                    Admin
                  </Link>
                </li>
              )}
              {userRole === "user" && userId && (
                <li>
                  <Link to={`/user/${userId}/dashboard`} className={`nav-link ${isActive(`/user/${userId}/dashboard`)}`}>
                    Dashboard
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
                  <i className="fas fa-user"></i>
                  <span>{userName}</span>
                </button>

                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-20 
                  opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
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
                        {userRole === "user" && (
                          <Link
                            to={`/my-rsvps/${userId}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            My RSVPs
                          </Link>
                        )}
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
            <i className={`fas ${mobileMenuOpen ? "fa-times" : "fa-bars"} text-2xl`}></i>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${mobileMenuOpen ? "block" : "hidden"
          }`}
      >
        <div
          className="fixed inset-0 bg-gray-800 bg-opacity-75"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
        <nav
          className={`fixed top-0 left-0 bottom-0 w-64 bg-white z-50 transform ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            } transition-transform duration-300 ease-in-out`}
        >
          <div className="p-4 border-b">
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>
              <i className="fas fa-church text-[#FF7E45] text-xl mr-2"></i>
              <h2 className="font-bold text-lg">St. Michael&apos;s Church</h2>
            </Link>
          </div>
          <ul className="p-4 space-y-2">
            <li>
              <Link
                to="/"
                className="block p-2 hover:text-[#FF7E45]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-home mr-2"></i>Home
              </Link>
            </li>
            <li >
              <Link
                to="/events"
                className="block p-2 hover:text-[#FF7E45]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-calendar-alt mr-2"></i>Events
              </Link>
            </li>
            <li>
              <Link
                to="/sermons"
                className="block p-2 hover:text-[#FF7E45]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-video mr-2"></i>Sermons
              </Link>
            </li>
            <li>
              <Link to="/donate"
                className="block p-2 hover:text-[#FF7E45]"
                onClick={() => setMobileMenuOpen(false)}>
                <i className="fas fa-dollar-sign mr-2"></i>Donate
              </Link>
            </li>
            <li>
              <Link to="/blog"
                className="block p-2 hover:text-[#FF7E45]"
                onClick={() => setMobileMenuOpen(false)}>
                <i className="fas fa-blog mr-2"></i>Blog
              </Link>
            </li>
            <li><Link to="/ministries"
              className="block p-2 hover:text-[#FF7E45]"
              onClick={() => setMobileMenuOpen(false)}>
              <i className="fas fa-people-carry mr-2"></i>Ministries
            </Link>
            </li>
            <li>
              <Link to="/testimonials"
                className="block p-2 hover:text-[#FF7E45]"
                onClick={() => setMobileMenuOpen(false)}>
                <i className="fas fa-comments mr-2"></i>Testimonials
              </Link>
            </li>
            <li>
              <Link to="/prayer" className="block p-2 hover:text-[#FF7E45]"
                onClick={() => setMobileMenuOpen(false)}>
                <i className="fas fa-praying-hands mr-2"></i>Prayer
              </Link>
            </li>

            {userRole === "admin" && userId && (
              <li>
                <Link
                  to={`/admin/${userId}/dashboard`}
                  className="block p-2 hover:text-[#FF7E45]"
                  onClick={() => setMobileMenuOpen(false)}>
                  <i className="fas fa-cog mr-2"></i>Admin Dashboard
                </Link>
              </li>
            )}

            {userRole === "user" && userId && (
              <li>
                <Link
                  to={`/user/${userId}/dashboard`}
                  className="block p-2 hover:text-[#FF7E45]"
                  onClick={() => setMobileMenuOpen(false)}>
                  <i className="fas fa-cog mr-2"></i>User Dashboard
                </Link>
              </li>
            )}

          </ul>
          <div className="p-4 border-t">
            {!isAuthenticated ? (
              <Link
                to="/login"
                className="w-full btn btn-primary flex items-start justify-start"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-sign-in-alt mr-2"></i>Login
              </Link>
            ) : (
              <div className="space-y-2">
                <p className="font-medium flex items-center">
                  <i className="fas fa-user-circle mr-2 text-[#FF7E45]"></i>
                  {userName}
                </p>
                {userId && (
                  <>
                    <Link
                      to={`/profile/${userId}`}
                      className="w-full btn btn-outline flex items-center justify-center hover:text-[#FF7E45]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <i className="fas fa-user mr-2"></i>Profile
                    </Link>
                    {userRole === "user" && (
                      <Link
                        to={`/my-rsvps/${userId}`}
                        className="w-full btn btn-outline flex items-center justify-center hover:text-[#FF7E45]"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <i className="fas fa-calendar-check mr-2"></i>My RSVPs
                      </Link>
                    )}
                  </>
                )}
                <button
                  className="w-full btn btn-primary flex items-center justify-center hover:text-[#e74c3c]"
                  onClick={handleLogout}
                >
                  <i className="fas fa-sign-out-alt mr-2"></i>Logout
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