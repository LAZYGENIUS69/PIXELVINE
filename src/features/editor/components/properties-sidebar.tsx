import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { updateShape } from '@/store/slices/canvasSlice';
import {
    Type,
    Palette,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Bold,
    Italic
} from 'lucide-react';

export const PropertiesSidebar = () => {
    const dispatch = useDispatch();
    const { selectedShapeId, entities } = useSelector((state: RootState) => state.canvas);

    if (!selectedShapeId) return null;

    const shape = entities[selectedShapeId];
    if (!shape) return null;

    const handleChange = (changes: any) => {
        dispatch(updateShape({
            id: shape.id,
            changes
        }));
    };

    // Generic Color Picker
    const ColorSection = () => (
        <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase">Fill</label>
            <div className="flex items-center gap-2">
                <div
                    className="w-8 h-8 rounded border border-gray-600 cursor-pointer"
                    style={{ backgroundColor: shape.fill || 'transparent' }}
                    onClick={() => {
                        // In a real app, open color picker. 
                        // For now, simple presets or HTML5 color input
                        const input = document.createElement('input');
                        input.type = 'color';
                        input.value = shape.fill as string || '#ffffff';
                        input.onchange = (e) => handleChange({ fill: (e.target as HTMLInputElement).value });
                        input.click();
                    }}
                />
                <input
                    type="text"
                    value={shape.fill || ''}
                    onChange={(e) => handleChange({ fill: e.target.value })}
                    className="flex-1 bg-transparent border border-gray-700 rounded px-2 py-1 text-sm text-white"
                />
            </div>
        </div>
    );

    // Stroke/Line Thickness Section
    const StrokeSection = () => {
        if (shape.type === 'text' || shape.type === 'image') return null;

        return (
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">
                    {shape.type === 'arrow' || shape.type === 'line' ? 'Line Thickness' : 'Stroke Width'}
                </label>
                <div className="flex items-center gap-2">
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={shape.strokeWidth || 2}
                        onChange={(e) => handleChange({ strokeWidth: parseInt(e.target.value) })}
                        className="flex-1"
                    />
                    <span className="text-xs text-gray-400 w-8">{shape.strokeWidth || 2}px</span>
                </div>
                <div className="space-y-2 mt-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Stroke Color</label>
                    <div className="flex items-center gap-2">
                        <div
                            className="w-8 h-8 rounded border border-gray-600 cursor-pointer"
                            style={{ backgroundColor: shape.stroke || '#000000' }}
                            onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'color';
                                input.value = shape.stroke as string || '#000000';
                                input.onchange = (e) => handleChange({ stroke: (e.target as HTMLInputElement).value });
                                input.click();
                            }}
                        />
                        <input
                            type="text"
                            value={shape.stroke || ''}
                            onChange={(e) => handleChange({ stroke: e.target.value })}
                            className="flex-1 bg-transparent border border-gray-700 rounded px-2 py-1 text-sm text-white"
                        />
                    </div>
                </div>
            </div>
        );
    };

    // Text Specific Controls
    const TextSection = () => {
        if (shape.type !== 'text') return null;

        return (
            <div className="space-y-4 pt-4 border-t border-gray-800">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Typography</label>

                    {/* Font Family */}
                    <select
                        className="w-full bg-[#1e1e1e] border border-gray-700 rounded px-2 py-1 text-sm text-white"
                        value={shape.fontFamily || 'Inter'}
                        onChange={(e) => handleChange({ fontFamily: e.target.value })}
                    >
                        <option value="Inter">Inter</option>
                        <option value="Arial">Arial</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                    </select>

                    {/* Font Size */}
                    <div className="flex items-center gap-2">
                        <Type size={16} className="text-gray-400" />
                        <input
                            type="range"
                            min="12"
                            max="128"
                            value={shape.fontSize || 16}
                            onChange={(e) => handleChange({ fontSize: parseInt(e.target.value) })}
                            className="flex-1"
                        />
                        <span className="text-xs text-gray-400 w-8">{shape.fontSize}px</span>
                    </div>

                    {/* Weight & Style */}
                    <div className="flex gap-2">
                        <button
                            className={`p-1 rounded ${shape.fontWeight === 'bold' || shape.fontWeight === 700 ? 'bg-blue-600' : 'bg-transparent'}`}
                            onClick={() => handleChange({ fontWeight: shape.fontWeight === 'bold' ? 'normal' : 'bold' })}
                        >
                            <Bold size={16} className="text-white" />
                        </button>
                        {/* Italic not in data model yet, skipping */}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64 bg-[#0F0F0F]/90 backdrop-blur-md border-l border-y border-white/10 rounded-l-xl p-4 shadow-xl z-[100] text-white max-h-[80vh] overflow-y-auto">
            <h3 className="text-sm font-bold mb-4 border-b border-gray-800 pb-2">Properties</h3>

            <div className="space-y-4">
                {/* Dimensions - simplified (Hide for text) */}
                {shape.type !== 'text' && (
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] text-gray-500">X</label>
                            <input
                                type="number"
                                value={Math.round(shape.x)}
                                onChange={(e) => handleChange({ x: parseInt(e.target.value) })}
                                className="w-full bg-transparent border border-gray-700 rounded px-1 text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500">Y</label>
                            <input
                                type="number"
                                value={Math.round(shape.y)}
                                onChange={(e) => handleChange({ y: parseInt(e.target.value) })}
                                className="w-full bg-transparent border border-gray-700 rounded px-1 text-xs"
                            />
                        </div>
                    </div>
                )}

                <ColorSection />
                <StrokeSection />
                <TextSection />
            </div>
        </div>
    );
};
