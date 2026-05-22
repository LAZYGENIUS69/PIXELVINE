
import { configureStore } from '@reduxjs/toolkit';
import canvasReducer from './slices/canvasSlice';
import styleGuideReducer from './slices/styleGuideSlice';
import generationReducer from './slices/generationSlice';
import { syncMiddleware } from './middleware/syncMiddleware';

export const store = configureStore({
    reducer: {
        canvas: canvasReducer,
        styleGuide: styleGuideReducer,
        generation: generationReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(syncMiddleware),
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
