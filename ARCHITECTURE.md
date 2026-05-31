<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PIXELVINE Architecture</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/@tailwindcss/visuals@1.0.0/dist/tailwindcss-visuals.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * { font-family: 'Inter', system-ui, sans-serif; }
        .glow-purple { box-shadow: 0 0 40px rgba(139, 92, 246, 0.4); }
        .glow-cyan { box-shadow: 0 0 40px rgba(56, 189, 248, 0.4); }
        .glow-green { box-shadow: 0 0 40px rgba(34, 197, 94, 0.4); }
        .glow-orange { box-shadow: 0 0 40px rgba(249, 115, 22, 0.4); }
        .glow-pink { box-shadow: 0 0 40px rgba(236, 72, 153, 0.4); }
        .flow-line {
            stroke-dasharray: 8 4;
            animation: flowDash 1s linear infinite;
        }
        @keyframes flowDash {
            to { stroke-dashoffset: -12; }
        }
        .node { transition: all 0.3s ease; }
        .node:hover { transform: scale(1.02); }
        .layer { backdrop-filter: blur(20px); }
        .glass { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); }
        .glass-strong { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
    </style>
</head>
<body class="bg-gray-950 text-white min-h-screen p-8">
    <div class="max-w-[1800px] mx-auto">
        <!-- Header -->
        <div class="text-center mb-12">
            <h1 class="text-5xl font-black bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                PIXELVINE Architecture
            </h1>
            <p class="text-gray-400 text-lg">AI-Powered Design Engineering Agent — From Prompt to Pixel-Perfect UI</p>
            <div class="flex justify-center gap-4 mt-6">
                <span class="px-4 py-2 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm font-semibold">Next.js 16</span>
                <span class="px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-sm font-semibold">React 19</span>
                <span class="px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-sm font-semibold">Convex</span>
                <span class="px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-sm font-semibold">Redux Toolkit</span>
            </div>
        </div>

        <!-- Legend -->
        <div class="glass rounded-2xl p-6 mb-8 max-w-4xl mx-auto">
            <div class="grid grid-cols-5 gap-4 text-center text-sm">
                <div class="flex items-center gap-2 justify-center">
                    <div class="w-4 h-4 rounded bg-violet-500"></div>
                    <span class="text-gray-400">Frontend</span>
                </div>
                <div class="flex items-center gap-2 justify-center">
                    <div class="w-4 h-4 rounded bg-cyan-500"></div>
                    <span class="text-gray-400">Backend</span>
                </div>
                <div class="flex items-center gap-2 justify-center">
                    <div class="w-4 h-4 rounded bg-green-500"></div>
                    <span class="text-gray-400">State Mgmt</span>
                </div>
                <div class="flex items-center gap-2 justify-center">
                    <div class="w-4 h-4 rounded bg-orange-500"></div>
                    <span class="text-gray-400">AI Layer</span>
                </div>
                <div class="flex items-center gap-2 justify-center">
                    <div class="w-4 h-4 rounded bg-pink-500"></div>
                    <span class="text-gray-400">External</span>
                </div>
            </div>
        </div>

        <!-- Main Architecture -->
        <div class="glass rounded-3xl p-8 mb-8">
            <h2 class="text-2xl font-bold mb-6 text-violet-400">High-Level System Architecture</h2>
            
            <div class="relative overflow-x-auto pb-4">
                <svg viewBox="0 0 1600 600" class="w-full h-auto min-w-[1200px]">
                    <!-- Background Grid -->
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)"/>
                    
                    <!-- User Layer -->
                    <g transform="translate(50, 50)">
                        <rect class="glass-strong rounded-2xl" width="200" height="80" fill="rgba(168,85,247,0.1)" stroke="rgba(168,85,247,0.3)"/>
                        <text x="100" y="35" text-anchor="middle" fill="white" font-size="14" font-weight="600">USER</text>
                        <text x="100" y="55" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-size="11">Browser / App</text>
                    </g>

                    <!-- Next.js Frontend -->
                    <g transform="translate(300, 30)">
                        <rect class="glass rounded-2xl glow-purple" width="280" height="120" fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.5)"/>
                        <text x="140" y="25" text-anchor="middle" fill="white" font-size="16" font-weight="700">NEXT.JS FRONTEND</text>
                        <text x="140" y="42" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="10">App Router + React 19</text>
                        <rect class="glass rounded-lg" x="15" y="55" width="70" height="50" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)"/>
                        <text x="50" y="75" text-anchor="middle" fill="white" font-size="9" font-weight="500">Dashboard</text>
                        <text x="50" y="87" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="8">Projects</text>
                        <rect class="glass rounded-lg" x="95" y="55" width="70" height="50" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)"/>
                        <text x="130" y="75" text-anchor="middle" fill="white" font-size="9" font-weight="500">Editor</text>
                        <text x="130" y="87" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="8">Canvas</text>
                        <rect class="glass rounded-lg" x="175" y="55" width="90" height="50" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)"/>
                        <text x="220" y="75" text-anchor="middle" fill="white" font-size="9" font-weight="500">Style Guide</text>
                        <text x="220" y="87" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="8">AI Panel</text>
                    </g>

                    <!-- State Management -->
                    <g transform="translate(620, 50)">
                        <rect class="glass rounded-2xl glow-green" width="160" height="80" fill="rgba(34,197,94,0.1)" stroke="rgba(34,197,94,0.4)"/>
                        <text x="80" y="25" text-anchor="middle" fill="white" font-size="14" font-weight="600">REDUX</text>
                        <text x="80" y="42" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="10">Toolkit</text>
                        <rect class="glass rounded-lg" x="10" y="50" width="60" height="22" fill="rgba(34,197,94,0.1)"/>
                        <text x="40" y="65" text-anchor="middle" fill="white" font-size="8">Canvas</text>
                        <rect class="glass rounded-lg" x="75" y="50" width="70" height="22" fill="rgba(34,197,94,0.1)"/>
                        <text x="110" y="65" text-anchor="middle" fill="white" font-size="8">StyleGuide</text>
                    </g>

                    <!-- syncMiddleware -->
                    <g transform="translate(620, 140)">
                        <rect class="glass rounded-xl" width="160" height="40" fill="rgba(34,197,94,0.05)" stroke="rgba(34,197,94,0.2)" stroke-dasharray="4 2"/>
                        <text x="80" y="25" text-anchor="middle" fill="rgba(34,197,94,0.8)" font-size="10" font-weight="500">syncMiddleware</text>
                    </g>

                    <!-- Convex Backend -->
                    <g transform="translate(820, 30)">
                        <rect class="glass rounded-2xl glow-cyan" width="200" height="120" fill="rgba(56,189,248,0.15)" stroke="rgba(56,189,248,0.5)"/>
                        <text x="100" y="25" text-anchor="middle" fill="white" font-size="14" font-weight="600">CONVEX</text>
                        <text x="100" y="42" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="10">Real-time DB + Actions</text>
                        <rect class="glass rounded-lg" x="10" y="50" width="55" height="35" fill="rgba(56,189,248,0.1)"/>
                        <text x="37" y="68" text-anchor="middle" fill="white" font-size="8">projects</text>
                        <rect class="glass rounded-lg" x="72" y="50" width="55" height="35" fill="rgba(56,189,248,0.1)"/>
                        <text x="100" y="68" text-anchor="middle" fill="white" font-size="8">frames</text>
                        <rect class="glass rounded-lg" x="134" y="50" width="55" height="35" fill="rgba(56,189,248,0.1)"/>
                        <text x="161" y="68" text-anchor="middle" fill="white" font-size="8">moodBoards</text>
                        <rect class="glass rounded-lg" x="10" y="90" width="55" height="25" fill="rgba(56,189,248,0.1)"/>
                        <text x="37" y="105" text-anchor="middle" fill="white" font-size="8">genJobs</text>
                        <rect class="glass rounded-lg" x="72" y="90" width="55" height="25" fill="rgba(56,189,248,0.1)"/>
                        <text x="100" y="105" text-anchor="middle" fill="white" font-size="8">chatMsg</text>
                        <rect class="glass rounded-lg" x="134" y="90" width="55" height="25" fill="rgba(56,189,248,0.1)"/>
                        <text x="161" y="105" text-anchor="middle" fill="white" font-size="8">users</text>
                    </g>

                    <!-- AI Layer -->
                    <g transform="translate(1060, 20)">
                        <rect class="glass rounded-2xl glow-orange" width="220" height="140" fill="rgba(249,115,22,0.15)" stroke="rgba(249,115,22,0.5)"/>
                        <text x="110" y="25" text-anchor="middle" fill="white" font-size="14" font-weight="600">AI AGENTS</text>
                        <text x="110" y="42" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="10">Multi-Provider Pipeline</text>
                        
                        <rect class="glass rounded-lg" x="10" y="50" width="95" height="40" fill="rgba(249,115,22,0.1)"/>
                        <text x="57" y="65" text-anchor="middle" fill="white" font-size="9" font-weight="600">Design Agent</text>
                        <text x="57" y="78" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="7">Groq → Cerebras</text>
                        
                        <rect class="glass rounded-lg" x="115" y="50" width="95" height="40" fill="rgba(249,115,22,0.1)"/>
                        <text x="162" y="65" text-anchor="middle" fill="white" font-size="9" font-weight="600">Style Guide</text>
                        <text x="162" y="78" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="7">Gemini 2.5</text>
                        
                        <rect class="glass rounded-lg" x="10" y="95" width="95" height="40" fill="rgba(249,115,22,0.1)"/>
                        <text x="57" y="110" text-anchor="middle" fill="white" font-size="9" font-weight="600">UX Critique</text>
                        <text x="57" y="123" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="7">WCAG + Heuristics</text>
                        
                        <rect class="glass rounded-lg" x="115" y="95" width="95" height="40" fill="rgba(249,115,22,0.1)"/>
                        <text x="162" y="110" text-anchor="middle" fill="white" font-size="9" font-weight="600">Inspiration</text>
                        <text x="162" y="123" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="7">Vision + Variations</text>
                    </g>

                    <!-- External AI Providers -->
                    <g transform="translate(1320, 40)">
                        <rect class="glass rounded-2xl" width="180" height="100" fill="rgba(236,72,153,0.1)" stroke="rgba(236,72,153,0.3)"/>
                        <text x="90" y="25" text-anchor="middle" fill="white" font-size="12" font-weight="600">AI PROVIDERS</text>
                        <text x="90" y="40" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="9">External APIs</text>
                        <text x="90" y="58" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="9">Groq (LLaMA 3.3)</text>
                        <text x="90" y="73" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="9">Cerebras (GPT-OSS)</text>
                        <text x="90" y="88" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="9">Gemini 2.5 Flash</text>
                    </g>

                    <!-- Flow Lines -->
                    <path d="M 250 90 L 300 90" stroke="rgba(139,92,246,0.5)" stroke-width="2" class="flow-line" marker-end="url(#arrow)"/>
                    <path d="M 580 90 L 620 90" stroke="rgba(34,197,94,0.5)" stroke-width="2" class="flow-line"/>
                    <path d="M 780 90 L 820 90" stroke="rgba(56,189,248,0.5)" stroke-width="2" class="flow-line"/>
                    <path d="M 1020 90 L 1060 90" stroke="rgba(249,115,22,0.5)" stroke-width="2" class="flow-line"/>
                    <path d="M 1280 90 L 1320 90" stroke="rgba(236,72,153,0.5)" stroke-width="2" class="flow-line"/>
                    
                    <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(139,92,246,0.5)"/>
                        </marker>
                    </defs>
                </svg>
            </div>
        </div>

        <!-- AI Pipeline Detail -->
        <div class="glass rounded-3xl p-8 mb-8">
            <h2 class="text-2xl font-bold mb-6 text-orange-400">AI Design Pipeline — Architect → Designer</h2>
            
            <div class="grid grid-cols-4 gap-6">
                <!-- Step 1: User Input -->
                <div class="glass-strong rounded-2xl p-6 text-center">
                    <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-500/20 flex items-center justify-center">
                        <svg class="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold mb-2">1. User Prompt</h3>
                    <p class="text-gray-400 text-sm">Text description of desired app/product</p>
                    <div class="mt-4 p-3 glass rounded-lg text-xs text-gray-500">
                        e.g., "Fintech app for Gen Z"
                    </div>
                </div>

                <!-- Step 2: Architect -->
                <div class="glass-strong rounded-2xl p-6 text-center relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-20 h-20 bg-orange-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div class="relative">
                        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                            <svg class="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                            </svg>
                        </div>
                        <h3 class="text-lg font-bold mb-2">2. Architect Agent</h3>
                        <p class="text-gray-400 text-sm">Plans screen structure</p>
                        <div class="mt-4 p-3 glass rounded-lg text-xs">
                            <div class="text-orange-400 mb-1">Groq LLaMA 3.3 70B</div>
                            <div class="text-gray-500">↓</div>
                            <div class="text-cyan-400">Cerebras fallback</div>
                        </div>
                    </div>
                </div>

                <!-- Step 3: Design Plan -->
                <div class="glass-strong rounded-2xl p-6 text-center">
                    <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
                        <svg class="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold mb-2">3. Screen Plan JSON</h3>
                    <p class="text-gray-400 text-sm">3 distinct screens + theme</p>
                    <div class="mt-4 p-3 glass rounded-lg text-xs text-gray-400">
                        { screens: [...], theme: {...} }
                    </div>
                </div>

                <!-- Step 4: Designer -->
                <div class="glass-strong rounded-2xl p-6 text-center relative overflow-hidden">
                    <div class="absolute bottom-0 left-0 w-20 h-20 bg-pink-500/20 rounded-full blur-3xl -ml-10 -mb-10"></div>
                    <div class="relative">
                        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-pink-500/20 flex items-center justify-center">
                            <svg class="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
                            </svg>
                        </div>
                        <h3 class="text-lg font-bold mb-2">4. Designer Agent</h3>
                        <p class="text-gray-400 text-sm">Generates pixel-perfect HTML</p>
                        <div class="mt-4 p-3 glass rounded-lg text-xs">
                            <div class="text-pink-400">Glassmorphism + 3D</div>
                            <div class="text-gray-500">↓</div>
                            <div class="text-green-400">390×844 or 1440×900</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Fallback Chain -->
            <div class="mt-8 glass rounded-xl p-6">
                <h4 class="text-sm font-semibold text-gray-400 mb-4">3-Tier AI Fallback Chain</h4>
                <div class="flex items-center gap-4">
                    <div class="flex-1 bg-gradient-to-r from-violet-500/20 to-violet-500/10 rounded-xl p-4 text-center border border-violet-500/30">
                        <div class="text-violet-400 font-bold">1. Groq</div>
                        <div class="text-gray-400 text-sm">LLaMA 3.3 70B — Primary (100K tokens/day free)</div>
                    </div>
                    <div class="text-cyan-400">→</div>
                    <div class="flex-1 bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 rounded-xl p-4 text-center border border-cyan-500/30">
                        <div class="text-cyan-400 font-bold">2. Cerebras</div>
                        <div class="text-gray-400 text-sm">GPT-OSS 120B — Fallback on 429 (1M tokens/day free)</div>
                    </div>
                    <div class="text-orange-400">→</div>
                    <div class="flex-1 bg-gradient-to-r from-orange-500/20 to-orange-500/10 rounded-xl p-4 text-center border border-orange-500/30">
                        <div class="text-orange-400 font-bold">3. Gemini</div>
                        <div class="text-gray-400 text-sm">Gemini 2.5 Flash — Last resort</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Canvas Engine Architecture -->
        <div class="glass rounded-3xl p-8 mb-8">
            <h2 class="text-2xl font-bold mb-6 text-green-400">Infinity Canvas Engine — Dual Layer Rendering</h2>
            
            <div class="grid grid-cols-2 gap-8">
                <div class="glass-strong rounded-2xl p-6">
                    <h3 class="text-lg font-bold mb-4 text-white">Static Layer</h3>
                    <ul class="space-y-3 text-gray-300 text-sm">
                        <li class="flex items-start gap-3">
                            <span class="w-2 h-2 mt-2 rounded-full bg-green-500"></span>
                            <span>Grid rendering (50px cells with zoom scaling)</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <span class="w-2 h-2 mt-2 rounded-full bg-green-500"></span>
                            <span>Shape rendering (all non-dragged shapes)</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <span class="w-2 h-2 mt-2 rounded-full bg-green-500"></span>
                            <span>Only redraws when matrix changes or shapes update</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <span class="w-2 h-2 mt-2 rounded-full bg-green-500"></span>
                            <span>Frames rendered first (z-order)</span>
                        </li>
                    </ul>
                </div>
                
                <div class="glass-strong rounded-2xl p-6">
                    <h3 class="text-lg font-bold mb-4 text-white">Active Layer</h3>
                    <ul class="space-y-3 text-gray-300 text-sm">
                        <li class="flex items-start gap-3">
                            <span class="w-2 h-2 mt-2 rounded-full bg-cyan-500"></span>
                            <span>Selection overlay with resize handles</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <span class="w-2 h-2 mt-2 rounded-full bg-cyan-500"></span>
                            <span>Drag preview (60fps animation)</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <span class="w-2 h-2 mt-2 rounded-full bg-cyan-500"></span>
                            <span>Pen tool path drawing</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <span class="w-2 h-2 mt-2 rounded-full bg-cyan-500"></span>
                            <span>Always redraws for smooth interaction</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="mt-6 glass rounded-xl p-6">
                <h4 class="text-sm font-semibold text-gray-400 mb-4">Matrix Transform & LERP Animation</h4>
                <div class="grid grid-cols-4 gap-4">
                    <div class="glass rounded-lg p-4 text-center">
                        <div class="text-2xl font-bold text-white mb-1">60fps</div>
                        <div class="text-gray-500 text-sm">Target FPS</div>
                    </div>
                    <div class="glass rounded-lg p-4 text-center">
                        <div class="text-2xl font-bold text-white mb-1">0.15</div>
                        <div class="text-gray-500 text-sm">LERP Factor</div>
                    </div>
                    <div class="glass rounded-lg p-4 text-center">
                        <div class="text-2xl font-bold text-white mb-1">DOMMatrix</div>
                        <div class="text-gray-500 text-sm">Transform Engine</div>
                    </div>
                    <div class="glass rounded-lg p-4 text-center">
                        <div class="text-2xl font-bold text-white mb-1">8</div>
                        <div class="text-gray-500 text-sm">Shape Types</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- State Management Flow -->
        <div class="glass rounded-3xl p-8 mb-8">
            <h2 class="text-2xl font-bold mb-6 text-green-400">State Management — Redux → Convex Sync</h2>
            
            <div class="flex items-center justify-center gap-4 text-sm">
                <div class="glass-strong rounded-xl p-4 text-center">
                    <div class="text-green-400 font-bold mb-1">Redux Store</div>
                    <div class="text-gray-400">canvasSlice, styleGuideSlice, generationSlice</div>
                </div>
                
                <div class="text-cyan-400 text-2xl">→</div>
                
                <div class="glass-strong rounded-xl p-4 text-center border border-cyan-500/30">
                    <div class="text-cyan-400 font-bold mb-1">syncMiddleware</div>
                    <div class="text-gray-400">Debounced 200ms • Skips during drag</div>
                </div>
                
                <div class="text-green-400 text-2xl">→</div>
                
                <div class="glass-strong rounded-xl p-4 text-center border border-green-500/30">
                    <div class="text-green-400 font-bold mb-1">Convex Client</div>
                    <div class="text-gray-400">Real-time DB mutation</div>
                </div>
                
                <div class="text-cyan-400 text-2xl">→</div>
                
                <div class="glass-strong rounded-xl p-4 text-center">
                    <div class="text-violet-400 font-bold mb-1">Convex DB</div>
                    <div class="text-gray-400">projects table (sketchesData)</div>
                </div>
            </div>

            <div class="mt-6 grid grid-cols-3 gap-4">
                <div class="glass rounded-lg p-4">
                    <div class="text-sm font-semibold text-gray-400 mb-2">Throttling Logic</div>
                    <div class="text-white text-sm">
                        if (isDragging || isInteracting) skip sync
                    </div>
                </div>
                <div class="glass rounded-lg p-4">
                    <div class="text-sm font-semibold text-gray-400 mb-2">Debounce Timer</div>
                    <div class="text-white text-sm">
                        200ms for shapes, 500ms for viewport
                    </div>
                </div>
                <div class="glass rounded-lg p-4">
                    <div class="text-sm font-semibold text-gray-400 mb-2">Force Sync</div>
                    <div class="text-white text-sm">
                        forceSync action bypasses debounce
                    </div>
                </div>
            </div>
        </div>

        <!-- Database Schema -->
        <div class="glass rounded-3xl p-8 mb-8">
            <h2 class="text-2xl font-bold mb-6 text-cyan-400">Convex Database Schema — 8 Tables</h2>
            
            <div class="grid grid-cols-4 gap-4">
                <div class="glass-strong rounded-xl p-4 border-l-4 border-violet-500">
                    <div class="font-bold text-white mb-1">users</div>
                    <div class="text-gray-400 text-xs space-y-1">
                        <div>tokenIdentifier</div>
                        <div>name, email, image</div>
                        <div>credits, isPro</div>
                    </div>
                </div>
                
                <div class="glass-strong rounded-xl p-4 border-l-4 border-cyan-500">
                    <div class="font-bold text-white mb-1">projects</div>
                    <div class="text-gray-400 text-xs space-y-1">
                        <div>userId, name</div>
                        <div>sketchesData (JSON)</div>
                        <div>designAST, critique</div>
                        <div>palette, renderUrl</div>
                    </div>
                </div>
                
                <div class="glass-strong rounded-xl p-4 border-l-4 border-pink-500">
                    <div class="font-bold text-white mb-1">frames</div>
                    <div class="text-gray-400 text-xs space-y-1">
                        <div>projectId, screenId</div>
                        <div>name, purpose</div>
                        <div>htmlContent</div>
                        <div>status (pending/generating/done/error)</div>
                    </div>
                </div>
                
                <div class="glass-strong rounded-xl p-4 border-l-4 border-orange-500">
                    <div class="font-bold text-white mb-1">generationJobs</div>
                    <div class="text-gray-400 text-xs space-y-1">
                        <div>projectId, status</div>
                        <div>analysis, theme</div>
                        <div>totalScreens, completedScreens</div>
                        <div>designMode (mobile/web)</div>
                    </div>
                </div>
                
                <div class="glass-strong rounded-xl p-4 border-l-4 border-green-500">
                    <div class="font-bold text-white mb-1">chatMessages</div>
                    <div class="text-gray-400 text-xs space-y-1">
                        <div>projectId, role</div>
                        <div>content</div>
                        <div>frameId (optional)</div>
                        <div>createdAt</div>
                    </div>
                </div>
                
                <div class="glass-strong rounded-xl p-4 border-l-4 border-purple-500">
                    <div class="font-bold text-white mb-1">moodBoards</div>
                    <div class="text-gray-400 text-xs space-y-1">
                        <div>projectId, storageId</div>
                        <div>url, x, y</div>
                        <div>imageType (wireframe/reference)</div>
                    </div>
                </div>
                
                <div class="glass-strong rounded-xl p-4 border-l-4 border-yellow-500">
                    <div class="font-bold text-white mb-1">inspirationVariations</div>
                    <div class="text-gray-400 text-xs space-y-1">
                        <div>projectId, name</div>
                        <div>style, code</div>
                        <div>type, previewUrl</div>
                        <div>isApplied</div>
                    </div>
                </div>
                
                <div class="glass-strong rounded-xl p-4 border-l-4 border-red-500">
                    <div class="font-bold text-white mb-1">subscriptions</div>
                    <div class="text-gray-400 text-xs space-y-1">
                        <div>userId, polarId</div>
                        <div>status</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Issues Found -->
        <div class="glass rounded-3xl p-8 border border-red-500/30">
            <h2 class="text-2xl font-bold mb-6 text-red-400">Issues Found & Fixes Applied</h2>
            
            <div class="grid grid-cols-2 gap-6">
                <div class="glass-strong rounded-xl p-4 border-l-4 border-yellow-500">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 font-semibold">BUG</span>
                        <span class="font-bold text-white">Duplicate Assignment</span>
                    </div>
                    <div class="text-gray-400 text-sm mb-3">
                        Line 767 in use-infinity-canvas.ts has <code class="text-yellow-400">isDragging.current = true</code> duplicated
                    </div>
                    <div class="text-green-400 text-sm font-mono text-xs">Fixed ✓</div>
                </div>

                <div class="glass-strong rounded-xl p-4 border-l-4 border-yellow-500">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 font-semibold">MISSING</span>
                        <span class="font-bold text-white">getByType Query</span>
                    </div>
                    <div class="text-gray-400 text-sm mb-3">
                        designAgent.ts references <code class="text-yellow-400">api.moodBoards.getByType</code> but it's not defined
                    </div>
                    <div class="text-green-400 text-sm font-mono text-xs">Fixed ✓</div>
                </div>

                <div class="glass-strong rounded-xl p-4 border-l-4 border-yellow-500">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 font-semibold">INCOMPLETE</span>
                        <span class="font-bold text-white">chatEditFrame Truncated</span>
                    </div>
                    <div class="text-gray-400 text-sm mb-3">
                        chatEditFrame function cuts off at line 1133 — no handler completion
                    </div>
                    <div class="text-green-400 text-sm font-mono text-xs">Fixed ✓</div>
                </div>

                <div class="glass-strong rounded-xl p-4 border-l-4 border-yellow-500">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 font-semibold">PLACEHOLDER</span>
                        <span class="font-bold text-white">Replicate Version ID</span>
                    </div>
                    <div class="text-gray-400 text-sm mb-3">
                        ai.ts line 227 has a fake Replicate version ID
                    </div>
                    <div class="text-green-400 text-sm font-mono text-xs">Fixed ✓</div>
                </div>

                <div class="glass-strong rounded-xl p-4 border-l-4 border-yellow-500">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 font-semibold">MISSING</span>
                        <span class="font-bold text-white">frames.get Query</span>
                    </div>
                    <div class="text-gray-400 text-sm mb-3">
                        designAgent references <code class="text-yellow-400">api.frames.get</code> but only <code class="text-yellow-400">getById</code> exists
                    </div>
                    <div class="text-green-400 text-sm font-mono text-xs">Fixed ✓</div>
                </div>

                <div class="glass-strong rounded-xl p-4 border-l-4 border-yellow-500">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 font-semibold">AUTH</span>
                        <span class="font-bold text-white">Auth Commented Out</span>
                    </div>
                    <div class="text-gray-400 text-sm mb-3">
                        Auth checks commented in ai.ts actions — needs userId validation
                    </div>
                    <div class="text-green-400 text-sm font-mono text-xs">Fixed ✓</div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="text-center mt-12 text-gray-500 text-sm">
            <p>PIXELVINE — Deep Design Engineering Agent</p>
            <p class="mt-1">From prompt to 3 production-ready screens in under 30 seconds</p>
        </div>
    </div>
</body>
</html>