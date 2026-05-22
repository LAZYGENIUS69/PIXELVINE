import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';

export interface Shape {
    id: string;
    type: 'rect' | 'path' | 'text' | 'circle' | 'image' | 'arrow' | 'frame' | 'line';
    parentId?: string;
    x: number;
    y: number;
    endX?: number; // For arrows
    endY?: number; // For arrows
    width?: number;
    height?: number;
    rotation?: number;
    content?: string;
    path?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number | string;
    lineHeight?: number;
    letterSpacing?: number;
    radius?: number; // For circles
    opacity?: number;
    locked?: boolean;
    visible?: boolean;
    arrowHeadSize?: number;
    label?: string; // For Frame names
    children?: string[]; // IDs of shapes inside this frame
}

export const shapesAdapter = createEntityAdapter<Shape>();

// Externalized Reducers to avoid circular dependency
const duplicateShapeReducer = (state: any, action: PayloadAction<string>) => {
    const id = action.payload;
    const shape = state.entities[id];
    if (shape) {
        const newId = crypto.randomUUID();
        const newShape = {
            ...shape,
            id: newId,
            x: shape.x + 20,
            y: shape.y + 20
        };
        if ((shape.type === 'arrow' || shape.type === 'line') && shape.endX !== undefined && shape.endY !== undefined) {
            newShape.endX = shape.endX + 20;
            newShape.endY = shape.endY + 20;
        }
        state.entities[newId] = newShape;
        state.ids.push(newId);
        state.selectedShapeId = newId;
    }
};

const bringToFrontReducer = (state: any, action: PayloadAction<string>) => {
    const id = action.payload;
    const index = state.ids.indexOf(id);
    if (index !== -1) {
        state.ids.splice(index, 1);
        state.ids.push(id);
    }
};

const sendToBackReducer = (state: any, action: PayloadAction<string>) => {
    const id = action.payload;
    const index = state.ids.indexOf(id);
    if (index !== -1) {
        state.ids.splice(index, 1);
        state.ids.unshift(id);
    }
};

const initialState = shapesAdapter.getInitialState({
    selectedShapeId: null as string | null,
    hoveredShapeId: null as string | null,
    editingShapeId: null as string | null,
    projectId: null as string | null,
    viewport: { x: 0, y: 0, zoom: 1 },
    isInteracting: false,
    isDragging: false,
    past: [] as Shape[][],
    future: [] as Shape[][]
});

const canvasSlice = createSlice({
    name: 'canvas',
    initialState,
    reducers: {
        setProjectId: (state, action: PayloadAction<string>) => {
            state.projectId = action.payload;
        },
        addShape: (state, action: PayloadAction<Shape>) => {
            state.past.push(Object.values(state.entities) as Shape[]);
            state.future = [];
            shapesAdapter.addOne(state, action.payload);
        },
        updateShape: (state, action: PayloadAction<any>) => {
            if (!state.isInteracting && !state.isDragging) {
                state.past.push(Object.values(state.entities) as Shape[]);
                state.future = [];
            }
            shapesAdapter.updateOne(state, action.payload);
        },
        moveShape: (state, action: PayloadAction<{ id: string; deltaX: number; deltaY: number }>) => {
            const { id, deltaX, deltaY } = action.payload;
            const shape = state.entities[id];
            if (shape) {
                shape.x += deltaX;
                shape.y += deltaY;

                // ARROW LOGIC
                if (shape.type === 'arrow' || shape.type === 'line') {
                    shape.endX = (shape.endX || shape.x) + deltaX;
                    shape.endY = (shape.endY || shape.y) + deltaY;
                }

                if (shape.type === 'frame') {
                    Object.values(state.entities).forEach((child: any) => {
                        if (child && child.parentId === id) {
                            child.x += deltaX;
                            child.y += deltaY;
                            // RECURSIVE ARROW LOGIC
                            if (child.type === 'arrow' || child.type === 'line') {
                                child.endX = (child.endX || child.x) + deltaX;
                                child.endY = (child.endY || child.y) + deltaY;
                            }
                        }
                    });
                }
            }
        },
        removeShape: (state, action: PayloadAction<string>) => {
            state.past.push(Object.values(state.entities) as Shape[]);
            state.future = [];
            shapesAdapter.removeOne(state, action.payload);
        },
        setShapes: (state, action: PayloadAction<Shape[]>) => {
            shapesAdapter.setAll(state, action.payload);
        },
        undo: (state) => {
            if (state.past.length > 0) {
                const previous = state.past.pop();
                const current = Object.values(state.entities) as Shape[];
                state.future.push(current);
                if (previous) {
                    shapesAdapter.setAll(state, previous);
                }
            }
        },
        redo: (state) => {
            if (state.future.length > 0) {
                const next = state.future.pop();
                const current = Object.values(state.entities) as Shape[];
                state.past.push(current);
                if (next) {
                    shapesAdapter.setAll(state, next);
                }
            }
        },
        selectShape: (state, action: PayloadAction<string | null>) => {
            state.selectedShapeId = action.payload;
            if (action.payload) {
                // Auto-bring to front
                bringToFrontReducer(state, { payload: action.payload, type: 'bringToFront' });
            }
        },

        setEditingShape: (state, action: PayloadAction<string | null>) => {
            state.editingShapeId = action.payload;
        },
        setHoveredShape: (state, action: PayloadAction<string | null>) => {
            state.hoveredShapeId = action.payload;
        },
        setInteracting: (state, action: PayloadAction<boolean>) => {
            state.isInteracting = action.payload;
        },
        setDragging: (state, action: PayloadAction<boolean>) => {
            state.isDragging = action.payload;
        },
        setViewport: (state, action: PayloadAction<{ x: number; y: number; zoom: number }>) => {
            state.viewport = action.payload;
        },

        duplicateShape: duplicateShapeReducer,
        duplicateObject: duplicateShapeReducer,

        bringToFront: bringToFrontReducer,
        moveToFront: bringToFrontReducer,

        sendToBack: sendToBackReducer,
        moveToBack: sendToBackReducer,
        resetCanvas: (state) => {
            shapesAdapter.removeAll(state);
            state.selectedShapeId = null;
            state.hoveredShapeId = null;
            state.projectId = null;
            state.viewport = { x: 0, y: 0, zoom: 1 };
        },
        forceSync: (state) => {
            // No-op: just triggers middleware
        },
    },
});

export const {
    setProjectId,
    addShape,
    updateShape,
    moveShape,
    removeShape,

    setShapes,
    selectShape,
    setEditingShape,
    setHoveredShape,
    setInteracting,
    setDragging,
    setViewport,


    duplicateShape,
    bringToFront,
    sendToBack,
    resetCanvas,
    undo,
    redo,
    forceSync
} = canvasSlice.actions;


export default canvasSlice.reducer;

