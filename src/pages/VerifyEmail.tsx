import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";

interface VerifyForm {
  email: string;
  code: string;
}

export default function VerifyEmail() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get("email");
  const successTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyForm>({
    defaultValues: {
      email: emailFromUrl || "",
      code: "",
    },
  });

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const onSubmit = async (data: VerifyForm) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post("/auth/verify-email", {
        email: data.email,
        code: data.code,
      });
      setSuccess("Email verified successfully! You can now login.");
      successTimerRef.current = setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Verification failed. Please check your code.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async (email: string) => {
    setIsResending(true);
    setError(null);
    try {
      await api.post("/auth/resend-code", { email });
      setSuccess("A new verification code has been sent to your email.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
            Verify Email
          </h1>
          <p className="text-gray-500 text-sm">
            Enter the verification code sent to your email
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg">
              {success}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              id="code"
              type="text"
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              {...register("code", {
                required: "Verification code is required",
                minLength: { value: 6, message: "Code must be 6 digits" },
                maxLength: { value: 6, message: "Code must be 6 digits" },
                pattern: { value: /^\d{6}$/, message: "Code must be 6 digits" },
              })}
            />
            {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-70"
          >
            {isLoading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm mb-2">
            Didn't receive the code?
          </p>
          <button
            type="button"
            onClick={() => {
              const emailInput = document.getElementById(
                "email",
              ) as HTMLInputElement;
              if (emailInput?.value) {
                handleResendCode(emailInput.value);
              }
            }}
            disabled={isResending}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-70"
          >
            {isResending ? "Sending..." : "Resend Code"}
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-gray-500 text-sm">
            <Link
              to="/login"
              className="text-primary hover:text-primary-dark font-medium"
            >
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}