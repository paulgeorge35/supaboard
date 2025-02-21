import { cn } from "@/lib/utils"
import { useBoolean } from "@paulgeorge35/hooks"
import type { User, Workspace } from "@repo/database"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { toast } from "sonner"
import { z } from "zod"
import { fetchClient } from "../lib/client"
import { Avatar } from "./avatar"
import { Button } from "./button"
import { Icons } from "./icons"
import { Input } from "./input"
import { ModalComponent } from "./modal-component"
import { Popover } from "./popover"

type AuthButtonsProps = {
    user?: Pick<User, 'id' | 'email' | 'name' | 'avatar'>
    isAdmin: boolean
    workspaces?: Workspace[]
    currentWorkspace?: string
}

export function AuthButtons({ user, isAdmin, workspaces, currentWorkspace }: AuthButtonsProps) {
    const loginModal = useBoolean(false);
    const signUpModal = useBoolean(false);
    const forgotPasswordModal = useBoolean(false);
    const apiURL = window.location.hostname.endsWith('supaboard.io') ? 'https://api.supaboard.io' : `https://${window.location.hostname}/api`
    const queryClient = useQueryClient();

    const { mutate: signOut } = useMutation<{ message: string }, Error, void>({
        mutationFn: () => fetchClient("auth/logout", { method: 'POST' }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['me'] });
            toast.success(data?.message ?? 'Signed out successfully');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to sign out');
        }
    });

    const schema = z.object({
        email: z.string({
            required_error: 'Email is required'
        }).email({
            message: 'Invalid email address'
        }),
        password: z.string({
            required_error: 'Password is required'
        })
    });

    const form = useForm<z.infer<typeof schema>>({
        validators: {
            onSubmit: schema,
        },
        onSubmit: (data) => {
            login(data.value);
        }
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit()
    }

    const { mutate: login, isPending } = useMutation<{ message: string }, Error, z.infer<typeof schema>>({
        mutationFn: (data) => fetchClient("auth/login", { method: 'POST', body: JSON.stringify(data) }),
        onSuccess: (data) => {
            toast.success(data?.message ?? 'Signed in successfully');
            window.location.reload();
            loginModal.setFalse();
            form.reset();
        }
    });

    const schemaSignUp = z.object({
        email: z.string({
            required_error: 'Email is required'
        }).email({
            message: 'Invalid email address'
        }),
        password: z.string({
            required_error: 'Password is required'
        }).min(1, {
            message: 'Password is required'
        }).regex(/[A-Z]/, {
            message: ''
        }).regex(/[0-9]/, {
            message: ''
        }).regex(/[^A-Za-z0-9]/, {
            message: ''
        }),
        name: z.string({
            required_error: 'Name is required'
        })
    });

    const formSignUp = useForm<z.infer<typeof schemaSignUp>>({
        validators: {
            onSubmit: schemaSignUp,
        },
        onSubmit: (data) => {
            signUp(data.value);
        }
    });

    const handleSubmitSignUp = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        formSignUp.handleSubmit()
    }

    const { mutate: signUp, isPending: isPendingSignUp } = useMutation<{ message: string }, Error, z.infer<typeof schemaSignUp>>({
        mutationFn: (data) => fetchClient("auth/register", { method: 'POST', body: JSON.stringify(data) }),
        onSuccess: (data) => {
            toast.success(data?.message ?? 'Signed up successfully');
            window.location.reload();
            signUpModal.setFalse();
            formSignUp.reset();
        }
    });

    const schemaForgotPassword = z.object({
        email: z.string({
            required_error: 'Email is required'
        }).email({
            message: 'Invalid email address'
        })
    });

    const formForgotPassword = useForm<z.infer<typeof schemaForgotPassword>>({
        validators: {
            onSubmit: schemaForgotPassword,
        },
        onSubmit: (data) => {
            forgotPassword(data.value);
        }
    });

    const handleSubmitForgotPassword = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        formForgotPassword.handleSubmit()
    }

    const { mutate: forgotPassword, isPending: isPendingForgotPassword } = useMutation<{ message: string }, Error, z.infer<typeof schemaForgotPassword>>({
        mutationFn: (data) => fetchClient("auth/password/request-reset", { method: 'POST', body: JSON.stringify(data) }),
        onSuccess: (data) => {
            toast.success(data?.message ?? 'Reset link sent to email');
            forgotPasswordModal.setFalse();
            formForgotPassword.reset();
        }
    });

    if (!user) {
        return (
            <span className="horizontal gap-2 center-v">
                <ModalComponent isOpen={forgotPasswordModal.value} onClose={() => {
                    forgotPasswordModal.setFalse();
                    formForgotPassword.reset();
                }}>
                    <div className="vertical gap-4">
                        <span className="vertical center gap-1">
                            <h1 className="text-lg font-bold">Forgot Password</h1>
                            <p className="text-sm text-gray-500 dark:text-zinc-400">Enter your email to reset your password</p>
                        </span>
                        <form onSubmit={handleSubmitForgotPassword} className="vertical gap-4">
                            <formForgotPassword.Field name="email" children={(field) => {
                                return (
                                    <>
                                        <Input
                                            label="Email"
                                            placeholder="john@doe.com"
                                            name={field.name}
                                            value={field.state.value ?? ""}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            field={field}
                                        />
                                    </>
                                )
                            }} />
                            <formForgotPassword.Subscribe
                                selector={(state) => [state.canSubmit, state.isSubmitting, state.isDirty]}
                                children={([canSubmit, isSubmitting, isDirty]) => (
                                    <Button type='submit' color='secondary' variant='outline' isLoading={isSubmitting || isPendingForgotPassword} disabled={!canSubmit || !isDirty}>
                                        Send Reset Link
                                    </Button>
                                )}
                            />
                        </form>
                    </div>
                </ModalComponent>
                <ModalComponent isOpen={loginModal.value} onClose={() => {
                    loginModal.setFalse();
                    form.reset();
                }}>
                    <div className="vertical gap-4">
                        <span className="vertical center gap-1">
                            <h1 className="text-lg font-bold">Log In</h1>
                            <p className="text-sm text-gray-500 dark:text-zinc-400">Continue with one of the following options</p>
                        </span>
                        <div className="vertical gap-2">
                            <a href={`${apiURL}/auth/google/sign-in`} type="button" className="button button-primary">
                                <Icons.Google className="size-4 shrink-0" />
                                Continue with Google
                            </a>
                        </div>
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 w-full items-center">
                            <div className="h-px w-full bg-gray-200 dark:bg-zinc-800" />
                            <p className="text-sm text-gray-500 dark:text-zinc-400">Or continue with email</p>
                            <div className="h-px w-full bg-gray-200 dark:bg-zinc-800" />
                        </div>
                        <form onSubmit={handleSubmit} className="vertical gap-4">
                            <form.Field name="email" children={(field) => {
                                return (
                                    <>
                                        <Input
                                            label="Email"
                                            placeholder="john@doe.com"
                                            name={field.name}
                                            value={field.state.value ?? ""}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            field={field}
                                        />
                                    </>
                                )
                            }} />
                            <form.Field name="password" children={(field) => {
                                return (
                                    <>
                                        <Input
                                            label="Password"
                                            placeholder="********"
                                            name={field.name}
                                            type="password"
                                            value={field.state.value ?? ""}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            field={field}
                                        />
                                    </>
                                )
                            }} />
                            <form.Subscribe
                                selector={(state) => [state.canSubmit, state.isSubmitting, state.isDirty]}
                                children={([canSubmit, isSubmitting, isDirty]) => (
                                    <Button type='submit' color='secondary' variant='outline' isLoading={isSubmitting || isPending} disabled={!canSubmit || !isDirty}>
                                        Log In
                                    </Button>
                                )}
                            />
                            <Button type='button' variant='link' size='sm' color='secondary' onClick={() => {
                                loginModal.setFalse();
                                form.reset();
                                forgotPasswordModal.setTrue();
                            }}>
                                Forgot your password?
                            </Button>
                        </form>
                    </div>
                </ModalComponent>
                <button type="button" className="button button-secondary" onClick={loginModal.setTrue}>
                    Log In
                </button>
                <ModalComponent isOpen={signUpModal.value} onClose={() => {
                    signUpModal.setFalse();
                    formSignUp.reset();
                }}>
                    <div className="vertical gap-4">
                        <span className="vertical center gap-1">
                            <h1 className="text-lg font-bold">Sign Up</h1>
                            <p className="text-sm text-gray-500 dark:text-zinc-400">Continue with one of the following options</p>
                        </span>
                        <div className="vertical gap-2">
                            <a href={`${apiURL}/auth/google/sign-up`} type="button" className="button button-primary">
                                <Icons.Google className="size-4 shrink-0" />
                                Continue with Google
                            </a>
                        </div>
                        <form onSubmit={handleSubmitSignUp} className="vertical gap-4">
                            <formSignUp.Field name="name" children={(field) => {
                                return (
                                    <>
                                        <Input
                                            label="Name"
                                            placeholder="John Doe"
                                            name={field.name}
                                            value={field.state.value ?? ""}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            field={field}
                                        />
                                    </>
                                )
                            }} />
                            <formSignUp.Field name="email" children={(field) => {
                                return (
                                    <>
                                        <Input
                                            label="Email"
                                            placeholder="john@doe.com"
                                            name={field.name}
                                            value={field.state.value ?? ""}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            field={field}
                                        />
                                    </>
                                )
                            }} />
                            <formSignUp.Field name="password" children={(field) => {
                                return (
                                    <>
                                        <Input
                                            label="Password"
                                            placeholder="********"
                                            name={field.name}
                                            type="password"
                                            value={field.state.value ?? ""}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            field={field}
                                            showStrength={true}
                                        />
                                    </>
                                )
                            }} />
                            <formSignUp.Subscribe
                                selector={(state) => [state.canSubmit, state.isSubmitting, state.isDirty]}
                                children={([canSubmit, isSubmitting, isDirty]) => (
                                    <Button type='submit' color='secondary' variant='outline' isLoading={isSubmitting || isPendingSignUp} disabled={!canSubmit || !isDirty}>
                                        Sign Up
                                    </Button>
                                )}
                            />
                            <span className="text-xs font-light text-gray-400 dark:text-zinc-600 text-center">
                                By signing up, you agree to the 
                                {" "}<a href={`${import.meta.env.VITE_APP_URL}/tos`} className="underline hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">terms of service</a>
                                {" "}and{" "}
                                <a href={`${import.meta.env.VITE_APP_URL}/privacy`} className="underline hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">privacy policy</a>.
                            </span>
                        </form>
                    </div>
                </ModalComponent>
                <button type="button" className="button button-primary" onClick={signUpModal.setTrue}>
                    Sign Up
                </button>
            </span>
        )
    }

    const popoverContent = (
        <div className="py-1 w-48" role="none">
            <div className="px-4 py-2 text-sm text-gray-700 border-b">
                <div className="font-medium">{user.name}</div>
                <div className="text-gray-500 text-xs truncate">{user.email}</div>
            </div>
            <h1 className="text-xs font-bold px-4 py-1 text-gray-700 dark:text-zinc-300 bg-gray-200 dark:bg-zinc-800">Workspaces</h1>
            {workspaces?.map(workspace => {
                return (
                    <button
                        key={workspace.id}
                        type="button"
                        className="text-left w-full px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/20 horizontal center-v gap-2 disabled:opacity-50 disabled:pointer-events-none"
                        role="menuitem"
                        onClick={() => window.location.href = workspace.url}
                        disabled={workspace.id === currentWorkspace}
                        data-popover-close
                    >
                        <Icons.Check className={cn("size-4 shrink-0 opacity-0", {
                            "opacity-100": workspace.id === currentWorkspace
                        })} />
                        <p className="truncate">{workspace.name}</p>
                    </button>
                )
            })}
            <button
                type="button"
                className="text-left w-full px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/20 horizontal center-v gap-2 disabled:opacity-50 disabled:pointer-events-none"
                role="menuitem"
                onClick={() => {
                    window.location.href = `${import.meta.env.VITE_APP_URL}/register`;
                }}
                data-popover-close
            >
                <Icons.Plus className="size-4 shrink-0" />
                <p className="truncate">Add Workspace</p>
            </button>
            <hr />
            {isAdmin && (
                <Link
                    to="/admin/settings"
                    type="button"
                    className="text-left block w-full px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/20"
                    role="menuitem"
                    preload={false}
                >
                    Settings
                </Link>
            )}
            <button
                type="button"
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-zinc-800/20"
                role="menuitem"
                onClick={() => signOut()}
            >
                Sign out
            </button>
        </div>
    )

    return (
        <Popover
            id="auth-buttons"
            className="horizontal center"
            trigger={
                <span className="horizontal gap-2 center size-8 rounded-full">
                    <Avatar src={user.avatar ?? undefined} name={user.name} className='size-8' />
                </span>
            }
            content={popoverContent}
        />
    )
}