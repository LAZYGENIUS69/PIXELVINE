"use client";

import { useEffect, useState } from "react";

export const Modals = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <>
            {/* Add Project Modal if needed later */}
        </>
    );
};
