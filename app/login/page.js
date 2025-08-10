"use client";
import Link from "next/link";
import { loginSchema } from "@/schemas/userSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/customui/LoadingButton";
import { PasswordInput } from "@/components/customui/PasswordInput";
import { login } from "@/components/auth/actions/login";

export default function Login() {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  async function onSubmit(values) {
    setError("");
    startTransition(async () => {
      const result = await login(values);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <div id="wrapper">
        <div id="page">
          <div className="wrap-login-page">
            <div className="flex-grow flex flex-column justify-center gap30">
              <Link href="/" id="site-logo-inner"></Link>
              <div className="login-box">
                <div>
                  <h3>Login</h3>
                  <div className="body-text">
                    Enter your email &amp; password to login
                  </div>
                </div>
                <>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-8"
                    >
                      {error && (
                        <p className="text-center text-destructive">{error}</p>
                      )}
                      <FormField
                        control={form.control}
                        name="identifier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xl mb-6 font-extrabold text-black dark:text-white">
                              Email or Username{" "}
                              <span className="tf-color-1">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="h-20 rounded-2xl border-1 text-xl mt-6 focus:border-black transition duration-250"
                                placeholder="Enter your email or username"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xl mb-6 font-extrabold text-black dark:text-white">
                              Password <span className="tf-color-1">*</span>
                            </FormLabel>
                            <FormControl>
                              <PasswordInput
                                className="h-20 rounded-2xl border-1 text-xl mt-6 focus:border-black transition duration-250"
                                placeholder="Enter your password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <LoadingButton
                        type="submit"
                        className="tf-button style-2 w-full"
                        loading={isPending}
                      >
                        <span className="tf-color-3">Sign In</span>
                      </LoadingButton>
                    </form>
                  </Form>
                </>
                <div className="body-text text-center">
                  You don't have an account yet?
                  <Link href="/sign-up" className="body-text tf-color">
                    Register Now
                  </Link>
                </div>
              </div>
            </div>
            <div className="text-tiny">
              Copyright © 2024 Remos, All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
