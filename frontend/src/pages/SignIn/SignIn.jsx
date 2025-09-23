import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function SignIn() {
  const navigate = useNavigate();
  const [storedProfile, setStoredProfile] = useState(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [name, setName] = useState("");
  const [buddyName, setBuddyName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) return;
    
    // Immediate load without artificial delay for better UX
    const profileJSON = localStorage.getItem("userProfile");
    if (profileJSON) {
      try {
        const profile = JSON.parse(profileJSON);
        console.log("Found existing profile in localStorage:", profile);
        setStoredProfile(profile);
      } catch (error) {
        console.error("Error parsing profile:", error);
        // Generate new code if parsing fails
        generateNewCode();
      }
    } else {
      generateNewCode();
    }
    setIsLoading(false);
    effectRan.current = true;
  }, []);

  const generateNewCode = () => {
    const newCode = Math.random().toString(36).substring(2, 10);
    console.log("Generated secret code:", newCode);
    setGeneratedCode(newCode);
  };

  const handleSaveProfile = async () => {
    if (!name.trim() || !buddyName.trim() || !email.trim()) {
      alert("Please fill all details to save profile.");
      return;
    }

    if (!validateEmail(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    setIsSaving(true);
    
    // Minimal delay for better UX feel
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const profile = {
      secret_code: generatedCode,
      name: name.trim(),
      buddy_name: buddyName.trim(),
      email_id: email.trim(),
    };

    localStorage.setItem("userProfile", JSON.stringify(profile));
    console.log("Saved new profile in localStorage:", profile);
    setStoredProfile(profile);
    setIsSaving(false);
    
    alert(`Profile saved successfully! Your secret code: ${generatedCode}`);
    navigate("/home");
  };

  const handleLogin = () => {
    console.log("Logging in with profile:", storedProfile);
    alert(`Welcome back, ${storedProfile.name}!`);
    navigate("/home");
  };

  const handleEnterNewKey = () => {
    console.log("Entering new profile. Clearing previous data.");
    localStorage.removeItem("userProfile");
    setStoredProfile(null);
    generateNewCode();
    setName("");
    setBuddyName("");
    setEmail("");
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 bg-[#0033A0] rounded-full mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 transition-opacity duration-300">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-gray-100 transition-transform duration-300">
        {storedProfile ? (
          <div className="transition-all duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#0033A0] to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-lg font-bold">
                  {storedProfile.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Welcome Back!
              </h2>
              <p className="text-sm text-gray-600">
                Ready to continue as <span className="text-[#0033A0] font-medium">{storedProfile.name}</span>?
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleLogin}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#0033A0] to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-800 hover:to-blue-900 transition-colors duration-200 shadow-md"
              >
                Continue to App
              </button>
              <button
                onClick={handleEnterNewKey}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:border-[#0033A0] hover:text-[#0033A0] transition-colors duration-200"
              >
                Switch Account
              </button>
            </div>
          </div>
        ) : (
          <div className="transition-all duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#0033A0] to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">🔐</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Create Your Profile
              </h2>
              <p className="text-sm text-gray-600">
                Let's get you started with a secure access code
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
              <p className="text-xs font-medium text-[#0033A0] mb-2 text-center uppercase tracking-wide">
                Your Secure Access Code
              </p>
              <div className="p-3 bg-white rounded-lg font-mono text-lg text-center text-[#0033A0] font-bold border border-blue-200">
                {generatedCode}
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Save this code securely for future access
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0033A0] focus:border-transparent transition-colors duration-200"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buddy's Name *
                </label>
                <input
                  type="text"
                  value={buddyName}
                  onChange={(e) => setBuddyName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0033A0] focus:border-transparent transition-colors duration-200"
                  placeholder="Enter your buddy's name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0033A0] focus:border-transparent transition-colors duration-200"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full px-4 py-3 bg-gradient-to-r from-[#0033A0] to-blue-700 text-white text-sm font-medium rounded-lg mt-6 hover:from-blue-800 hover:to-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-md"
            >
              {isSaving ? (
                <span className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving Profile...
                </span>
              ) : (
                "Create Profile & Continue"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}