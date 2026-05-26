'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useMockAuth } from "@/hooks/use-mock-auth";

const Page = () => {
    // REAL AUTH
    // const { signIn } = useAuthActions();
    // const { isAuthenticated, isLoading } = useConvexAuth();

    // MOCK AUTH
    const { signIn, isAuthenticated, isLoading } = useMockAuth();

    const router = useRouter()

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push('/dashboard')
        }
    }, [isAuthenticated, isLoading, router])

    const handleGoogleSignIn = async () => {
        try {
            await signIn('google', { redirectTo: '/dashboard' });
        } catch (error) {
            console.error("Mock Sign In Failed:", error);
        }
    };

    return (
        <section className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-16">
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900/80 p-6 shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur">
                <div className="space-y-1">
                    <h1 className="text-lg font-semibold text-white">Sign In to S2C</h1>
                    <p className="text-xs text-zinc-400">Welcome back! Sign in to continue</p>
                </div>

                <div className="mt-5 space-y-3">
                    <div className="space-y-1.5">
                        <label htmlFor="username" className="text-xs text-zinc-300">
                            Username
                        </label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="Enter your username"
                            className="h-9 border-white/10 bg-zinc-950/50 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-white/20"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-zinc-300">
                            <label htmlFor="password">Password</label>
                            <button
                                type="button"
                                className="text-[11px] text-zinc-400 transition hover:text-zinc-200"
                            >
                                Forgot your Password ?
                            </button>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            className="h-9 border-white/10 bg-zinc-950/50 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-white/20"
                        />
                    </div>
                </div>

                <Button className="mt-5 w-full bg-zinc-200 text-zinc-900 hover:bg-white">
                    Sign In
                </Button>

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase text-zinc-500">
                        <span className="bg-zinc-900 px-2">Or continue With</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isLoading}
                        className="h-9 gap-2 border-white/10 bg-zinc-950/40 text-zinc-100 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleGoogleSignIn}
                    >
                        {isLoading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 256 262"
                                aria-hidden="true"
                            >
                                <path
                                    fill="#4285f4"
                                    d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                                />
                                <path
                                    fill="#34a853"
                                    d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                                />
                                <path
                                    fill="#fbbc05"
                                    d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                                />
                                <path
                                    fill="#eb4335"
                                    d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                                />
                            </svg>
                        )}
                        {isLoading ? "Signing in..." : "Google"}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-9 gap-2 border-white/10 bg-zinc-950/40 text-zinc-100 hover:bg-zinc-800"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 23 23"
                            aria-hidden="true"
                        >
                            <path fill="#f25022" d="M0 0h10v10H0z" />
                            <path fill="#7fba00" d="M13 0h10v10H13z" />
                            <path fill="#00a4ef" d="M0 13h10v10H0z" />
                            <path fill="#ffb900" d="M13 13h10v10H13z" />
                        </svg>
                        Microsoft
                    </Button>
                </div>

                <div className="mt-4 text-center text-xs text-zinc-500">
                    Don&apos;t have an account ?{" "}
                    <button type="button" className="text-zinc-200 hover:text-white">
                        Create account
                    </button>
                </div>
            </div>
        </section>
    )
}

export default Page;
