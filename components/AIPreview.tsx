'use client';

import { useEffect, useRef, useState } from 'react';

type DesignType = 'mobile' | 'website';

interface AIPreviewProps {
  code: string;
  designType?: DesignType;
  screenName?: string;
}

/**
 * AIPreview — Renders AI-generated HTML+Tailwind code in a sandboxed iframe.
 * 
 * Supports two modes:
 *   - mobile: Renders in a phone device frame (375x812 iPhone dimensions)
 *   - website: Renders full-width webpage layout
 * 
 * The generated code is either:
 *   A) A full HTML page (detected by <html or <!DOCTYPE)
 *   B) An HTML fragment (wrapped in a boilerplate page with Tailwind + fonts)
 *   C) React/JSX code (cleaned and wrapped in a Babel-based fallback)
 */
export default function AIPreview({ code, designType = 'mobile', screenName }: AIPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!iframeRef.current || !code) return;
    setHasError(false);

    // Step 1: Remove markdown code fences
    let cleanCode = code
      .replace(/```(?:tsx|jsx|javascript|typescript|html)?/g, '')
      .replace(/```/g, '')
      .trim();

    let html: string;

    // Detect if code is already a full HTML page
    if (cleanCode.match(/<!DOCTYPE|<html/i)) {
      // It's a full page — inject Tailwind + Lucide + fonts if missing
      if (!cleanCode.includes('tailwindcss')) {
        cleanCode = cleanCode.replace(
          '<head>',
          `<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>body{font-family:'Inter',sans-serif;margin:0;-webkit-font-smoothing:antialiased}</style>`
        );
      }
      // Always ensure Lucide icons are available and initialized
      if (!cleanCode.includes('lucide')) {
        cleanCode = cleanCode.replace(
          '</head>',
          `<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  <script>document.addEventListener('DOMContentLoaded',function(){if(typeof lucide!=='undefined')lucide.createIcons();});</script>
</head>`
        );
      }
      html = cleanCode;
    }
    // Detect if it contains JSX/React patterns — use Babel fallback
    else if (
      cleanCode.includes('export default function') ||
      cleanCode.includes('export default') ||
      cleanCode.includes('const Component') ||
      cleanCode.match(/function\s+\w+\s*\(\s*\)\s*\{[\s\S]*return\s*\(/)
    ) {
      html = buildReactFallback(cleanCode, designType);
    }
    // Otherwise treat as HTML fragment
    else {
      html = wrapHtmlFragment(cleanCode, designType);
    }

    iframeRef.current.srcdoc = html;

    // Listen for error messages from iframe
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'preview-error') {
        setHasError(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [code, designType]);

  const isMobile = designType === 'mobile';

  return (
    <div className={`relative ${isMobile ? 'flex justify-center items-center py-8' : ''}`}>
      {isMobile && (
        // Phone Device Frame
        <div className="relative">
          {/* Phone bezel */}
          <div className="relative bg-gray-900 rounded-[50px] p-3 shadow-2xl">
            {/* Inner frame */}
            <div className="relative bg-black rounded-[40px] overflow-hidden">
              {/* Dynamic Island / Notch */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-50"></div>

              {/* Screen - iPhone 16 dimensions */}
              <div className="w-[390px] h-[844px] bg-gray-950 overflow-hidden">
                <iframe
                  ref={iframeRef}
                  title={`AI Preview${screenName ? ` - ${screenName}` : ''}`}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-modals allow-forms"
                  style={{ colorScheme: 'light' }}
                />
              </div>

              {/* Screen reflection overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-[40px]"></div>
            </div>

            {/* Side buttons */}
            <div className="absolute -left-1 top-32 w-1 h-8 bg-gray-800 rounded-l"></div>
            <div className="absolute -left-1 top-48 w-1 h-12 bg-gray-800 rounded-l"></div>
            <div className="absolute -right-1 top-40 w-1 h-16 bg-gray-800 rounded-r"></div>
          </div>

          {/* Shadow */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-64 h-8 bg-black/20 blur-2xl rounded-full"></div>
        </div>
      )}

      {!isMobile && (
        // Website Full-Width Frame
        <div className="w-full min-h-[500px] border rounded-lg overflow-hidden bg-white shadow-sm relative">
          <iframe
            ref={iframeRef}
            title={`AI Preview${screenName ? ` - ${screenName}` : ''}`}
            className="w-full h-full border-0 min-h-[500px]"
            sandbox="allow-scripts allow-same-origin allow-popups allow-modals allow-forms"
            style={{ colorScheme: 'light' }}
          />
        </div>
      )}

      {hasError && (
        <div className="absolute bottom-2 right-2 bg-red-500/90 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm z-50">
          Render error — check console
        </div>
      )}

      {screenName && (
        <div className="text-center mt-4 text-sm text-gray-500 font-medium">
          {screenName}
        </div>
      )}
    </div>
  );
}

/**
 * Wrap an HTML fragment in a full page with Tailwind + Inter font.
 */
function wrapHtmlFragment(fragment: string, designType: DesignType): string {
  const isMobile = designType === 'mobile';

  if (isMobile) {
    // Mobile: iPhone 16 dimensions (390x844)
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
        },
      },
    }
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; overflow: hidden; }
    body { background: #0A0A0F; }
    img { max-width: 100%; height: auto; }
    /* Custom scrollbar for mobile */
    ::-webkit-scrollbar { width: 0px; background: transparent; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    /* Lucide icons */
    .lucide { width: 1.5rem; height: 1.5rem; }
  </style>
</head>
<body>
  ${fragment}
  <script>
    // Initialize Lucide icons — use DOMContentLoaded for srcdoc reliability
    document.addEventListener('DOMContentLoaded', function() {
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
    
    // Image error fallback
    document.addEventListener('error', function(e) {
      if (e.target && e.target.tagName === 'IMG') {
        e.target.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        e.target.style.minHeight = '100px';
        e.target.style.display = 'block';
        e.target.removeAttribute('src');
      }
    }, true);
    
    // Simulate touch feedback
    document.querySelectorAll('button, [role="button"]').forEach(btn => {
      btn.addEventListener('touchstart', () => btn.style.transform = 'scale(0.95)');
      btn.addEventListener('touchend', () => btn.style.transform = 'scale(1)');
    });
  </script>
</body>
</html>`;
  } else {
    // Website: Full-width layout
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
        },
      },
    }
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  ${fragment}
  <script>
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    // Image error fallback
    document.addEventListener('error', function(e) {
      if (e.target && e.target.tagName === 'IMG') {
        e.target.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        e.target.style.minHeight = '200px';
        e.target.style.display = 'block';
        e.target.removeAttribute('src');
      }
    }, true);
  </script>
</body>
</html>`;
  }
}

/**
 * Fallback: try to render React/JSX code via Babel standalone.
 * This is the old approach, kept as a fallback for React-formatted code.
 */
function buildReactFallback(code: string, designType: DesignType): string {
  let cleanCode = code;
  const isMobile = designType === 'mobile';

  // Strip imports
  cleanCode = cleanCode.replace(/^import\s+.*$/gm, '');

  // Handle export patterns
  let componentName = 'Component';

  if (/export\s+default\s+function\s+(\w+)/.test(cleanCode)) {
    cleanCode = cleanCode.replace(/export\s+default\s+function\s+(\w+)/, (_m, name) => {
      componentName = name;
      return `function ${name}`;
    });
  } else if (/export\s+default\s+(\w+)\s*;?\s*$/m.test(cleanCode)) {
    cleanCode = cleanCode.replace(/export\s+default\s+(\w+)\s*;?\s*$/m, (_m, name) => {
      componentName = name;
      return '';
    });
  }
  if (/export\s+function\s+(\w+)/.test(cleanCode)) {
    cleanCode = cleanCode.replace(/export\s+function\s+(\w+)/, (_m, name) => {
      componentName = name;
      return `function ${name}`;
    });
  }
  if (/export\s+const\s+(\w+)/.test(cleanCode)) {
    cleanCode = cleanCode.replace(/export\s+const\s+(\w+)/, (_m, name) => {
      componentName = name;
      return `const ${name}`;
    });
  }
  cleanCode = cleanCode.replace(/^export\s+/gm, '');

  // Remove TypeScript type annotations that Babel can't handle without TS preset
  cleanCode = cleanCode
    .replace(/:\s*React\.\w+(<[^>]*>)?/g, '')       // : React.FC<Props>
    .replace(/:\s*\w+\[\]/g, '')                      // : string[]
    .replace(/:\s*(?:string|number|boolean|any)\b/g, '') // : string, : number
    .replace(/<(\w+)(?:,\s*\w+)*>\(/g, '(')          // Generic type params on functions
    .replace(/as\s+\w+/g, '');                         // as Type

  // Escape the code for embedding in script tag — replace </script with <\/script
  const safeCode = cleanCode.replace(/<\/script/gi, '<\\/script');

  // Use document.write approach to avoid template literal issues with script tags
  const scriptContent = `
        const { useState, useEffect, useRef, useCallback, useMemo, Fragment, createContext, useContext } = React;

        // Lucide icon factory
        function createLucideIcon(iconName) {
            const kebab = iconName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase();
            return function LucideIcon(props) {
                const ref = React.useRef(null);
                React.useEffect(function() {
                    if (!ref.current || typeof lucide === 'undefined' || !lucide.icons) return;
                    var iconData = lucide.icons[kebab];
                    if (!iconData) return;
                    var svg = document.createElementNS('http://www.w3.org/2000/svg', iconData[0]);
                    var attrs = iconData[1];
                    Object.keys(attrs).forEach(function(k) { svg.setAttribute(k, attrs[k]); });
                    svg.setAttribute('width', props.size || props.width || '24');
                    svg.setAttribute('height', props.size || props.height || '24');
                    if (props.className) svg.setAttribute('class', props.className);
                    if (props.color) svg.setAttribute('stroke', props.color);
                    if (props.strokeWidth) svg.setAttribute('stroke-width', String(props.strokeWidth));
                    var children = iconData[2] || [];
                    children.forEach(function(child) {
                        var el = document.createElementNS('http://www.w3.org/2000/svg', child[0]);
                        var ca = child[1] || {};
                        Object.keys(ca).forEach(function(k) { el.setAttribute(k, ca[k]); });
                        svg.appendChild(el);
                    });
                    ref.current.innerHTML = '';
                    ref.current.appendChild(svg);
                }, []);
                return React.createElement('span', {
                    ref: ref,
                    style: Object.assign({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }, props.style || {}),
                    className: props.className || '',
                });
            };
        }

        // Register 100+ Lucide icons as globals
        var iconNames = ['Activity','AlertCircle','AlertTriangle','ArrowDown','ArrowLeft','ArrowRight','ArrowUp','Award','BarChart','BarChart2','BarChart3','Bell','Bold','Book','BookOpen','Bookmark','Box','Briefcase','Calendar','Camera','Check','CheckCircle','CheckCircle2','ChevronDown','ChevronLeft','ChevronRight','ChevronUp','Circle','Clock','Cloud','Code','Code2','Coffee','Compass','Copy','CreditCard','Crown','Database','Diamond','DollarSign','Download','Edit','Edit2','ExternalLink','Eye','EyeOff','Facebook','Feather','File','FileText','Film','Filter','Flag','Flame','Folder','Gift','Github','Globe','Globe2','GraduationCap','Grid','Hash','Headphones','Heart','HelpCircle','Home','Image','Inbox','Info','Instagram','Key','Laptop','Layers','Layout','LayoutDashboard','Leaf','Library','Lightbulb','Link','Link2','Linkedin','List','Loader','Loader2','Lock','LogIn','LogOut','Mail','Map','MapPin','Maximize','Maximize2','Menu','MessageCircle','MessageSquare','Mic','Minimize','Minimize2','Minus','Monitor','Moon','MoreHorizontal','MoreVertical','Mountain','Mouse','Move','Music','Navigation','Package','Palette','Paperclip','Pause','Pen','Pencil','Phone','PieChart','Pin','Play','PlayCircle','Plus','PlusCircle','Power','Quote','RefreshCw','Repeat','RotateCcw','RotateCw','Save','Scissors','Search','Send','Server','Settings','Settings2','Share','Share2','Shield','ShieldCheck','ShoppingBag','ShoppingCart','Sidebar','Signal','Sliders','Smartphone','Smile','Sparkle','Sparkles','Speaker','Square','Star','Sun','Sunrise','Sunset','Tag','Target','Terminal','ThumbsDown','ThumbsUp','Timer','ToggleLeft','ToggleRight','Tool','Trash','Trash2','TrendingDown','TrendingUp','Triangle','Trophy','Truck','Tv','Twitter','Type','Umbrella','Undo','Unlock','Upload','User','UserCheck','UserPlus','Users','Video','Volume','Volume2','VolumeX','Wallet','Wand','Wand2','Watch','Wifi','Wind','Wrench','X','XCircle','Zap','ZapOff','ZoomIn','ZoomOut','Building','Building2','Rocket','ScrollText','Fingerprint','Handsr'];
        iconNames.forEach(function(name) { window[name] = createLucideIcon(name); });

        // Image error fallback
        document.addEventListener('error', function(e) {
            if (e.target && e.target.tagName === 'IMG') {
                e.target.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                e.target.style.minHeight = '200px';
                e.target.style.minWidth = '100%';
                e.target.style.display = 'block';
                e.target.alt = '';
                e.target.removeAttribute('src');
            }
        }, true);

        try {
            ${safeCode}
            var root = ReactDOM.createRoot(document.getElementById("root"));
            root.render(React.createElement(${componentName}));
        } catch (err) {
            console.error("Preview Render Error:", err);
            document.getElementById("root").innerHTML = '<div style="padding:40px;font-family:Inter,sans-serif;color:#ef4444;background:#0f172a;min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;"><div style="font-size:20px;font-weight:700;">⚠ Preview Error</div><pre style="font-size:13px;color:#94a3b8;max-width:600px;text-align:left;white-space:pre-wrap;background:#1e293b;padding:16px;border-radius:8px;">' + err.message + '</pre></div>';
            window.parent.postMessage({ type: 'preview-error', message: err.message }, '*');
        }
    `;

  // Build the HTML string with script tags as separate concatenated strings
  const part1 = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${isMobile ? '375' : 'device-width'}, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    body { background: ${isMobile ? '#0A0A0F' : 'white'}; ${isMobile ? 'overflow: hidden;' : ''} }
    img { max-width: 100%; height: auto; }
    #root { min-height: 100vh; ${isMobile ? 'width: 375px; margin: 0 auto;' : ''} }
  </style>`;

  const part2 = `</head>
<body>
  <div id="root"><div style="display:flex;align-items:center;justify-content:center;min-height:100vh;color:#64748b;font-family:Inter,sans-serif">Loading preview...</div></div>`;

  // Construct script tags via concatenation to avoid </script> issues
  const scripts = [
    ['https://cdn.tailwindcss.com', ''],
    ['', `tailwind.config={theme:{extend:{fontFamily:{sans:['Inter','system-ui','sans-serif']}}}}`],
    ['https://unpkg.com/react@18/umd/react.production.min.js', ''],
    ['https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', ''],
    ['https://unpkg.com/@babel/standalone/babel.min.js', ''],
    ['https://unpkg.com/lucide@latest/dist/umd/lucide.min.js', ''],
  ];

  let scriptTags = '';
  for (const [src, content] of scripts) {
    if (src) {
      scriptTags += `<script src="${src}" crossorigin>` + `<` + `/script>`;
    } else if (content) {
      scriptTags += `<script>` + content + `<` + `/script>`;
    }
  }

  // The Babel script
  const babelScript = `<script type="text/babel" data-presets="react">` + scriptContent + `<` + `/script>`;

  const part3 = `</body></html>`;

  return part1 + scriptTags + part2 + babelScript + part3;
}
