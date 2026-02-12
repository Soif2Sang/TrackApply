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
import { useQuery } from '@tanstack/react-query';

export default function SignUpForm({
	onSwitchToSignIn,
	invitationToken,
}: {
	onSwitchToSignIn: () => void;
	invitationToken?: string;
}) {
	const navigate = useNavigate({
		from: "/",
	});

	const { isPending: isSessionPending } = authClient.useSession(); // Renamed for clarity

	const { data: invitation, isPending: isInvitationPending } = useQuery(
		trpc.invitation.getByToken.queryOptions(
			{ token: invitationToken ?? '' },
			{ enabled: !!invitationToken && invitationToken.trim() !== '' },
		),
	);

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			name: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signUp.email(
				{
					email: value.email,
					password: value.password,
					name: value.name,
					// @ts-ignore
					invitationToken: invitationToken, // Pass the token here
				},
				{
				onSuccess: async () => {
				setTimeout(() => {}, 250);
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
				name: z.string().min(2, "Name must be at least 2 characters"),
				email: z.string().email("Invalid email address"),
				password: z.string().min(8, "Password must be at least 8 characters"),
			}),
		},
	});

	if (isSessionPending || (isInvitationPending && invitationToken)) {
		return <Loader />;
	}

	return (
		<Card className="w-full max-h-fit max-w-md mx-auto mt-10"> {/* Applied Card styling */}
			<CardHeader>
				<CardTitle className="text-center text-3xl font-bold">Create Account</CardTitle> {/* Centered title */}
				{invitationToken && invitation?.organization && (
					<CardDescription className="text-center text-green-500">
						You are invited to join {invitation.organization.name}!
					</CardDescription>
				)}
				<CardDescription className="text-center">Enter your details to create a new account.</CardDescription> {/* Added description */}
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
					<form.Field name="name">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Name</Label>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Enter your name"
								/>
								{field.state.meta.errors.length > 0 && ( // Consistent error display
									<div className="flex items-center space-x-2 text-red-500">
										<AlertCircle size={16} />
										<span className="text-sm">{field.state.meta.errors[0]?.message}</span>
									</div>
								)}
							</div>
						)}
					</form.Field>

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
								{field.state.meta.errors.length > 0 && ( // Consistent error display
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
								{field.state.meta.errors.length > 0 && ( // Consistent error display
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
								{state.isSubmitting ? "Submitting..." : "Sign Up"}
							</Button>
						)}
					</form.Subscribe>
					<Button
						variant="link"
						onClick={onSwitchToSignIn}
						className="text-foreground" // Used consistent text color
					>
						Already have an account? Sign In
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
}
