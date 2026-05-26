"use client";

import { use } from "react";

interface WorkspaceIdPageProps {
    params: Promise<{
        workspaceId: string;
    }>;
};

const WorkspaceIdPage = ({
    params,
}: WorkspaceIdPageProps) => {
    const { workspaceId } = use(params);

    return (
        <div>
            Workspace ID: {workspaceId}
        </div>
    );
};

export default WorkspaceIdPage;
