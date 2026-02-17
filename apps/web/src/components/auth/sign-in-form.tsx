import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";
import Loader from "../loader";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { queryClient, trpc } from "@/utils/trpc";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from 'lucide-react';
import { Link } from "@tanstack/react-router";

export default function SignInForm({
	onSwitchToSignUp,
}: {
	onSwitchToSignUp: () => void;
}) {
	const navigate = useNavigate({
		from: "/",
	});
	const { isPending: isSessionPending } = authClient.useSession();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
				},
				{
					onSuccess: async () => {
						await queryClient.invalidateQueries(
							{ queryKey: trpc.organization.getOrganizations.queryKey() },
						);
						const organizations = await queryClient.fetchQuery(
							trpc.organization.getOrganizations.queryOptions(),
						);

						if (organizations && organizations.length > 0) {
							navigate({
								to: "/organization/$orgId",
								params: { orgId: organizations[0].id },
							});
						} else {
							// Handle case where no organizations are found, e.g., redirect to a create organization page
							navigate({ to: "/" }); // Fallback to home for now
						}
						toast.success("Sign in successful");
					},
					onError: (error) => {
						toast.error(error.error.message);
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				email: z.string().email("Invalid email address"),
				password: z.string().min(8, "Password must be at least 8 characters"),
			}),
		},
	});

	if (isSessionPending) {
		return <Loader />;
	}

	return (
		<Card className="w-full max-h-fit max-w-md mx-auto mt-10">
			<CardHeader>
				<CardTitle className="text-center text-3xl font-bold">Welcome Back</CardTitle>
				<CardDescription className="text-center">Enter your email and password to access your account.</CardDescription>
			</CardHeader>
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
										<span className="text-sm">{field.state.meta.errors[0]?.message}</span>
									</div>
								)}
							</div>
						)}
					</form.Field>

					<form.Field name="password">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Password</Label>
								<Input
									id={field.name}
									name={field.name}
									type="password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Enter your password"
								/>
								{field.state.meta.errors.length > 0 && (
									<div className="flex items-center space-x-2 text-red-500">
										<AlertCircle size={16} />
										<span className="text-sm">{field.state.meta.errors[0]?.message}</span>
									</div>
								)}
							</div>
						)}
					</form.Field>
				</CardContent>
				<CardFooter className="flex flex-col gap-4">
					<form.Subscribe>
						{(state) => (
							<Button
								type="submit"
								className="w-full"
								disabled={!state.canSubmit || state.isSubmitting}
							>
								{state.isSubmitting ? "Submitting..." : "Sign In"}
							</Button>
						)}
					</form.Subscribe>
					<div className="flex flex-col justify-between text-sm items-center">
						<Link
							to="/forgot-password"
							className="text-blue-600 hover:text-blue-800 hover:underline"
						>
							Forgot Password?
						</Link>
						<Button
							variant="link"
							onClick={onSwitchToSignUp}
							className="text-foreground p-0 h-auto"
						>
							Need an account? Sign Up
						</Button>
					</div>
				</CardFooter>
			</form>
		</Card>
	);
}