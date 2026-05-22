import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
    isGenerating: boolean;
}

const initialState: UiState = {
    isGenerating: false,
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setIsGenerating: (state, action: PayloadAction<boolean>) => {
            state.isGenerating = action.payload;
        },
    },
});

export const { setIsGenerating } = uiSlice.actions;
export default uiSlice.reducer;
