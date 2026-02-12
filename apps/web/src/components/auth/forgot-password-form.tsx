import { authClient } from "@/lib/auth-client";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useState } from "react";

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

export default function ForgotPasswordForm({
  onSuccess,
}: ForgotPasswordFormProps) {
  const [success, setSuccess] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const response = await authClient.requestPasswordReset({
          email: value.email,
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (response.error) {
          toast.error(response.error.message || "Failed to request password reset");
        } else {
          setSuccess(true);
          toast.success("Password reset link sent! Check your email for instructions.");
          onSuccess?.();
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        toast.error(errorMessage);
      }
    },
    validators: {
      onSubmit: z.object({
        email: z.string().email("Please enter a valid email address"),
      }),
    },
  });

  return (
    <Card className="w-full max-h-fit max-w-md mx-auto my-auto mt-10">
      <CardHeader>
        <CardTitle className="text-center text-3xl font-bold">
          Reset your password
        </CardTitle>
        <CardDescription className="text-center">
          Enter your email address and we'll send you a link to reset your
          password
        </CardDescription>
      </CardHeader>

      {success ? (
        <CardContent>
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Password reset link sent! Check your email for instructions.
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
            <form.Field name="email">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Email</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter your email"
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

          <CardFooter>
            <form.Subscribe>
              {(state) => (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!state.canSubmit || state.isSubmitting}
                >
                  {state.isSubmitting ? "Sending..." : "Send Reset Link"}
                </Button>
              )}
            </form.Subscribe>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
