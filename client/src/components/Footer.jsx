
import {
  Church,
  Instagram,
  Youtube,
  Music,
  MessageCircle,
  MapPin,
  Phone,
  Mail,
  FacebookIcon
} from "lucide-react";


const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-12">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo + About */}
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Church className="text-[#FF7E45] mr-2" size={30} />
              St. Michael's & All Angels Church <br /> Ifite-Awka
            </h3>
            <p className="mb-4">The Throne of Grace Parish</p>
            <div className="flex space-x-4">
              <button className="text-[#FF7E45] hover:text-[#FFA76A]">
                <a href="https://www.facebook.com/SMAC.Media.Team" target="_blank" rel="noopener noreferrer">
                  <FacebookIcon color="#0008faff" size={20} />
                </a>
              </button>
              <button className="text-[#FF7E45] hover:text-[#FFA76A]">
                <a href="https://www.instagram.com/stmichaelschurch" target="_blank" rel="noopener noreferrer">
                  <Instagram color="#fb00ff" size={20} />
                </a>
              </button>
              <button className="text-[#FF7E45] hover:text-[#FFA76A]">
                <a href="https://www.youtube.com/stmichaelschurch" target="_blank" rel="noopener noreferrer">
                  <Youtube color="#ff0000ff" size={20} />
                </a>
              </button>
              <button className="text-[#FF7E45] hover:text-[#FFA76A]">
                <a href="https://www.spotify.com/stmichaelschurch" target="_blank" rel="noopener noreferrer">
                  <Music color="#6aff00" size={20} />
                </a>
              </button>
              <button className="text-[#FF7E45] hover:text-[#FFA76A]">
                <a href="https://www.tiktok.com/@stmichaelschurch" target="_blank" rel="noopener noreferrer">
                  <Music color="#2e2d2abf" size={20} />
                </a>
              </button>
              <button className="text-[#FF7E45] hover:text-[#FFA76A]">
                <a href="https://www.whatsapp.com/stmichaelschurch" target="_blank" rel="noopener noreferrer">
                  <MessageCircle color="#00fa3aff" size={20} />
                </a>
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/events"
                  className="hover:text-[#FF7E45]"
                >
                  Upcoming Events
                </a>
              </li>
              <li>
                <a
                  href="/sermons"
                  className="hover:text-[#FF7E45]"
                >
                  Latest Sermons
                </a>
              </li>
              <li>
                <a
                  href="/blog"
                  className="hover:text-[#FF7E45]"
                >
                  News & Announcements
                </a>
              </li>
              <li>
                <a
                  href="/donate"
                  className="hover:text-[#FF7E45]"
                >
                  Support Our Church
                </a>
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
                <MapPin className="text-[#FF7E45] mr-2" size={18} />
                123 Faith Avenue, Cityville
              </li>
              <li className="flex items-center">
                <Phone className="text-[#FF7E45] mr-2" size={18} />
                (555) 123-4567
              </li>
              <li className="flex items-center">
                <Mail className="text-[#FF7E45] mr-2" size={18} />
                michaelmassifite@gmail.com
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p>
            &copy; {new Date().getFullYear()} St. Micheal`s & All Angels Church Ifite-Awka. All Rights
            Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
