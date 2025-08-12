import { resend } from "@/lib/resend";
import VerificationEmail from "@/emails/VerificationEmail2";
import { ApiResponse } from "../../types/ApiResponse";

export async function sendVerificationEmail(
  email: string,
  username: string,
  verifyCode: string
): Promise<ApiResponse> {
  try {
    const { data, error } = await resend.emails.send({
      from: "support@sanchitdev.com",
      to: email,
      replyTo: "sanchitbhalla91@gmail.com", // Replies will go here
      subject: "Verification Code for Seth Traders",
      react: VerificationEmail({ username, otp: verifyCode }),
    });

    if (error) return { success: false, message: error.message };
    // console.log({ data });
    return { success: true, message: "Verification email sent successfully." };
  } catch (emailError) {
    console.error("Error sending verification email:", emailError);
    return { success: false, message: "Failed to send verification email." };
  }
}
