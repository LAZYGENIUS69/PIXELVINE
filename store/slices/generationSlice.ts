import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type JobStatus = "idle" | "analyzing" | "designing" | "done" | "error";
type DesignType = "mobile" | "website";

interface GenerationState {
    jobStatus: JobStatus;
    activeJobId: string | null;
    errorMessage: string | null;
    designType: DesignType;
}

const initialState: GenerationState = {
    jobStatus: "idle",
    activeJobId: null,
    errorMessage: null,
    designType: "mobile",
};

const generationSlice = createSlice({
    name: "generation",
    initialState,
    reducers: {
        startGeneration(state, action: PayloadAction<string>) {
            state.jobStatus = "analyzing";
            state.activeJobId = action.payload;
            state.errorMessage = null;
        },
        setJobStatus(state, action: PayloadAction<JobStatus>) {
            state.jobStatus = action.payload;
        },
        setError(state, action: PayloadAction<string>) {
            state.jobStatus = "error";
            state.errorMessage = action.payload;
        },
        resetGeneration(state) {
            state.jobStatus = "idle";
            state.activeJobId = null;
            state.errorMessage = null;
        },
        setDesignType(state, action: PayloadAction<DesignType>) {
            state.designType = action.payload;
        },
    },
});

export const { startGeneration, setJobStatus, setError, resetGeneration, setDesignType } =
    generationSlice.actions;

export default generationSlice.reducer;
