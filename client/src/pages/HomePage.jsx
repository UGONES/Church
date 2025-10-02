import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swiper from "swiper";
import "swiper/swiper-bundle.css";
import {
  sermonService,
  eventService,
  testimonialService,
  ministryService,
  utilityService,
} from "../services/apiService";
import Loader from "../components/Loader";
import { useAlert } from "../utils/Alert";
import { Sermon } from "../models/Sermon";
import { Event } from "../models/Events"; // Fixed import name (should be Event, not Events)
import { Testimonial } from "../models/Testimonial";

const HomePage = () => {
  const alert = useAlert();
  const navigate = useNavigate();
  const [featuredSermon, setFeaturedSermon] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [ministries, setMinistries] = useState([]);
  const [serviceTimes, setServiceTimes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [churchStats, setChurchStats] = useState(null);
  const [heroContent, setHeroContent] = useState(null);
  const [liveStatus, setLiveStatus] = useState(null);

  // Fetch all homepage data
  useEffect(() => {
    document.title =
      "SMC: - Home | St. Micheal`s & All Angels Church | Ifite-Awka";
    fetchHomePageData();
  }, []);

  // Initialize swiper when testimonials are loaded
  useEffect(() => {
    if (testimonials.length > 0) {
      const swiper = new Swiper(".testimonial-swiper", {
        slidesPerView: 1,
        spaceBetween: 30,
        pagination: {
          el: ".swiper-pagination",
          clickable: true,
        },
        breakpoints: {
          640: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        },
        autoplay: { delay: 5000 },
        loop: true,
      });

      return () => {
        swiper.destroy();
      };
    }
  }, [testimonials.length]);

  const fetchHomePageData = async () => {
    try {
      setIsLoading(true);

      // Fetch all data in parallel using the apiService
      const [
        sermonsResponse,
        eventsResponse,
        testimonialsResponse,
        ministriesResponse,
        serviceTimesResponse,
        statsResponse,
        heroResponse,
        liveResponse,
      ] = await Promise.allSettled([
        sermonService.getFeatured(3),
        eventService.getUpcoming(3),
        testimonialService.getApproved(6),
        ministryService.getAll(),
        utilityService.getServiceTimes(),
        utilityService.getChurchStats(),
        utilityService.getHeroContent(),
        utilityService.getLiveStatus(),
      ]);

      // Handle responses
      if (
        sermonsResponse.status === "fulfilled" &&
        sermonsResponse.value.success
      ) {
        setFeaturedSermon(
          sermonsResponse.value.data[0]
            ? new Sermon(sermonsResponse.value.data[0])
            : null,
        );
      }

      if (
        eventsResponse.status === "fulfilled" &&
        eventsResponse.value.success
      ) {
        setUpcomingEvents(
          eventsResponse.value.data.map((event) => new Event(event)),
        );
      }

      if (
        testimonialsResponse.status === "fulfilled" &&
        testimonialsResponse.value.success
      ) {
        setTestimonials(
          testimonialsResponse.value.data.map(
            (testimonial) => new Testimonial(testimonial),
          ),
        );
      }

      if (
        ministriesResponse.status === "fulfilled" &&
        ministriesResponse.value.success
      ) {
        setMinistries(ministriesResponse.value.data.slice(0, 4)); // Get only first 4 ministries
      }

      if (
        serviceTimesResponse.status === "fulfilled" &&
        serviceTimesResponse.value.success
      ) {
        setServiceTimes(serviceTimesResponse.value.data);
      }

      if (statsResponse.status === "fulfilled" && statsResponse.value.success) {
        setChurchStats(statsResponse.value.data);
      }

      if (heroResponse.status === "fulfilled" && heroResponse.value.success) {
        setHeroContent(heroResponse.value.data);
      }

      if (liveResponse.status === "fulfilled" && liveResponse.value.success) {
        setLiveStatus(liveResponse.value.data);
      }
    } catch (error) {
      console.error("Error fetching home page data:", error);
      alert.error("Failed to load some content. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const getNextServiceDate = () => {
    const today = new Date();
    const daysUntilSunday = 7 - today.getDay();
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + daysUntilSunday);
    return formatDate(nextSunday);
  };

  if (isLoading) {
    return <Loader type="spinner" text="Loading church information..." />;
  }

  return (
    <div className="page">
      {/* Hero Section */}
      <HeroSection onNavigate={navigate} heroContent={heroContent} />

      {/* Featured Service */}
      <FeaturedServiceSection
        nextServiceDate={getNextServiceDate()}
        onNavigate={navigate}
        liveStatus={liveStatus}
      />

      {/* Weekly Schedule */}
      <ScheduleSection serviceTimes={serviceTimes} />

      {/* Ministries Preview */}
      <MinistriesSection ministries={ministries} onNavigate={navigate} />

      {/* Testimonials */}
      <TestimonialsSection testimonials={testimonials} onNavigate={navigate} />

      {/* Latest Sermons */}
      <SermonsSection featuredSermon={featuredSermon} onNavigate={navigate} />

      {/* Upcoming Events Section */}
      <EventsSection upcomingEvents={upcomingEvents} onNavigate={navigate} />

      {/* Call to Action */}
      <CallToActionSection onNavigate={navigate} churchStats={churchStats} />
    </div>
  );
};

// Hero Section Component
const HeroSection = ({ onNavigate, heroContent }) => (
  <section className="hero relative flex items-center justify-center min-h-screen overflow-hidden">
    <div className="absolute inset-0 w-full h-full">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
        poster="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
      >
        <source
          src="https://player.vimeo.com/external/370331493.sd.mp4?s=ada720b5a8e8c7c7e94aeb5f0937b39b2bb2e8d6&profile_id=139&oauth2_token_id=57447761"
          type="video/mp4"
        />
        <img
          src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwa90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
          alt="Church background"
          className="w-full h-full object-cover"
        />
      </video>
      <div className="absolute inset-0 bg-black bg-opacity-40" />
    </div>

    <div className="container mx-auto px-4 text-center text-white relative z-10">
      <div className="mb-6">
        <i className="fas fa-church text-4xl md:text-5xl text-white mb-4" />
      </div>

      <h2 className="text-4xl font-bold mb-4 m-0">
        Welcome to St Michael's & All Angels Anglican Church Ifite-Awka
      </h2>
      <p className="text-lg m-0 max-w-2xl font-bold mx-auto">
        The Throne Of Grace Parish.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8">
        <button
          className="btn bg-[#FF7E45] hover:bg-white text-white hover:text-[#FF7E45] border-2 border-[#FF7E45] px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
          onClick={() => onNavigate("/events")}
        >
          <i className="far fa-calendar-alt mr-2" /> Upcoming Events
        </button>
        <button
          className="btn bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#FF7E45] px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105"
          onClick={() => onNavigate("/sermons")}
        >
          <i className="fas fa-play-circle mr-2" /> Watch Sermons
        </button>
      </div>
    </div>

    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
      <div className="animate-bounce">
        <i className="fas fa-chevron-down text-white text-2xl" />
      </div>
    </div>

    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent h-32" />
  </section>
);

// Featured Service Section Component
const FeaturedServiceSection = ({
  nextServiceDate,
  onNavigate,
  liveStatus,
}) => (
  <section className="py-12 bg-white">
    <div className="container mx-auto px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Join Us This Sunday</h2>
        <p className="text-gray-600">
          Experience worship, community, and inspiration
        </p>
      </div>

      <div className="bg-[#F9F7F4] rounded-lg shadow-md overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/2">
            <img
              src="https://cdn.pixabay.com/photo/2016/11/22/19/15/crowd-1850119_1280.jpg"
              alt="Sunday Service"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src =
                  "https://cdn.pixabay.com/photo/2016/11/22/19/15/crowd-1850119_1280.jpg";
              }}
            />
          </div>
          <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
            <div className="text-[#FF7E45] font-semibold mb-2">
              NEXT SERVICE
            </div>
            <h3 className="text-2xl font-bold mb-4">
              Finding Peace in Troubled Times
            </h3>
            <p className="text-gray-700 mb-6">
              Join us this Sunday for an inspiring message about discovering
              God's peace in our daily lives.
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center">
                <i className="far fa-calendar text-[#FF7E45] mr-2" />
                <span>{nextServiceDate}</span>
              </div>
              <div className="flex items-center">
                <i className="far fa-clock text-[#FF7E45] mr-2" />
                <span>9:00 AM & 11:00 AM</span>
              </div>
            </div>

            {/* Live Status Indicator */}
            {liveStatus && liveStatus.isLive && (
              <div className="mt-4 flex items-center">
                <span className="relative flex h-3 w-3 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
                <span className="text-red-600 font-semibold">Live Now</span>
              </div>
            )}

            <button
              className="btn btn-outline mt-6 hover:bg-[#FF7E45] p-2 rounded-lg transition-colors duration-200 hover:text-white"
              onClick={() => onNavigate("/events")}
            >
              Plan Your Visit
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// Schedule Section Component
const ScheduleSection = ({ serviceTimes }) => (
  <section className="py-12 bg-gray-50">
    <div className="container mx-auto px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Weekly Schedule</h2>
        <p className="text-gray-600">Join us for these regular activities</p>
      </div>

      {serviceTimes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {serviceTimes.map((service, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="text-[#FF7E45] text-2xl mb-3">
                <i
                  className={`fas ${
                    service.service.includes("Sunday")
                      ? "fa-pray"
                      : service.service.includes("Bible")
                        ? "fa-book-open"
                        : "fa-users"
                  }`}
                />
              </div>
              <h3 className="text-xl font-bold mb-2">{service.service}</h3>
              <p className="text-gray-600 mb-4">{service.description}</p>
              <div className="flex items-center text-sm text-gray-500">
                <i className="far fa-clock mr-2" />
                <span>{service.time}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">Service times will be posted soon.</p>
        </div>
      )}
    </div>
  </section>
);

// Ministries Section Component
const MinistriesSection = ({ ministries, onNavigate }) => (
  <section className="py-12 bg-white">
    <div className="container mx-auto px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Our Ministries</h2>
        <p className="text-gray-600 mb-6">
          How we're serving our community and beyond
        </p>
      </div>

      {ministries.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {ministries.slice(0, 4).map((ministry, index) => (
              <div
                key={ministry.id || index}
                className="ministry-card group"
                onClick={() => onNavigate("/ministries")}
              >
                <div className="h-48 bg-gray-200 relative overflow-hidden">
                  <img
                    src={
                      ministry.imageUrl ||
                      "https://cdn.pixabay.com/photo/2017/01/14/19/42/woman-1980079_1280.jpg"
                    }
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    alt={ministry.name}
                    onError={(e) => {
                      e.target.src =
                        "https://cdn.pixabay.com/photo/2017/01/14/19/42/woman-1980079_1280.jpg";
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="text-xl font-bold">{ministry.name}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              className="btn btn-outline hover:bg-[#FF7E45] p-2 rounded-lg transition-colors duration-200 hover:text-white"
              onClick={() => onNavigate("/ministries")}
            >
              View All Ministries
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">
            Ministry information will be available soon.
          </p>
        </div>
      )}
    </div>
  </section>
);

// Testimonials Section Component
const TestimonialsSection = ({ testimonials, onNavigate }) => (
  <section className="py-12 bg-gray-50">
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-2">Testimonials</h2>
        <p className="text-gray-600">Stories from our church family</p>
      </div>

      {testimonials.length > 0 ? (
        <div className="testimonial-swiper swiper">
          <div className="swiper-wrapper pb-12">
            {testimonials.map((testimonial, index) => (
              <div key={testimonial.id || index} className="swiper-slide">
                <div className="testimonial-card h-full flex flex-col bg-white p-6 rounded-lg shadow-md">
                  <div className="mb-4 text-[#FF7E45]">
                    <i className="fas fa-quote-left text-3xl" />
                  </div>
                  <p className="flex-grow text-gray-700 italic mb-4">
                    {testimonial.content}
                  </p>
                  <div className="flex items-center">
                    <img
                      src={
                        testimonial.imageUrl ||
                        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                      }
                      alt={testimonial.author}
                      className="w-12 h-12 rounded-full object-cover mr-4"
                      onError={(e) => {
                        e.target.src =
                          "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
                      }}
                    />
                    <div>
                      <h4 className="font-semibold">{testimonial.author}</h4>
                      <p className="text-sm text-gray-600">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="swiper-pagination" />
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">No testimonials available yet.</p>
        </div>
      )}

      <div className="text-center mt-8">
        <button
          className="btn btn-outline hover:bg-[#FF7E45] p-2 rounded-lg transition-colors duration-200 hover:text-white"
          onClick={() => onNavigate("/testimonials")}
        >
          Read More Stories
        </button>
      </div>
    </div>
  </section>
);

// Sermons Section Component
const SermonsSection = ({ featuredSermon, onNavigate }) => (
  <section className="py-12 bg-white">
    <div className="container mx-auto px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Latest Sermons</h2>
        <p className="text-gray-600">Watch or listen to recent messages</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featuredSermon ? (
          <>
            <div
              className="sermon-card cursor-pointer"
              onClick={() => onNavigate("/sermons")}
            >
              <div className="relative">
                <img
                  src={
                    featuredSermon.imageUrl ||
                    "https://cdn.pixabay.com/photo/2018/03/03/20/02/laptop-3196481_1280.jpg"
                  }
                  alt={featuredSermon.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.src =
                      "https://cdn.pixabay.com/photo/2018/03/03/20/02/laptop-3196481_1280.jpg";
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <div className="w-16 h-16 bg-[#FF7E45] text-white rounded-full flex items-center justify-center">
                    <i className="fas fa-play text-2xl" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="text-sm text-gray-500 mb-2">
                  {new Date(featuredSermon.date).toLocaleDateString()}
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {featuredSermon.title}
                </h3>
                <p className="text-gray-600">{featuredSermon.speaker}</p>
              </div>
            </div>

            {[1, 2].map((item) => (
              <div
                key={item}
                className="sermon-card opacity-50 cursor-pointer"
                onClick={() => onNavigate("/sermons")}
              >
                <div className="relative">
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <i className="fas fa-sermon text-3xl text-gray-400" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-3" />
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </>
        ) : (
          [1, 2, 3].map((item) => (
            <div key={item} className="sermon-card animate-pulse">
              <div className="w-full h-48 bg-gray-200" />
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-3" />
                <div className="h-6 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-center mt-8">
        <button
          className="btn btn-outline hover:bg-[#FF7E45] p-2 rounded-lg transition-colors duration-200 hover:text-white"
          onClick={() => onNavigate("/sermons")}
        >
          View All Sermons
        </button>
      </div>
    </div>
  </section>
);

// Events Section Component
const EventsSection = ({ upcomingEvents, onNavigate }) => (
  <section className="upcoming-events-section py-12 bg-gray-50">
    <div className="container mx-auto px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Upcoming Events</h2>
        <p className="text-gray-600">Join us for these upcoming events</p>
      </div>

      {upcomingEvents.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No upcoming events found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {upcomingEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="text-[#FF7E45] text-2xl mb-3">
                <i
                  className={`fas ${
                    event.type === "service"
                      ? "fa-pray"
                      : event.type === "bible-study"
                        ? "fa-book-open"
                        : "fa-users"
                  }`}
                />
              </div>
              <h3 className="text-xl font-bold mb-2">{event.title}</h3>
              <p className="text-gray-600 mb-4">{event.description}</p>
              <div className="flex items-center text-sm text-gray-500">
                <i className="far fa-clock mr-2" />
                <span>{new Date(event.startTime).toLocaleString()}</span>
                {event.location && (
                  <span className="ml-4">| {event.location}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center mt-8">
        <button
          className="btn btn-outline hover:bg-[#FF7E45] p-2 rounded-lg transition-colors duration-200 hover:text-white"
          onClick={() => onNavigate("/events")}
        >
          View All Events
        </button>
      </div>
    </div>
  </section>
);

// Call to Action Section Component
const CallToActionSection = ({ onNavigate, churchStats }) => (
  <section className="py-16 bg-gradient-to-r from-[#FF7E45] to-[#F4B942] text-white">
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-4">
        Join Our Community
      </h2>
      <p className="text-xl mb-8 max-w-2xl mx-auto">
        Become part of a loving church family and grow in your faith journey.
      </p>

      {/* Church Stats */}
      {churchStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="text-center">
            <div className="text-3xl font-bold">{churchStats.members}+</div>
            <div className="text-sm">Members</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{churchStats.ministries}</div>
            <div className="text-sm">Ministries</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{churchStats.events}</div>
            <div className="text-sm">Events</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{churchStats.community}</div>
            <div className="text-sm">Community</div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <button
          className="btn bg-white p-2 rounded-lg text-[#FF7E45] hover:text-white hover:bg-transparent border-2 hover:border-white "
          onClick={() => onNavigate("/events")}
        >
          Plan Your Visit
        </button>
        <button
          className="btn bg-transparent border-2 border-white p-2 rounded-lg hover:bg-white hover:text-[#FF7E45]"
          onClick={() => onNavigate("/prayer")}
        >
          Submit Prayer Request
        </button>
      </div>
    </div>
  </section>
);

export default HomePage;
