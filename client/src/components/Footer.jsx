import React from "react";

const Footer = ({ setActivePage }) => {
  return (
    <footer className="bg-gray-900 text-white mt-12">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo + About */}
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <i className="fas fa-church text-[#FF7E45] mr-2" />
              St. Michael's & All Angels Church <br /> Ifite-Awka
            </h3>
            <p className="mb-4">The Throne of Grace Parish</p>
            <div className="flex space-x-4">
              <button className="text-[#FF7E45] hover:text-[#FFA76A]">
                <a
                  href="https://www.facebook.com/SMAC.Media.Team"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fab fa-facebook-f text-xl" />
                </a>
              </button>
              <button className="text-[#FF7E45] hover:text-[#FFA76A]">
                <a
                  href="https://www.instagram.com/stmichaelschurch"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fab fa-instagram text-xl" />
                </a>
              </button>
              <button className="text-[#FF7E45] hover:text-[#FFA76A]">
                <a
                  href="https://www.youtube.com/stmichaelschurch"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fab fa-youtube text-xl" />
                </a>
              </button>
              <button className="text-[#FF7E45] hover:text-[#FFA76A]">
                <a
                  href="https://www.spotify.com/stmichaelschurch"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fab fa-spotify text-xl" />
                </a>
              </button>
              <button className="text-[#FF7E45] hover:text-[#FFA76A]">
                <a
                  href="https://www.tiktok.com/@stmichaelschurch"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fab fa-tiktok text-xl" />
                </a>
              </button>
              <button className="text-[#FF7E45] hover:text-[#FFA76A]">
                <a
                  href="https://www.whatsapp.com/stmichaelschurch"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fab fa-whatsapp text-xl" />
                </a>
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setActivePage("events")}
                  className="hover:text-[#FF7E45]"
                >
                  Upcoming Events
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePage("sermons")}
                  className="hover:text-[#FF7E45]"
                >
                  Latest Sermons
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePage("blog")}
                  className="hover:text-[#FF7E45]"
                >
                  News & Announcements
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePage("donate")}
                  className="hover:text-[#FF7E45]"
                >
                  Support Our Church
                </button>
              </li>
            </ul>
          </div>

          {/* Service Times */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Service Times</h4>
            <ul className="space-y-2">
              <li>Sunday: 9:00 AM & 11:00 AM</li>
              <li>Wednesday: 7:00 PM</li>
              <li>Prayer Meeting: Tuesday 6:30 PM</li>
              <li>Youth Group: Friday 7:00 PM</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2">
              <li className="flex items-center">
                <i className="fas fa-map-marker-alt text-[#FF7E45] mr-2" />
                123 Faith Avenue, Cityville
              </li>
              <li className="flex items-center">
                <i className="fas fa-phone text-[#FF7E45] mr-2" />
                (555) 123-4567
              </li>
              <li className="flex items-center">
                <i className="fas fa-envelope text-[#FF7E45] mr-2" />
                info@stmichaelschurch .org
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p>
            &copy; {new Date().getFullYear()} St. Micheal`s & All Angels Church
            Ifite-Awka. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
