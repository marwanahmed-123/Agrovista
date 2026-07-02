import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { authService } from "../../services/authService";
import EyeIcon from "../../components/EyeIcon";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (currentPassword.length < 6) {
      setError("Current password must be at least 6 characters.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password cannot be the same as the current password.");
      return;
    }

    setLoading(true);
    try {
      await api.patch("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setSuccess("Password changed successfully.");
      localStorage.removeItem("mustChangePassword");
      setTimeout(() => navigate("/admin"), 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to change password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] p-3 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Change Your Password
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              You are required to change your password before continuing.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your temporary password"
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  <EyeIcon open={showCurrent} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  <EyeIcon open={showNew} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-white font-semibold text-sm tracking-wide transition-all duration-200 disabled:opacity-70 hover:brightness-110 active:scale-[0.98] bg-primary-deeper"
            >
              {loading ? "Changing Password…" : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
