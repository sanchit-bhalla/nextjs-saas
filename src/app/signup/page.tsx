"use client";

import { registerUser } from "@/actions/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ChangeEvent, useActionState, useState } from "react";

type FormState = {
  error?: string;
  // success?: string;
};
const initialState: FormState = { error: undefined };

export default function Signup() {
  const [state, formAction, isPending] = useActionState(
    registerUser,
    initialState
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleChage = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "name") {
      setName(value);
    } else if (name === "email") {
      setEmail(value);
    } else if (name === "password") {
      setPassword(value);
    }
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Create a new account</CardTitle>
            <CardDescription>
              Enter your details below to create a new account
            </CardDescription>
          </CardHeader>
          <form action={formAction}>
            <CardContent>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    name="name"
                    value={name}
                    onChange={handleChage}
                    placeholder="enter your name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={handleChage}
                    placeholder="abc@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    value={password}
                    onChange={handleChage}
                    placeholder="enter your password"
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardContent className="my-4">
              {state.error && <p className="text-red-500">{state.error}</p>}
              {/* {state.success && (
                <p className="text-green-500">{state.success}</p>
              )} */}
            </CardContent>
            <CardFooter className="flex-col gap-2 my-4">
              <Button
                type="submit"
                className={`w-full ${
                  isPending ? "opacity-50" : "cursor-pointer"
                }`}
                disabled={isPending}
              >
                {isPending ? "Registering..." : "Register"}
              </Button>
            </CardFooter>
            <CardContent>
              <CardAction className="text-center justify-self-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary underline">
                    Login
                  </Link>
                </p>
              </CardAction>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}
