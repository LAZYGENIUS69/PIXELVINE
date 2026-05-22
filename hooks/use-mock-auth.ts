import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Mock User Data
export const MOCK_USER = {
    _id: "mock_user_id",
    name: "Demo User",
    email: "demo@vision-sync.ai",
    image: "https://avatar.vercel.sh/demo-user.png",
    tokenIdentifier: "mock_token_123",
};

export function useMockAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check local storage on mount
        const storedAuth = localStorage.getItem('is_mock_authenticated');
        if (storedAuth === 'true') {
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);

    const signIn = async (provider: string, options?: any) => {
        setIsLoading(true);
        // Simulate network delay to make it feel real (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));

        localStorage.setItem('is_mock_authenticated', 'true');
        setIsAuthenticated(true);
        setIsLoading(false);

        if (options?.redirectTo) {
            router.push(options.redirectTo);
        }
    };

    const signOut = async () => {
        setIsLoading(true);
        // Simulate network delay (1 second)
        await new Promise(resolve => setTimeout(resolve, 1000));

        localStorage.removeItem('is_mock_authenticated');
        setIsAuthenticated(false);
        setIsLoading(false);
        router.push('/');
    };

    return {
        isAuthenticated,
        isLoading,
        signIn,
        signOut,
        user: isAuthenticated ? MOCK_USER : null
    };
}
