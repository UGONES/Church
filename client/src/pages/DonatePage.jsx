import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { donationService } from "../constants/apiService";
import Loader from "../components/Loader";
import { useAlert } from "../utils/Alert";
import { Donation } from "../models/Donation";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const DonatePage = ({ user }) => {
  const [donationAmount, setDonationAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [donationFrequency, setDonationFrequency] = useState("one-time");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [donationStats, setDonationStats] = useState(null);
  const [recentDonations, setRecentDonations] = useState([]);
  const [userDonations, setUserDonations] = useState([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = user?.role === "admin";
  const isRegularUser = user?.isLoggedIn && user?.role === "user";
  const alert = useAlert(); // Use the custom alert hook

  // Load data based on user role
  useEffect(() => {
    document.title =
      "SMC: - Donation | St. Micheal`s & All Angels Church | Ifite-Awka";
    if (isAdmin) {
      fetchDonationStats();
      fetchRecentDonations();
      fetchAllDonations();
    } else if (isRegularUser) {
      fetchUserDonations();
    }
  }, [isAdmin, isRegularUser]);

  // Check for success or cancel parameters in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("success") === "true") {
      setShowThankYou(true);
      alert.success(
        "Thank you for your donation! Your payment was successful.",
      );
      window.history.replaceState({}, document.title, window.location.pathname);

      // Refresh data if user is admin or logged in
      if (isAdmin) {
        fetchDonationStats();
        fetchRecentDonations();
        fetchAllDonations();
      } else if (isRegularUser) {
        fetchUserDonations();
      }
    }
    if (urlParams.get("canceled") === "true") {
      alert.info(
        "Donation was canceled. You can try again whenever you're ready.",
      );
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [isAdmin, isRegularUser]);

  const fetchUserDonations = async () => {
    try {
      setIsLoading(true);
      const response = await donationService.getUserDonations();
      if (response.success) {
        setUserDonations(
          response.data.map((donation) => new Donation(donation)),
        );
      }
    } catch (error) {
      console.error("Error fetching user donations:", error);
      if (error.response?.status === 401) {
        alert.info("Please log in to view your donation history");
      } else {
        alert.error("Failed to load donation history");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDonationStats = async () => {
    try {
      setIsLoading(true);
      const response = await donationService.getStats();
      if (response.success) {
        setDonationStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching donation stats:", error);
      if (error.response?.status === 403) {
        alert.error("Access denied. Admin privileges required.");
      } else {
        alert.error("Failed to load donation statistics");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentDonations = async () => {
    try {
      setIsLoading(true);
      const response = await donationService.getRecent();
      if (response.success) {
        setRecentDonations(
          response.data.map((donation) => new Donation(donation)),
        );
      }
    } catch (error) {
      console.error("Error fetching recent donations:", error);
      if (error.response?.status === 403) {
        alert.error("Access denied. Admin privileges required.");
      } else {
        alert.error("Failed to load recent donations");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllDonations = async () => {
    try {
      const response = await donationService.getAll();
      if (response.success) {
        // Handle all donations data for admin
      }
    } catch (error) {
      console.error("Error fetching all donations:", error);
    }
  };

  const validateForm = () => {
    const errors = {};

    // Validate amount
    const amount = customAmount || donationAmount;
    if (!amount || amount === "custom") {
      errors.amount = "Please select or enter an amount";
    } else {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum < 1 || amountNum > 100000) {
        errors.amount = "Please enter a valid amount between $1 and $100,000";
      }
    }

    // Validate guest information if not logged in
    if (!user?.isLoggedIn) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!guestEmail || !emailRegex.test(guestEmail)) {
        errors.email = "Please enter a valid email address";
      }
      if (!guestName || guestName.trim().length < 2) {
        errors.name = "Please enter your full name";
      }
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const handleDonation = async (e) => {
    e.preventDefault();

    const { isValid, errors } = validateForm();
    if (!isValid) {
      const firstError = Object.values(errors)[0];
      if (firstError) {
        alert.error(firstError);
      }
      return;
    }

    setIsProcessing(true);

    try {
      const amount = customAmount || donationAmount;
      const amountNum = parseFloat(amount);

      const donorEmail = user?.email || guestEmail;
      const donorName = user?.name || guestName;

      const response = await donationService.createDonation({
        amount: amountNum,
        currency: "usd",
        frequency: donationFrequency,
        email: donorEmail,
        name: donorName,
        userId: user?.id || null,
        successUrl: `${window.location.origin}/donate?success=true`,
        cancelUrl: `${window.location.origin}/donate?canceled=true`,
      });

      if (response.success && response.data.sessionId) {
        const stripe = await stripePromise;
        if (!stripe) {
          throw new Error("Payment service failed to initialize");
        }

        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId: response.data.sessionId,
        });

        if (stripeError) {
          throw new Error(stripeError.message || "Payment processing error");
        }
      } else {
        throw new Error("Failed to create donation session");
      }
    } catch (error) {
      console.error("Donation Processing Error:", error);
      alert.error(
        error.message ||
          "An unexpected error occurred. Please try again later.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Added missing functions referenced in AdminPanel
  const handleUpdateStatus = async (donationId, status) => {
    try {
      const response = await donationService.update(donationId, { status });
      if (response.success) {
        alert.success("Donation status updated successfully");
        fetchRecentDonations();
      }
    } catch (error) {
      console.error("Error updating donation status:", error);
      alert.error("Failed to update donation status");
    }
  };

  const viewDonationDetails = (donationId) => {
    alert.info("Donation details feature would open here");
  };

  const handleAmountSelect = (amount) => {
    const sanitizedAmount = amount.toString().replace(/[^0-9.]/g, "");
    setDonationAmount(sanitizedAmount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    const decimalCount = (value.match(/\./g) || []).length;

    if (decimalCount <= 1) {
      setCustomAmount(value);
      setDonationAmount("custom");
    }
  };

  const exportDonations = async (format = "csv") => {
    try {
      await donationService.exportDonations(format);
      alert.success(
        `Donations exported successfully as ${format.toUpperCase()}`,
      );
    } catch (error) {
      console.error("Export error:", error);
      alert.error("Failed to export donations. Please try again.");
    }
  };

  const downloadReceipt = async (donationId) => {
    try {
      await donationService.downloadReceipt(donationId);
      alert.success("Receipt downloaded successfully");
    } catch (error) {
      console.error("Error downloading receipt:", error);
      alert.error("Failed to download receipt. Please try again.");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return <Loader type="spinner" text="Loading ..." />;
  }

  return (
    <div className="page">
      {/* Header */}
      <section className="bg-gradient-to-r from-[#FF7E45] to-[#F4B942] py-12 px-4">
        <div className="container mx-auto text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Support Our Church</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Your generosity makes our ministry possible
          </p>

          {isAdmin && (
            <div className="mt-6">
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="bg-white text-[#FF7E45] px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <i
                  className={`fas ${showAdminPanel ? "fa-eye-slash" : "fa-chart-bar"} mr-2`}
                />
                {showAdminPanel
                  ? "Hide Admin Panel"
                  : "View Donation Analytics"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* User Donation History */}
      {isRegularUser && userDonations.length > 0 && !showAdminPanel && (
        <UserDonationsSection
          userDonations={userDonations}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          onDownloadReceipt={downloadReceipt}
        />
      )}

      {/* Admin Panel */}
      {isAdmin && showAdminPanel && (
        <AdminPanel
          donationStats={donationStats}
          recentDonations={recentDonations}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          onExportDonations={exportDonations}
          onUpdateStatus={handleUpdateStatus}
          onDownloadReceipt={downloadReceipt}
          onViewDetails={viewDonationDetails}
        />
      )}

      {/* Donation Form */}
      <DonationFormSection
        user={user}
        donationAmount={donationAmount}
        customAmount={customAmount}
        donationFrequency={donationFrequency}
        guestEmail={guestEmail}
        guestName={guestName}
        isProcessing={isProcessing}
        showThankYou={showThankYou}
        onAmountSelect={handleAmountSelect}
        onCustomAmountChange={handleCustomAmountChange}
        onFrequencyChange={setDonationFrequency}
        onGuestEmailChange={setGuestEmail}
        onGuestNameChange={setGuestName}
        onSubmit={handleDonation}
        onReset={() => {
          setShowThankYou(false);
          setDonationAmount("");
          setCustomAmount("");
          setDonationFrequency("one-time");
          setGuestEmail("");
          setGuestName("");
        }}
      />
    </div>
  );
};

// User Donations Section Component
const UserDonationsSection = ({
  userDonations,
  formatCurrency,
  formatDate,
  onDownloadReceipt,
}) => (
  <section className="bg-gray-50 py-8">
    <div className="container mx-auto px-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <i className="fas fa-receipt mr-2 text-[#FF7E45]" />
          Your Donation History
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {userDonations.map((donation, index) => (
                <tr key={index} className="border-b">
                  <td className="px-4 py-2 font-semibold">
                    {formatCurrency(donation.amount)}
                  </td>
                  <td className="px-4 py-2">{formatDate(donation.date)}</td>
                  <td className="px-4 py-2 capitalize">{donation.frequency}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        donation.status === "succeeded"
                          ? "bg-green-100 text-green-800"
                          : donation.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {donation.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {donation.status === "succeeded" && (
                      <button
                        onClick={() => onDownloadReceipt(donation.id)}
                        className="text-[#FF7E45] hover:text-[#F4B942] text-sm"
                      >
                        <i className="fas fa-download mr-1" />
                        Receipt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
);

// Updated AdminPanel component with correct props
const AdminPanel = ({
  donationStats,
  recentDonations,
  formatCurrency,
  formatDate,
  onExportDonations,
  onUpdateStatus,
}) => (
  <section className="bg-gray-50 py-8">
    <div className="container mx-auto px-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Donation Analytics</h2>

        {/* Donation statistics cards */}
        {donationStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800">
                Total Donations
              </h3>
              <p className="text-2xl font-bold">
                {formatCurrency(donationStats.totalAmount)}
              </p>
              <p className="text-sm text-gray-600">
                {donationStats.totalDonations} donations
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800">Successful</h3>
              <p className="text-2xl font-bold">
                {formatCurrency(donationStats.successfulAmount)}
              </p>
              <p className="text-sm text-gray-600">
                {donationStats.successfulCount} donations
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-800">Pending</h3>
              <p className="text-2xl font-bold">
                {formatCurrency(donationStats.pendingAmount)}
              </p>
              <p className="text-sm text-gray-600">
                {donationStats.pendingCount} donations
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-red-800">
                Failed/Refunded
              </h3>
              <p className="text-2xl font-bold">
                {formatCurrency(donationStats.failedAmount)}
              </p>
              <p className="text-sm text-gray-600">
                {donationStats.failedCount} donations
              </p>
            </div>
          </div>
        )}

        {/* Admin controls for donation management */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4">Donation Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <button
              className="btn bg-blue-500 text-white"
              onClick={() => onExportDonations("csv")}
            >
              Export CSV
            </button>
            <button
              className="btn bg-green-500 text-white"
              onClick={() => onExportDonations("json")}
            >
              Export JSON
            </button>
            <button
              className="btn bg-purple-500 text-white"
              onClick={() => onExportDonations("pdf")}
            >
              Export PDF
            </button>
            <button
              className="btn bg-red-500 text-white"
              onClick={fetchAllDonations}
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Recent donations table with admin actions */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Donor</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentDonations.map((donation) => (
                <tr key={donation._id} className="border-b">
                  <td className="px-4 py-2">{donation.donorName}</td>
                  <td className="px-4 py-2 font-semibold">
                    {formatCurrency(donation.amount)}
                  </td>
                  <td className="px-4 py-2">{formatDate(donation.date)}</td>
                  <td className="px-4 py-2">
                    <select
                      value={donation.status}
                      onChange={(e) =>
                        onUpdateStatus(donation._id, e.target.value)
                      }
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="succeeded">Succeeded</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => downloadReceipt(donation._id)}
                      className="text-blue-500 hover:text-blue-700 mr-2"
                    >
                      Receipt
                    </button>
                    <button
                      onClick={() => viewDonationDetails(donation._id)}
                      className="text-green-500 hover:text-green-700"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
);

// Donation Form Section Component
const DonationFormSection = ({
  user,
  donationAmount,
  customAmount,
  donationFrequency,
  guestEmail,
  guestName,
  isProcessing,
  showThankYou,
  onAmountSelect,
  onCustomAmountChange,
  onFrequencyChange,
  onGuestEmailChange,
  onGuestNameChange,
  onSubmit,
  onReset,
}) => (
  <section className="py-12">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto">
        {!showThankYou ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {/* Left Column - Why Give */}
              <div className="md:w-1/2 bg-[#F9F7F4] p-6 md:p-8">
                <h2 className="text-2xl font-bold mb-4">Why Give?</h2>
                <p className="mb-4">Your donations help us:</p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <i className="fas fa-church text-[#FF7E45] mt-1 mr-3" />
                    <span>Maintain our church facilities</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-hands-helping text-[#FF7E45] mt-1 mr-3" />
                    <span>Support local and global missions</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-graduation-cap text-[#FF7E45] mt-1 mr-3" />
                    <span>Provide educational resources</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-users text-[#FF7E45] mt-1 mr-3" />
                    <span>Fund community outreach programs</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-hands text-[#FF7E45] mt-1 mr-3" />
                    <span>Care for those in need</span>
                  </li>
                </ul>

                <div className="bg-white p-4 rounded-lg border border-[#FF7E45]">
                  <h3 className="font-semibold text-[#FF7E45] mb-2">
                    Secure Payment
                  </h3>
                  <p className="text-sm text-gray-600">
                    <i className="fas fa-lock mr-1 text-green-500" />
                    PCI DSS compliant processing through Stripe
                  </p>
                  <div className="flex mt-2">
                    <svg
                      viewBox="0 0 48 48"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-10 h-10"
                    >
                      <path
                        fill="#080f9ae8"
                        d="M44 12H4a4 4 0 0 0-4 4v16a4 4 0 0 0 4 4h40a4 4 0 0 0 4-4V16a4 4 0 0 0-4-4z"
                      />
                      <path
                        fill="#e9f009c2"
                        d="M16.9 31l2.8-14h3.6l-2.8 14H16.9zm13.3-13.8c-.7-.3-1.7-.6-2.9-.6-3.2 0-5.5 1.7-5.5 4.2 0 1.8 1.6 2.8 2.9 3.4 1.3.6 1.8 1 .1 1.7-1.3.6-2.6 1.5-2.6 3.2 0 1.6 1.5 2.6 3.6 2.6 2 0 3.2-.7 3.2-.7l.6-3.2s-1.2.7-2.4.7c-.8 0-1.5-.3-1.5-1.1 0-.8 1-1.2 2-1.7 1.9-.9 3.2-1.9 3.2-3.9-.2-2-1.9-3-3.6-3.6z"
                      />
                      <text
                        x="24"
                        y="30"
                        fontSize="14"
                        textAnchor="middle"
                        fill="#fefefed3"
                        fontFamily="Arial, sans-serif"
                        fontWeight="bold"
                      >
                        VISA
                      </text>
                    </svg>

                    <svg
                      viewBox="0 0 48 48"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-10 h-10"
                    >
                      <circle cx="18" cy="24" r="10" fill="#eb001b" />
                      <circle cx="30" cy="24" r="10" fill="#f79e1b" />
                      <path
                        d="M22 24a10 10 0 0 1 4-8 10 10 0 0 1 0 16 10 10 0 0 1-4-8z"
                        fill="#ff5f00"
                      />
                    </svg>

                    <svg
                      viewBox="0 0 48 48"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-10 h-10"
                    >
                      <path
                        fill="#2e77bc"
                        d="M44 12H4a4 4 0 0 0-4 4v16a4 4 0 0 0 4 4h40a4 4 0 0 0 4-4V16a4 4 0 0 0-4-4z"
                      />
                      <text
                        x="8"
                        y="28"
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="Arial, sans-serif"
                      >
                        AMEX
                      </text>
                    </svg>

                    <svg
                      viewBox="0 0 64 48"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-12 h-10 ml-2"
                    >
                      <rect width="64" height="40" rx="4" fill="#2e7d32" />
                      <rect
                        x="8"
                        y="10"
                        width="48"
                        height="6"
                        fill="#043607ff"
                      />
                      <circle cx="40" cy="28" r="5" fill="#fff" />
                      <circle cx="47" cy="28" r="5" fill="#ff3d00" />
                    </svg>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-2">
                    Security verified by:
                  </p>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-shield-alt text-green-500" />
                    <span className="text-xs">256-bit SSL Encryption</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Donation Form */}
              <div className="md:w-1/2 p-6 md:p-8">
                <h2 className="text-2xl font-bold mb-6">Make a Donation</h2>
                <form onSubmit={onSubmit} className="space-y-6">
                  {/* Donation Amount */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Select Amount
                    </label>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {["25", "50", "100", "250", "500"].map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          className={`py-3 rounded-md border transition-colors ${
                            donationAmount === amount
                              ? "border-[#FF7E45] bg-[#FF7E45] text-white"
                              : "border-gray-300 hover:border-[#FF7E45] hover:bg-gray-50"
                          }`}
                          onClick={() => onAmountSelect(amount)}
                        >
                          ${amount}
                        </button>
                      ))}
                      <button
                        type="button"
                        className={`py-3 rounded-md border transition-colors ${
                          donationAmount === "custom"
                            ? "border-[#FF7E45] bg-[#FF7E45] text-white"
                            : "border-gray-300 hover:border-[#FF7E45] hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          onAmountSelect("custom");
                        }}
                      >
                        Custom
                      </button>
                    </div>

                    {donationAmount === "custom" && (
                      <div className="mt-3">
                        <label className="block text-gray-700 text-sm mb-1">
                          Enter Custom Amount ($1 - $100,000)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            $
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            className="form-input pl-8 border rounded-md w-full py-2 px-3 focus:ring-2 focus:ring-[#FF7E45] border-gray-300"
                            value={customAmount}
                            onChange={onCustomAmountChange}
                            placeholder="0.00"
                            required={donationAmount === "custom"}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Donation Frequency */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Frequency
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {["one-time", "monthly", "yearly"].map((freq) => (
                        <button
                          key={freq}
                          type="button"
                          className={`py-2 rounded-md border transition-colors ${
                            donationFrequency === freq
                              ? "border-[#FF7E45] bg-[#FF7E45] text-white"
                              : "border-gray-300 hover:border-[#FF7E45] hover:bg-gray-50"
                          }`}
                          onClick={() => onFrequencyChange(freq)}
                        >
                          {freq === "one-time"
                            ? "One Time"
                            : freq.charAt(0).toUpperCase() + freq.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* User Information (if not logged in) */}
                  {!user?.isLoggedIn && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-yellow-800 text-sm mb-3">
                        <i className="fas fa-info-circle mr-1" />
                        Please provide your details for a receipt
                      </p>
                      <div className="space-y-3">
                        <div>
                          <input
                            type="email"
                            className="form-input border rounded-md w-full py-2 px-3 border-gray-300"
                            placeholder="Email for receipt *"
                            value={guestEmail}
                            onChange={(e) => onGuestEmailChange(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            className="form-input border rounded-md w-full py-2 px-3 border-gray-300"
                            placeholder="Full Name *"
                            value={guestName}
                            onChange={(e) => onGuestNameChange(e.target.value)}
                            required
                            minLength="2"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-[#FF7E45] text-white py-3 rounded-md hover:bg-[#FFA76A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors relative"
                  >
                    {isProcessing ? (
                      <>
                        <div className="absolute inset-0 bg-[#FF7E45] opacity-75" />
                        <span className="relative z-10">
                          <i className="fas fa-spinner fa-spin mr-2" />
                          Processing Securely...
                        </span>
                      </>
                    ) : (
                      "Continue to Secure Payment"
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    <i className="fas fa-lock mr-1 text-green-500" />
                    Your payment information is encrypted and secure
                  </p>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <ThankYouSection onReset={onReset} />
        )}
      </div>
    </div>
  </section>
);

// Thank You Section Component
const ThankYouSection = ({ onReset }) => (
  <div className="bg-white rounded-lg shadow-md p-8 text-center">
    <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
      <i className="fas fa-check text-green-500 text-3xl" />
    </div>
    <h2 className="text-3xl font-bold mb-4">Thank You For Your Donation!</h2>
    <p className="text-xl text-gray-600 mb-6">
      Your generosity helps us continue our mission.
    </p>
    <p className="mb-8">A receipt has been sent to your email address.</p>
    <button
      onClick={onReset}
      className="border border-gray-300 px-6 py-2 rounded-md hover:bg-gray-50 transition-colors"
    >
      Make Another Donation
    </button>
  </div>
);

export default DonatePage;
