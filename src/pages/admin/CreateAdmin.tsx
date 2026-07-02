import { useState } from "react";
import { useForm } from "react-hook-form";
import { userService } from "../../services/userService";

interface CreateAdminForm {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export default function CreateAdmin() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    message: string;
    tempPassword: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAdminForm>();

  const onSubmit = async (data: CreateAdminForm) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await userService.createAdmin({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber || undefined,
      });
      setSuccess({
        message: "Admin created successfully!",
        tempPassword: result.tempPassword,
      });
      reset();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to create admin. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] p-3 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
            Create Admin
          </h1>
          <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">
            Create a new admin account. A temporary password will be generated.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl bg-red-50 border border-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-2xl bg-green-50 border border-green-100 p-4">
            <p className="text-green-700 font-medium">{success.message}</p>
            <div className="mt-3 bg-green-100 rounded-xl p-3">
              <p className="text-xs text-green-600 font-medium uppercase tracking-wide">
                Temporary Password
              </p>
              <p className="text-lg font-mono font-bold text-green-800 mt-1">
                {success.tempPassword}
              </p>
              <p className="text-xs text-green-600 mt-2">
                Share this password securely with the new admin. They will be
                prompted to change it on first login.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 text-gray-800">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none transition"
                  {...register("firstName", {
                    required: "First name is required",
                  })}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none transition"
                  {...register("lastName", {
                    required: "Last name is required",
                  })}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 sm:mt-6">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="john.doe@agrovista.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none transition"
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

            <div className="mt-4 sm:mt-6">
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Phone Number{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="phoneNumber"
                type="tel"
                placeholder="+201234567890"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none transition"
                {...register("phoneNumber", {
                  pattern: {
                    value: /^\+?\d{7,15}$/,
                    message: "Enter a valid phone number (7–15 digits)",
                  },
                })}
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            <div className="mt-6 sm:mt-8 flex items-center gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 rounded-xl text-white font-semibold text-sm tracking-wide transition-all duration-200 disabled:opacity-70 hover:brightness-110 active:scale-[0.98] bg-primary-deeper"
              >
                {isLoading ? "Creating..." : "Create Admin"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
