import { Button } from "@/components/ui/button";
import { getOAuthAuthorizeUrl, loginAsGuest } from "@/services/authApi";
import { useAuthStore } from "@/store/useAuthStore";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser, setToken, setError } = useAuthStore();
  const [guestName, setGuestName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setLocalError(null);

    try {
      const { authorizationUrl } = await getOAuthAuthorizeUrl();
      window.location.assign(authorizationUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setLocalError(message);
      setError(message);
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setLocalError("Please enter a name");
      return;
    }

    setIsLoading(true);
    setLocalError(null);

    try {
      const data = await loginAsGuest(guestName.trim());
      setToken(data.token);
      setUser({
        id: data.userId,
        name: data.name,
        role: data.role,
      });
      navigate("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Guest login failed";
      setLocalError(message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
            Scout
          </h1>
          <p className="text-center text-gray-600">Geocaching Adventure</p>
        </div>

        {localError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{localError}</p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Sign in with Google
            </h2>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              {isLoading ? "Redirecting..." : "Sign in with Google"}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <form onSubmit={handleGuestLogin} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !guestName.trim()}
            >
              {isLoading ? "Logging in..." : "Login as Guest"}
            </Button>
          </form>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          Only @escoteiros.org.br accounts allowed
        </p>
      </div>
    </div>
  );
}
