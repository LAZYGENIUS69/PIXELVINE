"use client";

import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { updateShape, forceSync } from "@/store/slices/canvasSlice";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Type, Hash, AlignJustify, Image as ImageIcon, Lock, Unlock, Eye, EyeOff } from "lucide-react";

export const PropertiesPanel = () => {
    const dispatch = useDispatch();
    const { selectedShapeId, entities, viewport } = useSelector((state: RootState) => state.canvas);
    const shape = selectedShapeId ? entities[selectedShapeId] : null;

    if (!shape) {
        return (
            <div className="p-4 text-white/50 text-sm text-center">
                Select an element to edit properties
            </div>
        );
    }

    const handleChange = (changes: Record<string, any>) => {
        dispatch(updateShape({
            id: shape.id,
            changes
        }));
    };

    const handleBlur = () => {
        dispatch(forceSync());
    };

    return (
        <ScrollArea className="h-full">
            <div className="p-4 space-y-6">

                {/* Header with Layer Actions */}
                <div className="flex items-center justify-between text-white/80 border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                        {shape.type === 'text' ? <Type size={16} /> :
                            shape.type === 'image' ? <ImageIcon size={16} /> :
                                <Hash size={16} />}
                        <span className="text-sm font-medium capitalize">{shape.type} Properties</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-white/10 text-white/70 hover:text-white"
                            onClick={() => handleChange({ locked: !shape.locked })}
                        >
                            {shape.locked ? <Lock size={14} className="text-red-400" /> : <Unlock size={14} />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-white/10 text-white/70 hover:text-white"
                            onClick={() => handleChange({ visible: !(shape.visible ?? true) })}
                        >
                            {shape.visible === false ? <EyeOff size={14} className="text-white/40" /> : <Eye size={14} />}
                        </Button>
                    </div>
                </div>

                {/* Typography Section (Only for Text) */}
                {shape.type === 'text' && (
                    <div className="space-y-4">
                        <Label className="text-xs text-white/50 uppercase tracking-wider">Typography</Label>

                        {/* Font Family */}
                        <div className="space-y-2">
                            <Label className="text-xs text-white/70">Font Family</Label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between bg-white/5 border-white/10 text-white hover:bg-white/10">
                                        {shape.fontFamily || 'Inter'}
                                        <ChevronDown size={14} className="opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-full min-w-[200px] bg-neutral-900 border-white/10 text-white">
                                    {['Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Courier'].map((font) => (
                                        <DropdownMenuItem
                                            key={font}
                                            onClick={() => handleChange({ fontFamily: font })}
                                            className="hover:bg-white/10 cursor-pointer"
                                        >
                                            <span style={{ fontFamily: font }}>{font}</span>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Font Size */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label className="text-xs text-white/70">Size</Label>
                                <span className="text-xs text-white/50">{Math.round(shape.fontSize || 16)}px</span>
                            </div>
                            <Slider
                                value={[shape.fontSize || 16]}
                                min={12}
                                max={128}
                                step={1}
                                onValueChange={(val) => handleChange({ fontSize: val[0] })}
                                onPointerUp={handleBlur}
                                className="[&_.bg-primary]:bg-white"
                            />
                        </div>

                        {/* Font Weight (Slider request) */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label className="text-xs text-white/70">Weight</Label>
                                <span className="text-xs text-white/50">{shape.fontWeight || 400}</span>
                            </div>
                            <Slider
                                value={[Number(shape.fontWeight) || 400]}
                                min={100}
                                max={900}
                                step={100}
                                onValueChange={(val) => handleChange({ fontWeight: val[0] })}
                                onPointerUp={handleBlur}
                                className="[&_.bg-primary]:bg-white"
                            />
                        </div>

                        {/* Line Height */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label className="text-xs text-white/70">Line Height</Label>
                                <span className="text-xs text-white/50">{shape.lineHeight || 1.2}</span>
                            </div>
                            <Slider
                                value={[shape.lineHeight || 1.2]}
                                min={0.8}
                                max={3.0}
                                step={0.1}
                                onValueChange={(val) => handleChange({ lineHeight: val[0] })}
                                onPointerUp={handleBlur}
                                className="[&_.bg-primary]:bg-white"
                            />
                        </div>

                        {/* Letter Spacing */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label className="text-xs text-white/70">Spacing</Label>
                                <span className="text-xs text-white/50">{shape.letterSpacing || 0}px</span>
                            </div>
                            <Slider
                                value={[shape.letterSpacing || 0]}
                                min={-5}
                                max={20}
                                step={0.5}
                                onValueChange={(val) => handleChange({ letterSpacing: val[0] })}
                                onPointerUp={handleBlur}
                                className="[&_.bg-primary]:bg-white"
                            />
                        </div>
                    </div>
                )}

                {/* Appearance Section */}
                <div className="space-y-4">
                    <Label className="text-xs text-white/50 uppercase tracking-wider">Appearance</Label>

                    {/* Fill Color */}
                    <div className="space-y-2">
                        <Label className="text-xs text-white/70">
                            {shape.type === 'text' ? 'Text Color' : (shape.type === 'frame' ? 'Background' : 'Fill Color')}
                        </Label>
                        <div className="flex items-center gap-2">
                            <div
                                className="w-8 h-8 rounded border border-white/20"
                                style={{ background: shape.fill || '#000000' }}
                            />
                            <Input
                                type="color"
                                value={shape.fill || '#000000'}
                                onChange={(e) => handleChange({ fill: e.target.value })}
                                onBlur={handleBlur}
                            />
                        </div>
                    </div>

                    {/* Opacity (For Images and Shapes) */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label className="text-xs text-white/70">Opacity</Label>
                            <span className="text-xs text-white/50">{Math.round((shape.opacity ?? 1) * 100)}%</span>
                        </div>
                        <Slider
                            value={[(shape.opacity ?? 1)]}
                            min={0}
                            max={1}
                            step={0.01}
                            onValueChange={(val) => handleChange({ opacity: val[0] })}
                            onPointerUp={handleBlur}
                            className="[&_.bg-primary]:bg-white"
                        />
                    </div>
                </div>

                {/* Stroke Section */}
                {(shape.type === 'rect' || shape.type === 'circle' || shape.type === 'frame' || shape.type === 'arrow' || shape.type === 'path') && (
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <Label className="text-xs text-white/50 uppercase tracking-wider">Stroke</Label>

                        {/* Color */}
                        <div className="space-y-2">
                            <Label className="text-xs text-white/70">Color</Label>
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-8 h-8 rounded border border-white/20"
                                    style={{ background: shape.stroke || 'transparent' }}
                                />
                                <Input
                                    type="color"
                                    value={shape.stroke || '#ffffff'}
                                    onChange={(e) => handleChange({ stroke: e.target.value })}
                                    onBlur={handleBlur}
                                />
                            </div>
                        </div>

                        {/* Width */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label className="text-xs text-white/70">Thickness</Label>
                                <span className="text-xs text-white/50">{shape.strokeWidth || 0}px</span>
                            </div>
                            <Slider
                                value={[shape.strokeWidth || 0]}
                                min={0}
                                max={20}
                                step={1}
                                onValueChange={(val) => handleChange({ strokeWidth: val[0] })}
                                onPointerUp={handleBlur}
                                className="[&_.bg-primary]:bg-white"
                            />
                        </div>
                    </div>
                )}

                {/* Arrow Specific */}
                {shape.type === 'arrow' && (
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <Label className="text-xs text-white/50 uppercase tracking-wider">Arrow Style</Label>
                        {/* Head Size */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label className="text-xs text-white/70">Head Size</Label>
                                <span className="text-xs text-white/50">{shape.arrowHeadSize || 20}px</span>
                            </div>
                            <Slider
                                value={[shape.arrowHeadSize || 20]}
                                min={10}
                                max={50}
                                step={1}
                                onValueChange={(val) => handleChange({ arrowHeadSize: val[0] })}
                                onPointerUp={handleBlur}
                                className="[&_.bg-primary]:bg-white"
                            />
                        </div>
                    </div>
                )}

                {/* Frame Specific */}
                {shape.type === 'frame' && (
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <Label className="text-xs text-white/50 uppercase tracking-wider">Frame Actions</Label>

                        {/* Frame Name */}
                        <div className="space-y-2">
                            <Label className="text-xs text-white/70">Name</Label>
                            <Input
                                value={shape.label || "Frame"}
                                onChange={(e) => handleChange({ label: e.target.value })}
                                onBlur={handleBlur}
                                className="h-8 text-xs bg-white/5 border-white/10 text-white"
                            />
                        </div>

                        <Button
                            variant="secondary"
                            className="w-full text-xs"
                            onClick={() => {
                                const canvas = document.querySelector('canvas');
                                if (!canvas) return alert("Canvas not found");

                                const tempCanvas = document.createElement('canvas');
                                const ctx = tempCanvas.getContext('2d');
                                if (!ctx) return;

                                // 1. Calculate Screen Coordinates (Map World -> Screen)
                                const zoom = viewport.zoom;
                                const panX = viewport.x;
                                const panY = viewport.y;

                                const shapeX = shape.x;
                                const shapeY = shape.y;
                                const shapeW = shape.width || 800;
                                const shapeH = shape.height || 600;

                                const screenX = (shapeX * zoom) + panX;
                                const screenY = (shapeY * zoom) + panY;
                                const screenW = shapeW * zoom;
                                const screenH = shapeH * zoom;

                                // 2. Setup Temp Canvas (Target Size = Original Frame Size for quality)
                                tempCanvas.width = shapeW;
                                tempCanvas.height = shapeH;

                                // 3. Draw from Screen Canvas to Temp Canvas
                                // We trust that what is Visible on screen is what we want, but cropped.
                                // NOTE: This resolution depends on Screen Zoom. 
                                // Ideally we'd use the renderer to draw to an offscreen canvas at 1.0 zoom.
                                // But for this quick implementation, we crop the screen buffer.
                                ctx.drawImage(
                                    canvas,
                                    screenX * (window.devicePixelRatio || 1),
                                    screenY * (window.devicePixelRatio || 1),
                                    screenW * (window.devicePixelRatio || 1),
                                    screenH * (window.devicePixelRatio || 1),
                                    0, 0, shapeW, shapeH
                                );

                                const link = document.createElement('a');
                                link.download = `${shape.label || 'frame'}.png`;
                                link.href = tempCanvas.toDataURL("image/png");
                                link.click();
                            }}
                        >
                            Export to PNG
                        </Button>
                    </div>
                )}

                {/* Transform Section */}
                <div className="space-y-4">
                    <Label className="text-xs text-white/50 uppercase tracking-wider">Transform</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-[10px] text-white/50">X</Label>
                            <Input
                                type="number"
                                value={Math.round(shape.x)}
                                onChange={(e) => handleChange({ x: Number(e.target.value) })}
                                className="h-7 text-xs bg-white/5 border-white/10 text-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-white/50">Y</Label>
                            <Input
                                type="number"
                                value={Math.round(shape.y)}
                                onChange={(e) => handleChange({ y: Number(e.target.value) })}
                                className="h-7 text-xs bg-white/5 border-white/10 text-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-white/50">W</Label>
                            <Input
                                type="number"
                                value={Math.round(shape.width || 0)}
                                onChange={(e) => handleChange({ width: Number(e.target.value) })}
                                className="h-7 text-xs bg-white/5 border-white/10 text-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-white/50">H</Label>
                            <Input
                                type="number"
                                value={Math.round(shape.height || 0)}
                                onChange={(e) => handleChange({ height: Number(e.target.value) })}
                                className="h-7 text-xs bg-white/5 border-white/10 text-white"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </ScrollArea >
    );
};
