
import { Shape } from "@/store/slices/canvasSlice";

export interface Point {
    x: number;
    y: number;
}

export interface Viewport {
    x: number;
    y: number;
    zoom: number;
}

/**
 * Converts Screen Coordinates (Mouse Events) to World Coordinates (Canvas)
 * Formula: X_world = (X_screen - tx) / s
 */
export const toWorld = (screenPoint: Point, viewport: Viewport): Point => {
    return {
        x: (screenPoint.x - viewport.x) / viewport.zoom,
        y: (screenPoint.y - viewport.y) / viewport.zoom,
    };
};

/**
 * Converts World Coordinates to Screen Coordinates
 * Formula: X_screen = (X_world * s) + tx
 */
export const toScreen = (worldPoint: Point, viewport: Viewport): Point => {
    return {
        x: (worldPoint.x * viewport.zoom) + viewport.x,
        y: (worldPoint.y * viewport.zoom) + viewport.y,
    };
};

/**
 * Hit Test: Checks if a point is inside a shape's bounding box
 * Currently supports Rects and other shapes with x, y, width, height
 */
export const isPointInShape = (point: Point, shape: Shape): boolean => {
    // Default to 0 if dimensions are missing (e.g. text might calculate differently later)
    const width = shape.width || 0;
    const height = shape.height || 0;

    // TODO: Handle rotation
    return (
        point.x >= shape.x &&
        point.x <= shape.x + width &&
        point.y >= shape.y &&
        point.y <= shape.y + height
    );
};

/**
 * Get the shape at a specific point (Reverse Z-index order to find top-most)
 */
export const getShapeAtPoint = (point: Point, shapes: Shape[]): Shape | null => {
    // Iterate in reverse to hit the top-most shape first
    for (let i = shapes.length - 1; i >= 0; i--) {
        if (isPointInShape(point, shapes[i])) {
            return shapes[i];
        }
    }
    return null;
};
