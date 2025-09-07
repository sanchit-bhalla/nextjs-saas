import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import OtpForm from "@/components/otp-form";
import { USERID_COOKIE } from "@/constants";

export default async function VerifyOtpPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(USERID_COOKIE)?.value;
  if (!userId) return redirect("/signup");

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <OtpForm userId={userId} />
    </div>
  );
}
