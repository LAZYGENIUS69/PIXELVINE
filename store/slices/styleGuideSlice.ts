
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TypographySettings {
    fontFamily: string;
    weights: {
        displayLarge: string;
        heading1: string;
        heading2: string;
        bodyLarge: string;
        bodyRegular: string;
        bodySmall: string;
    };
}

interface ColorPalette {
    // Group 1: Primary Colours
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;

    // Group 2: Secondary & Accent Colors
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;

    // Group 3: UI Component Colors
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    popover: string;
    popoverForeground: string;

    // Group 4: Utility & Form Colors
    border: string;
    input: string;
    ring: string;
    destructive: string;
    destructiveForeground: string;
}

interface StyleGuideState {
    palette: ColorPalette;
    typography: TypographySettings;
    textPrompt: string;
    isGenerating: boolean;
    // Legacy support (optional, can be removed if not used elsewhere)
    colors: string[];
    fonts: string[];
}

const initialState: StyleGuideState = {
    palette: {
        // Defaults
        background: "#09090b",
        foreground: "#fafafa",
        card: "#18181b",
        cardForeground: "#fafafa",

        primary: "#fafafa",
        primaryForeground: "#18181b",
        secondary: "#27272a",
        secondaryForeground: "#fafafa",

        muted: "#27272a",
        mutedForeground: "#a1a1aa",
        accent: "#27272a",
        accentForeground: "#fafafa",
        popover: "#09090b",
        popoverForeground: "#fafafa",

        border: "#27272a",
        input: "#27272a",
        ring: "#d4d4d8",
        destructive: "#ef4444",
        destructiveForeground: "#fafafa",
    },
    typography: {
        fontFamily: 'Inter',
        weights: {
            displayLarge: "800",
            heading1: "700",
            heading2: "600",
            bodyLarge: "500",
            bodyRegular: "400",
            bodySmall: "300"
        }
    },
    textPrompt: '',
    isGenerating: false,
    colors: [],
    fonts: [],
};

const styleGuideSlice = createSlice({
    name: 'styleGuide',
    initialState,
    reducers: {
        updatePalette: (state, action: PayloadAction<Partial<ColorPalette>>) => {
            state.palette = { ...state.palette, ...action.payload };
        },
        updateTypography: (state, action: PayloadAction<Partial<TypographySettings>>) => {
            state.typography = { ...state.typography, ...action.payload };
        },
        setFontFamily: (state, action: PayloadAction<string>) => {
            state.typography.fontFamily = action.payload;
        },
        setStyleGuide: (state, action: PayloadAction<{
            palette: ColorPalette;
            typography: TypographySettings;
        }>) => {
            state.palette = action.payload.palette;
            state.typography = action.payload.typography;
        },
        // Legacy Reducers (Restored for backward compatibility)
        setColors: (state, action: PayloadAction<string[]>) => {
            state.colors = action.payload;
        },
        setFonts: (state, action: PayloadAction<string[]>) => {
            state.fonts = action.payload;
        },
        addColor: (state, action: PayloadAction<string>) => {
            if (!state.colors.includes(action.payload)) {
                state.colors.push(action.payload);
            }
        },
        addFont: (state, action: PayloadAction<string>) => {
            if (!state.fonts.includes(action.payload)) {
                state.fonts.push(action.payload);
            }
        },
        removeColors: (state, action: PayloadAction<string[]>) => {
            state.colors = state.colors.filter(c => !action.payload.includes(c));
        },
        setTextPrompt: (state, action: PayloadAction<string>) => {
            state.textPrompt = action.payload;
        },
        setIsGenerating: (state, action: PayloadAction<boolean>) => {
            state.isGenerating = action.payload;
        },
    },
});

export const {
    updatePalette,
    updateTypography,
    setFontFamily,
    setStyleGuide,
    setTextPrompt,
    setIsGenerating,
    // Exports for legacy
    setColors,
    setFonts,
    addColor,
    addFont,
    removeColors
} = styleGuideSlice.actions;
export default styleGuideSlice.reducer;
