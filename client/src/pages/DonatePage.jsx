import { useState, useEffect } from "react";
import { loadStripe } from '@stripe/stripe-js';
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { donationService } from '../services/apiService';
import useAuth from '../hooks/useAuth';
import Loader from '../components/Loader';
import { useAlert } from "../utils/Alert";
import { Donation } from '../models/Donation';

// Initialize Stripe with error handling
const stripePromise = (() => {
  try {
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_51S4Wi6ChmgWsJLauutuaPwfQHKs4rIvaErdDw4t03Jqd3H3amLPN50aYEetNjTgz68vY9CiHXHMc3ws7hnwLzwta00C9tLMWbo";
    if (!stripeKey) {
      console.error('Stripe publishable key is missing');
      return null;
    }
    return loadStripe(stripeKey);
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    return null;
  }
})();

// Card Payment Form Component
const CardPaymentForm = ({
  onSubmit,
  isProcessing,
  setIsProcessing,   // ✅ consistent naming
  billingAddress,
  onBillingAddressChange
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || isMounted) return;

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/donate?success=true`,
        payment_method_data: {
          billing_details: { address: billingAddress }
        }
      },
      redirect: "if_required"
    });

    if (error) {
      setMessage(error.message);
    } else if (paymentIntent?.status === "succeeded") {
      onSubmit(paymentIntent);
    } else {
      setMessage("Unexpected state");
    }

    setIsProcessing(false);
  };

  if (!isMounted) {
    return <div>Loading payment form...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ✅ This renders card input fields */}
      <PaymentElement />

      {/* Billing Information */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h3 className="font-medium text-gray-800 mb-3">Billing Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Address Line 1 *", name: "line1", required: true },
            { label: "Address Line 2", name: "line2" },
            { label: "City *", name: "city", required: true },
            { label: "State *", name: "state", required: true },
            { label: "Postal Code *", name: "postal_code", required: true },
            { label: "Country *", name: "country", required: true }
          ].map(({ label, name, required }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                type="text"
                name={name}
                required={required}
                className="form-input border rounded-md w-full py-2 px-3 border-gray-300"
                value={billingAddress[name] || ""}
                onChange={(e) =>
                  onBillingAddressChange({
                    ...billingAddress,
                    [name]: e.target.value
                  })
                }
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-[#FF7E45] text-white py-3 px-4 rounded-md hover:bg-[#F4B942] transition-colors disabled:opacity-50"
      >
        {isProcessing ? "Processing..." : "Donate Now"}
      </button>

      {message && <div className="text-red-500 text-sm mt-2">{message}</div>}

      {/* Stripe branding */}
      <div className="text-xs text-gray-500 text-center flex flex-col items-center">
        <div className="flex justify-center gap-4 w-full">
          <span className="flex items-center">
            <i className="fas fa-lock mr-1 text-green-500"></i>
            Your payment information is encrypted and secure
          </span>
          <div className="border border-[#635BFF] rounded-md px-3 py-1 inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="80" viewBox="0 0 300 40">
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="33"
                fontFamily="Arial, sans-serif"
                fill="#635BFF"
                fontWeight="bold"
              >
                Powered by Stripe
              </text>
            </svg>
          </div>
        </div>
      </div>
    </form>
  );
};

// Bank Transfer Form Component
const BankTransferForm = ({
  onSubmit,
  isProcessing,
  bankDetails,
  onBankDetailsChange
}) => {
  const [bankInfo, setBankInfo] = useState(bankDetails);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...bankInfo, [name]: value };
    setBankInfo(updated);
    onBankDetailsChange(updated); // ✅ properly update parent
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default here
    onSubmit(e); // Pass the event to the parent
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-green-50 border border-green-200 rounded-md">
        <h3 className="font-medium text-green-800 mb-3">Bank Transfer Information</h3>
        <div className="space-y-3">
          {[
            { label: "Bank Name *", name: "bankName", placeholder: "e.g., Chase Bank" },
            { label: "Account Number *", name: "accountNumber", placeholder: "Your account number" },
            { label: "Transaction Number *", name: "transactionNumber", placeholder: "Your transaction number" },
            { label: "Account Holder Name *", name: "accountName", placeholder: "Name on account" }
          ].map(({ label, name, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="text"
                name={name}
                value={bankInfo[name]}
                onChange={handleChange}
                placeholder={placeholder}
                required
                className="form-input border rounded-md w-full py-2 px-3 border-gray-300"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isProcessing}
        className="w-full bg-[#FF7E45] text-white py-3 px-4 rounded-md hover:bg-[#F4B942] transition-colors disabled:opacity-50"
      >
        {isProcessing ? "Processing..." : "Confirm Bank Transfer"}
      </button>
    </form>
  );
};

const DonatePage = () => {
  const { user } = useAuth();
  const [donationAmount, setDonationAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [currency, setCurrency] = useState("USD", "NGN", "EUR");
  const [donationFrequency, setDonationFrequency] = useState("one-time");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingPaymentIntent, setIsLoadingPaymentIntent] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [donationStats, setDonationStats] = useState(null);
  const [recentDonations, setRecentDonations] = useState([]);
  const [userDonations, setUserDonations] = useState([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donationPurpose, setDonationPurpose] = useState("");
  const [billingAddress, setBillingAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: ""
  });
  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    accountNumber: "",
    routingNumber: "",
    accountName: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState("");

  const isAdmin = user?.role === "admin";
  const isRegularUser = user?.isLoggedIn && user?.role === "user";
  const alert = useAlert();

  useEffect(() => {
    if (!stripePromise) {
      alert.error("Payment system failed to load. Please refresh the page.");
    }
  }, [alert]);

  // Load data based on user role
  useEffect(() => {
    document.title = "SMC: - Donation | St. Micheal`s & All Angels Church | Ifite-Awka";
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
    if (urlParams.get('success') === 'true') {
      setShowThankYou(true);
      alert.success("Thank you for your donation! Your payment was successful.");
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('canceled') === 'true') {
      alert.info("Donation process was canceled.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const createPaymentIntent = async () => {
      console.log("Payment method:", paymentMethod, "Amount:", donationAmount);

      if (paymentMethod === "card" && donationAmount > 0) {
        setIsLoadingPaymentIntent(true);
        try {
          console.log("Creating payment intent for amount:", donationAmount);
          const res = await donationService.createPaymentIntent({
            amount: parseFloat(donationAmount),
            currency: "usd"
          });

          console.log("Full payment intent response:", res);

          // Check different possible response structures
          if (res.data?.clientSecret) {
            // If response is { data: { clientSecret: '...' } }
            setClientSecret(res.data.clientSecret);
            console.log("Client secret set from res.data.clientSecret");
          } else if (res.clientSecret) {
            // If response is { clientSecret: '...' }
            setClientSecret(res.clientSecret);
            console.log("Client secret set from res.clientSecret");
          } else if (res.data) {
            // If the entire response is the data object
            setClientSecret(res.data);
            console.log("Client secret set from res.data");
          } else {
            console.error("No client secret found in response structure:", res);
            alert.error("Payment system error: No client secret received");
          }
        } catch (err) {
          console.error("Error creating payment intent:", err);
          alert.error("Failed to initialize payment. Please try again.");
        } finally {
          setIsLoadingPaymentIntent(false);
        }
      } else {
        console.log("Resetting client secret - conditions not met");
        setClientSecret("");
      }
    };

    createPaymentIntent();
  }, [donationAmount, paymentMethod]);

  const fetchUserDonations = async () => {
    try {
      setIsLoading(true);
      const response = await donationService.getUserDonations();
      if (response.success) {
        setUserDonations(response.data.map(donation => new Donation(donation)));
      }
    } catch (error) {
      console.error('Error fetching user donations:', error);
      if (error.response?.status === 401) {
        alert.info('Please log in to view your donation history');
      } else {
        alert.error('Failed to load donation history');
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
      console.error('Error fetching donation stats:', error);
      if (error.response?.status === 403) {
        alert.error('Access denied. Admin privileges required.');
      } else {
        alert.error('Failed to load donation statistics');
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
        setRecentDonations(response.data.map(donation => new Donation(donation)));
      }
    } catch (error) {
      console.error('Error fetching recent donations:', error);
      if (error.response?.status === 403) {
        alert.error('Access denied. Admin privileges required.');
      } else {
        alert.error('Failed to load recent donations');
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
      console.error('Error fetching all donations:', error);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      errors.amount = "Please enter a valid donation amount";
    }

    if (!user?.isLoggedIn) {
      if (!guestEmail) {
        errors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(guestEmail)) {
        errors.email = "Email address is invalid";
      }

      if (!guestName && !isAnonymous) {
        errors.name = "Name is required unless donating anonymously";
      }
    }

    if (paymentMethod === "card") {
      if (!billingAddress.line1 || !billingAddress.city || !billingAddress.state ||
        !billingAddress.postal_code || !billingAddress.country) {
        errors.billing = "Complete billing address is required for card payments";
      }
    } else if (paymentMethod === "bank") {
      if (!bankDetails.bankName || !bankDetails.accountNumber ||
        !bankDetails.routingNumber || !bankDetails.accountName) {
        errors.bank = "Complete bank details are required for bank transfers";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  const handleDonation = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    // If payment method is card, return early (card payments are handled by Stripe)
    if (paymentMethod === "card") {
      return;
    }

    const validation = validateForm();
    if (!validation.isValid) {
      Object.values(validation.errors).forEach(error => {
        alert.error(error);
      });
      return;
    }

    setIsProcessing(true);

    try {
      const donationData = {
        amount: parseFloat(donationAmount),
        frequency: donationFrequency,
        paymentMethod,
        purpose: donationPurpose,
        isAnonymous,
        billingAddress: paymentMethod === "card" ? billingAddress : undefined,
        bankDetails: paymentMethod === "bank" ? bankDetails : undefined
      };

      if (!user?.isLoggedIn) {
        donationData.email = guestEmail;
        donationData.name = isAnonymous ? "Anonymous" : guestName;
      }

      const response = await donationService.create(donationData);

      if (response.success) {
        setShowThankYou(true);
        alert.success("Thank you for your donation!");

        // Reset form
        setDonationAmount("");
        setCustomAmount("");
        setDonationPurpose("");
        setBillingAddress({
          line1: "", line2: "", city: "", state: "", postal_code: "", country: ""
        });
        setBankDetails({
          bankName: "", accountNumber: "", routingNumber: "", accountName: ""
        });

        // Refresh user donations if logged in
        if (user?.isLoggedIn) {
          fetchUserDonations();
        }
      } else {
        alert.error(response.message || "Failed to process donation");
      }
    } catch (error) {
      console.error('Donation error:', error);
      alert.error("An error occurred while processing your donation");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateStatus = async (donationId, status) => {
    try {
      const response = await donationService.update(donationId, { status });
      if (response.success) {
        alert.success('Donation status updated successfully');
        fetchRecentDonations();
        fetchAllDonations();
      }
    } catch (error) {
      console.error('Error updating donation status:', error);
      alert.error('Failed to update donation status');
    }
  };

  const viewDonationDetails = (donationId) => {
    // In a real implementation, this would open a modal or navigate to a details page
    alert.info('Donation details feature would open here');
  };

  const handleAmountSelect = (amount) => {
    const sanitizedAmount = amount.toString().replace(/[^0-9.]/g, '');
    setDonationAmount(sanitizedAmount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    const decimalCount = (value.match(/\./g) || []).length;

    if (decimalCount <= 1 && (value === '' || !isNaN(value))) {
      setCustomAmount(value);
      if (value) {
        setDonationAmount(value);
      }
    }
  };

  const exportDonations = async (format = 'csv') => {
    try {
      await donationService.exportDonations(format);
      alert.success(`Donations exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      alert.error('Failed to export donations. Please try again.');
    }
  };

  const downloadReceipt = async (donationId) => {
    try {
      await donationService.downloadReceipt(donationId);
      alert.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert.error('Failed to download receipt. Please try again.');
    }
  };

  const formatCurrency = (amount, currency = "USD", locale = "en-US") => {
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      console.error("Currency formatting error:", error);
      return amount;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const resetForm = () => {
    setShowThankYou(false);
    setDonationAmount("");
    setCustomAmount("");
    setDonationFrequency("one-time");
    setPaymentMethod("card");
    setDonationPurpose("");
    setGuestEmail("");
    setGuestName("");
    setIsAnonymous(false);
    setBillingAddress({
      line1: "", line2: "", city: "", state: "", postal_code: "", country: ""
    });
    setBankDetails({
      bankName: "", accountNumber: "", routingNumber: "", accountName: ""
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
        </div>
      </section>

      {/* Donation Form Section */}
      <DonationFormSection
        user={user}
        clientSecret={clientSecret}  // ✅ pass down
        stripePromise={stripePromise}
        donationAmount={donationAmount}
        customAmount={customAmount}
        donationFrequency={donationFrequency}
        paymentMethod={paymentMethod}
        isAnonymous={isAnonymous}
        isLoadingPaymentIntent={isLoadingPaymentIntent}
        donationPurpose={donationPurpose}
        CardPaymentForm={CardPaymentForm}
        billingAddress={billingAddress}
        bankDetails={bankDetails}
        guestEmail={guestEmail}
        guestName={guestName}
        currency={currency}
        setCurrency={setCurrency}
        formatCurrency={formatCurrency}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}  // ✅ consistent naming
        showThankYou={showThankYou}
        onAmountSelect={handleAmountSelect}
        onCustomAmountChange={handleCustomAmountChange}
        onFrequencyChange={setDonationFrequency}
        onPaymentMethodChange={setPaymentMethod}
        onAnonymousChange={setIsAnonymous}
        onDonationPurposeChange={setDonationPurpose}
        onBillingAddressChange={setBillingAddress}
        onBankDetailsChange={setBankDetails}
        onGuestEmailChange={setGuestEmail}
        onGuestNameChange={setGuestName}
        onSubmit={handleDonation}
        onReset={resetForm}
      />

      {/* User Donations Section */}
      {isRegularUser && userDonations.length > 0 && (
        <UserDonationsSection
          userDonations={userDonations}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          onDownloadReceipt={downloadReceipt}
        />
      )}

      {/* Admin Panel Toggle */}
      {isAdmin && (
        <div className="container mx-auto px-4 mb-6">
          <button
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            {showAdminPanel ? 'Hide Admin Panel' : 'Show Admin Panel'}
          </button>
        </div>
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
          fetchAllDonations={fetchAllDonations}
        />
      )}
    </div>
  );
};

// User Donations Section Component
const UserDonationsSection = ({
  userDonations,
  formatCurrency,
  formatDate,
  onDownloadReceipt
}) => (
  <section className="bg-gray-50 py-8">
    <div className="container mx-auto px-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <i className="fas fa-receipt mr-2 text-[#FF7E45]"></i>
          Your Donation History
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Purpose</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {userDonations.map((donation, index) => (
                <tr key={index} className="border-b">
                  <td className="px-4 py-2 font-semibold">{formatCurrency(donation.amount)}</td>
                  <td className="px-4 py-2">{formatDate(donation.date)}</td>
                  <td className="px-4 py-2 capitalize">{donation.frequency}</td>
                  <td className="px-4 py-2">{donation.purpose || "General"}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${donation.status === 'succeeded'
                      ? 'bg-green-100 text-green-800'
                      : donation.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                      {donation.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {donation.status === 'succeeded' && (
                      <button
                        onClick={() => onDownloadReceipt(donation.id)}
                        className="text-[#FF7E45] hover:text-[#F4B942] text-sm"
                      >
                        <i className="fas fa-download mr-1"></i>Receipt
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
  onDownloadReceipt,
  onViewDetails,
  fetchAllDonations
}) => (
  <section className="bg-gray-50 py-8">
    <div className="container mx-auto px-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Donation Analytics</h2>

        {donationStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800">Total Donations</h3>
              <p className="text-2xl font-bold">{formatCurrency(donationStats.totalAmount)}</p>
              <p className="text-sm text-gray-600">{donationStats.totalCount} donations</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800">This Month</h3>
              <p className="text-2xl font-bold">{formatCurrency(donationStats.monthlyAmount)}</p>
              <p className="text-sm text-gray-600">{donationStats.monthlyCount} donations</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-800">Recurring</h3>
              <p className="text-2xl font-bold">{formatCurrency(donationStats.recurringAmount)}</p>
              <p className="text-sm text-gray-600">{donationStats.recurringCount} active</p>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Recent Donations</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => onExportDonations('csv')}
              className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm"
            >
              Export CSV
            </button>
            <button
              onClick={() => onExportDonations('excel')}
              className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm"
            >
              Export Excel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Donor</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Method</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentDonations.map((donation, index) => (
                <tr key={index} className="border-b">
                  <td className="px-4 py-2">
                    {donation.isAnonymous ? 'Anonymous' : donation.donorName}
                  </td>
                  <td className="px-4 py-2 font-semibold">{formatCurrency(donation.amount)}</td>
                  <td className="px-4 py-2">{formatDate(donation.date)}</td>
                  <td className="px-4 py-2 capitalize">{donation.paymentMethod}</td>
                  <td className="px-4 py-2">
                    <select
                      value={donation.status}
                      onChange={(e) => onUpdateStatus(donation.id, e.target.value)}
                      className={`px-2 py-1 rounded-full text-xs ${donation.status === 'succeeded'
                        ? 'bg-green-100 text-green-800'
                        : donation.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                        }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="succeeded">Succeeded</option>
                      <option value="failed">Failed</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 flex space-x-2">
                    <button
                      onClick={() => onViewDetails(donation.id)}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                      <i className="fas fa-eye mr-1"></i>View
                    </button>
                    {donation.status === 'succeeded' && (
                      <button
                        onClick={() => onDownloadReceipt(donation.id)}
                        className="text-green-500 hover:text-green-700 text-sm"
                      >
                        <i className="fas fa-download mr-1"></i>Receipt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={fetchAllDonations}
            className="bg-[#FF7E45] text-white px-4 py-2 rounded-md hover:bg-[#F4B942]"
          >
            View All Donations
          </button>
        </div>
      </div>
    </div>
  </section>
);

// Donation Form Section Component with all new fields
const DonationFormSection = ({
  user,
  clientSecret,
  stripePromise,
  donationAmount,
  customAmount,
  donationFrequency,
  paymentMethod,
  isAnonymous,
  isLoadingPaymentIntent,
  donationPurpose,
  CardPaymentForm,
  billingAddress,
  bankDetails,
  formatCurrency,
  guestEmail,
  guestName,
  isProcessing,
  setIsProcessing,
  showThankYou,
  onAmountSelect,
  currency,
  setCurrency,
  onCustomAmountChange,
  onFrequencyChange,
  onPaymentMethodChange,
  onAnonymousChange,
  onDonationPurposeChange,
  onBillingAddressChange,
  onBankDetailsChange,  // ✅ fixed
  onGuestEmailChange,
  onGuestNameChange,
  onSubmit,
  onReset
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
                    <i className="fas fa-church text-[#FF7E45] mt-1 mr-3"></i>
                    <span>Maintain our church facilities</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-hands-helping text-[#FF7E45] mt-1 mr-3"></i>
                    <span>Support local and global missions</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-graduation-cap text-[#FF7E45] mt-1 mr-3"></i>
                    <span>Provide educational resources</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-users text-[#FF7E45] mt-1 mr-3"></i>
                    <span>Fund community outreach programs</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-hands text-[#FF7E45] mt-1 mr-3"></i>
                    <span>Care for those in need</span>
                  </li>
                </ul>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold mb-2">Tax Deductible</h3>
                  <p className="text-sm text-gray-600">
                    St. Michael's Church is a 501(c)(3) organization. Your donations are tax-deductible to the extent allowed by law.
                  </p>
                </div>
              </div>

              {/* Right Column - Donation Form */}
              <div className="md:w-1/2 p-6 md:p-8">
                <h2 className="text-2xl font-bold mb-6">Make a Donation</h2>

                {/* Amount Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Donation Amount
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {[25, 50, 100, 250, 500, 1000].map(amount => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => onAmountSelect(amount)}
                        className={`py-2 px-3 rounded-md border ${donationAmount === amount.toString()
                          ? 'bg-[#FF7E45] text-white border-[#FF7E45]'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {formatCurrency(amount, currency)}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Or enter custom amount
                    </label>

                    <div className="flex gap-2">
                      {/* Currency Selector */}
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="border rounded-md py-2 px-3 text-gray-700 bg-white shadow-sm"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="NGN">NGN (₦)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>

                      {/* Custom Amount Input */}
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                          {currency === "USD"
                            ? "$"
                            : currency === "NGN"
                              ? "₦"
                              : currency === "EUR"
                                ? "€"
                                : "£"}
                        </span>
                        <input
                          type="number"
                          value={customAmount}
                          onChange={(e) => onCustomAmountChange(e)}
                          className="pl-7 form-input border rounded-md w-full py-2 px-3 border-gray-300"
                          placeholder="Enter amount"
                        />
                      </div>
                    </div>

                    {/* Show formatted preview below input */}
                    {customAmount && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formatCurrency(customAmount, currency, currency === "NGN" ? "en-NG" : "en-US")}
                      </p>
                    )}
                  </div>

                </div>

                {/* Frequency Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="frequency"
                        value="one-time"
                        checked={donationFrequency === "one-time"}
                        onChange={() => onFrequencyChange("one-time")}
                        className="form-radio h-4 w-4 text-[#FF7E45]"
                      />
                      <span className="ml-2">One-time</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="frequency"
                        value="monthly"
                        checked={donationFrequency === "monthly"}
                        onChange={() => onFrequencyChange("monthly")}
                        className="form-radio h-4 w-4 text-[#FF7E45]"
                      />
                      <span className="ml-2">Monthly</span>
                    </label>
                  </div>
                </div>

                {/* Purpose Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Donation Purpose (Optional)
                  </label>
                  <select
                    value={donationPurpose}
                    onChange={(e) => onDonationPurposeChange(e.target.value)}
                    className="form-select border rounded-md w-full py-2 px-3 border-gray-300"
                  >
                    <option value="">General Fund</option>
                    <option value="building">Building Fund</option>
                    <option value="missions">Missions</option>
                    <option value="youth">Youth Ministry</option>
                    <option value="outreach">Community Outreach</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Guest Information for non-logged in users */}
                {!user?.isLoggedIn && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-md">
                    <h3 className="font-medium text-gray-800 mb-3">Your Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={guestEmail}
                          onChange={(e) => onGuestEmailChange(e.target.value)}
                          className="form-input border rounded-md w-full py-2 px-3 border-gray-300"
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name {!isAnonymous ? '*' : ''}
                        </label>
                        <input
                          type="text"
                          value={guestName}
                          onChange={(e) => onGuestNameChange(e.target.value)}
                          disabled={isAnonymous}
                          className="form-input border rounded-md w-full py-2 px-3 border-gray-300 disabled:bg-gray-100"
                          placeholder="Your name"
                          required={!isAnonymous}
                        />
                      </div>
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => onAnonymousChange(e.target.checked)}
                          className="form-checkbox h-4 w-4 text-[#FF7E45]"
                        />
                        <span className="ml-2">Donate anonymously</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Payment Method Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === "card"}
                        onChange={() => onPaymentMethodChange("card")}
                        className="form-radio h-4 w-4 text-[#FF7E45]"
                      />
                      <span className="ml-2">Credit/Debit Card</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank"
                        checked={paymentMethod === "bank"}
                        onChange={() => onPaymentMethodChange("bank")}
                        className="form-radio h-4 w-4 text-[#FF7E45]"
                      />
                      <span className="ml-2">Bank Transfer</span>
                    </label>
                  </div>
                </div>

                {/* Payment Form */}
                {paymentMethod === "bank" ? (
                  <BankTransferForm
                    onSubmit={onSubmit}
                    isProcessing={isProcessing}
                    bankDetails={bankDetails}
                    onBankDetailsChange={onBankDetailsChange} // ✅ fix
                  />
                ) : null}
                {paymentMethod === "card" && (
                  <div>
                    {isLoadingPaymentIntent ? (
                      <div className="text-center py-4">
                        <Loader type="spinner" text="Initializing payment..." />
                      </div>
                    ) : clientSecret ? (
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <CardPaymentForm
                          onSubmit={onSubmit}
                          isProcessing={isProcessing}
                          setIsProcessing={setIsProcessing}
                          billingAddress={billingAddress}
                          onBillingAddressChange={onBillingAddressChange}
                        />
                      </Elements>
                    ) : donationAmount > 0 ? (
                      <div className="text-yellow-600 text-sm py-2">
                        Unable to initialize payment. Please try selecting the amount again.
                      </div>
                    ) : null}
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-4">
                  By donating, you agree to our Terms of Service and Privacy Policy.
                  Your payment information is securely processed.
                </p>
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
      <i className="fas fa-check text-green-500 text-3xl"></i>
    </div>
    <h2 className="text-3xl font-bold mb-4">
      Thank You For Your Donation!
    </h2>
    <p className="text-xl text-gray-600 mb-6">
      Your generosity helps us continue our mission.
    </p>
    <p className="mb-8">
      A receipt has been sent to your email address.
    </p>
    <button
      onClick={onReset}
      className="border border-gray-300 px-6 py-2 rounded-md hover:bg-gray-50 transition-colors"
    >
      Make Another Donation
    </button>
  </div>
);

export default DonatePage;