"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function UserAvatar() {
  const router = useRouter();

  const handleSignout = async () => {
    await signOut({ redirect: false });
    toast.success("Logged out successfully");
    router.replace("/"); // Redirect to home page after successful logout
  };

  return <button onClick={handleSignout}>Logout</button>;
}
