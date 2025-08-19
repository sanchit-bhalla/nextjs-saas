"use client";

import { resendOtp, verifyOtp } from "@/actions/actions";
import { OTP_EXPIRATION_SECONDS, OTP_LENGTH } from "@/constants";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface OtpFormProps {
  userId: string;
}
interface statusType {
  type: "success" | "error" | "info" | null;
  message?: string;
}

export default function OtpForm({ userId }: OtpFormProps) {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [status, setStatus] = useState<statusType>({
    type: null,
    message: "",
  });
  const [timer, setTimer] = useState(OTP_EXPIRATION_SECONDS);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;
    if (isNaN(Number(value))) return;

    setStatus({ type: null, message: "" }); // Clear status message on input change
    const newOtp = [...otp];
    if (value.length > 1) {
      for (let i = 0; i < value.length; i++) {
        if (index + i < OTP_LENGTH) {
          newOtp[index + i] = value[i];
        } else {
          break;
        }
      }
    } else {
      // Also useful for clearing the input i.e when user types backspace (value = "")
      newOtp[index] = value;
    }

    setOtp(newOtp);
    if (index + value.length < OTP_LENGTH - 1) {
      inputRefs.current[index + value.length]?.focus();
    } else {
      inputRefs.current[OTP_LENGTH - 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    const target = e.target as HTMLInputElement;
    if (e.key === "Backspace" && !target.value && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setStatus({ type: null, message: "" });

      const enteredOtp = otp.join("");
      if (enteredOtp.length !== OTP_LENGTH) {
        setStatus({ type: "error", message: "Please enter a valid OTP" });
        return;
      }

      const { error, success } = await verifyOtp(userId, otp.join(""));
      setOtp(Array(OTP_LENGTH).fill("")); // Clear OTP input after verification attempt
      if (error) {
        setStatus({ type: "error", message: error });
        return;
      }
      setStatus({
        type: "success",
        message: success || "OTP verified successfully!",
      });
      toast(success || "OTP verified successfully!");
      router.replace("/login"); // Redirect to login page after successful verification
    } catch (err) {
      if (err instanceof Error) {
        setStatus({ type: "error", message: err.message });
      } else {
        setStatus({
          type: "error",
          message: "An error occurred while verifying OTP.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsResending(true);
      setStatus({ type: null, message: "" });

      const { error } = await resendOtp();
      if (error) {
        setStatus({ type: "error", message: error });
        return;
      } else {
        setOtp(Array(OTP_LENGTH).fill("")); // clear OTP input
        setStatus({
          type: "info",
          message: "OTP has been resent to your email.",
        });
        setTimer(OTP_EXPIRATION_SECONDS); // Reset timer
        inputRefs.current[0]?.focus(); // Focus the first input field
      }
    } catch (err) {
      if (err instanceof Error) {
        setStatus({ type: "error", message: err.message });
      } else {
        setStatus({
          type: "error",
          message: "An error occurred while resending OTP.",
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  // useEffect to handle the countdown timer
  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prevTimer) => prevTimer - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
        Verify your account
      </h2>
      <p className="text-sm text-gray-500 text-center mb-6">
        Please enter the {OTP_LENGTH}-digit code sent to your email.
      </p>

      <form onSubmit={handleVerify}>
        <div className="flex justify-center space-x-2 mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              // maxLength={1}
              value={digit}
              ref={(el) => void (inputRefs.current[index] = el)}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-12 h-12 text-center text-xl font-semibold text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          ))}
        </div>

        <div className="min-h-10 text-center mb-4">
          {status.message && (
            <div
              className={`flex items-center justify-center p-2 rounded-lg text-sm font-medium ${
                status.type === "success"
                  ? "bg-green-100 text-green-700"
                  : status.type === "error"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-500"
              }`}
            >
              {status.type === "success" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 lucide lucide-check-circle"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-8.8"></path>
                  <path d="M22 4L12 14.01l-3-3"></path>
                </svg>
              ) : status.type === "error" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 lucide lucide-alert-triangle"
                >
                  <path d="m21.73 18.23-10.42-17.7a2 2 0 0 0-3.46 0L2.27 18.23a2 2 0 0 0 1.73 2.77h20.54a2 2 0 0 0 1.73-2.77z"></path>
                  <path d="M12 9v4"></path>
                  <path d="M12 17h.01"></path>
                </svg>
              ) : null}
              {status.message}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || otp.join("").length !== OTP_LENGTH}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
            isLoading || otp.join("").length !== OTP_LENGTH
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Verifying...
            </span>
          ) : (
            "Verify OTP"
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        {timer > 0 ? (
          <p className="text-gray-500 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 lucide lucide-clock"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Resend OTP in {timer} seconds
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={isResending}
            className={`font-semibold transition-all duration-200 ${
              isResending
                ? "text-gray-400 cursor-not-allowed"
                : "text-blue-600 hover:text-blue-700"
            }`}
          >
            {isResending ? "Sending..." : "Resend OTP"}
          </button>
        )}
      </div>
    </div>
  );
}
