import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ResetPasswordFormProps {
  token?: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const navigate = useNavigate({
    from: "/reset-password",
  });
  const [success, setSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  useEffect(() => {
    if (!token) {
      setInvalidToken(true);
    }
  }, [token]);

  const form = useForm({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      if (!token) {
        toast.error("Invalid or missing reset token");
        return;
      }

      try {
        const { data, error: resetError } = await authClient.resetPassword({
          newPassword: value.newPassword,
          token,
        });

        if (resetError) {
          toast.error(resetError.message || "Failed to reset password");
        } else {
          setSuccess(true);
          toast.success("Password reset successfully!");
          setTimeout(() => {
            navigate({
              to: "/sign-in",
            });
          }, 2000);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        toast.error(errorMessage);
      }
    },
    validators: {
      onSubmit: z
        .object({
          newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters"),
          confirmPassword: z.string(),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: "Passwords do not match",
          path: ["confirmPassword"],
        }),
    },
  });

  if (invalidToken) {
    return (
      <Card className="w-full max-h-fit max-w-md mx-auto mt-10">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold">
            Invalid Token
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  The password reset token is invalid or missing. Please request
                  a new one.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-h-fit max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle className="text-center text-3xl font-bold">
          Reset your password
        </CardTitle>
        <CardDescription className="text-center">
          Enter your new password below
        </CardDescription>
      </CardHeader>

      {success ? (
        <CardContent>
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Password reset successfully! Redirecting to sign in...
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <CardContent className="space-y-4">
            <form.Field name="newPassword">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>New Password</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    autoComplete="new-password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter your new password"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <div className="flex items-center space-x-2 text-red-500">
                      <AlertCircle size={16} />
                      <span className="text-sm">
                        {field.state.meta.errors[0]?.message}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="confirmPassword">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Confirm Password</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    autoComplete="new-password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Confirm your new password"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <div className="flex items-center space-x-2 text-red-500">
                      <AlertCircle size={16} />
                      <span className="text-sm">
                        {field.state.meta.errors[0]?.message}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </form.Field>
          </CardContent>

          <CardContent className="pt-0">
            <form.Subscribe>
              {(state) => (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!state.canSubmit || state.isSubmitting}
                >
                  {state.isSubmitting ? "Resetting..." : "Reset Password"}
                </Button>
              )}
            </form.Subscribe>
          </CardContent>
        </form>
      )}
    </Card>
  );
}
