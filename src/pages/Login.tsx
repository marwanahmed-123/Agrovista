import { useState } from "react";
import { useForm } from "react-hook-form";
import { authService } from "../services/authService";
import { useNavigate, Navigate } from "react-router-dom";
import EyeIcon from "../components/EyeIcon";

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  if (authService.isAuthenticated()) {
    return <Navigate to="/admin" replace />;
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.login(data.email, data.password);
      const user = authService.getCurrentUser();
      if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
        if (res.mustChangePassword) {
          navigate("/admin/change-password");
        } else {
          navigate("/admin");
        }
      } else {
        setError("Access denied. Admin privileges required.");
        authService.logout();
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="../../assets/LandingPage2.png"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-xl px-8 sm:px-10 py-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-1 text-primary-deeper">
              Agrovista
            </h1>
            <p className="text-gray-500 text-sm">Admin Portal</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                {error}
              </div>
            )}

            <div className="mb-4">
              <input
                id="email"
                type="email"
                placeholder="Email Address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="mb-6">
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg text-white font-semibold text-sm tracking-wide transition-all duration-200 disabled:opacity-70 hover:brightness-110 active:scale-[0.98] bg-primary-deeper"
            >
              {isLoading ? "Signing in\u2026" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
