import React, { useState, useMemo, useCallback } from "react";
import { Button } from "react-aria-components";
import { HexColorPicker } from "react-colorful";
import "./styles.css";

// Types for color management
interface Color {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
}

// RGB string to RGB object converter
const parseRgb = (rgb: string): { r: number; g: number; b: number } | null => {
  const matches = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!matches) return null;
  return {
    r: parseInt(matches[1], 10),
    g: parseInt(matches[2], 10),
    b: parseInt(matches[3], 10)
  };
};

const App: React.FC = () => {
  const [baseColor, setBaseColor] = useState<string>("#4f46e5");
  const [rgbInput, setRgbInput] = useState<string>("79, 70, 229");
  const [error, setError] = useState<string>("");
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Toggle card export section
  const toggleCardExport = useCallback((cardTitle: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardTitle]: !prev[cardTitle]
    }));
  }, []);

  // Convert hex to RGB and HSL for palette calculations
  const colorData = useMemo(() => {
    const hex = baseColor.startsWith("#") ? baseColor : `#${baseColor}`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    // RGB to HSL conversion
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    let h = 0;
    const l = (max + min) / 2;
    const s = max === min ? 0 : ((max - min) / (1 - Math.abs(2 * l - 1))) * 100;

    if (max !== min) {
      if (max === rNorm) h = ((gNorm - bNorm) / (max - min)) * 60;
      if (max === gNorm) h = 2 + ((bNorm - rNorm) / (max - min)) * 60;
      if (max === bNorm) h = 4 + ((rNorm - gNorm) / (max - min)) * 60;
      if (h < 0) h += 360;
    }

    return {
      hex,
      rgb: { r, g, b },
      hsl: { h, s: Math.round(s), l: Math.round(l * 100) },
    } as Color;
  }, [baseColor]);

  // Generate palette based on base color
  const palette = useMemo(() => {
    const hslToHex = (h: number, s: number, l: number): string => {
      l /= 100;
      const c = (1 - Math.abs(2 * l - 1)) * (s / 100);
      const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
      const m = l - c / 2;
      let r = 0,
        g = 0,
        b = 0;
      if (h < 60) {
        r = c;
        g = x;
        b = 0;
      } else if (h < 120) {
        r = x;
        g = c;
        b = 0;
      } else if (h < 180) {
        r = 0;
        g = c;
        b = x;
      } else if (h < 240) {
        r = 0;
        g = x;
        b = c;
      } else if (h < 300) {
        r = x;
        g = 0;
        b = c;
      } else {
        r = c;
        g = 0;
        b = x;
      }
      const toHex = (v: number) =>
        Math.round((v + m) * 255)
          .toString(16)
          .padStart(2, "0");
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };

    const { h, s, l } = colorData.hsl;
    return {
      // Monochromatic - variations of the same hue with different lightness/saturation
      monochromatic: [
        { name: "Dark", color: hslToHex(h, s, Math.max(10, l - 30)) },
        { name: "Medium Dark", color: hslToHex(h, s, Math.max(20, l - 15)) },
        { name: "Base", color: colorData.hex },
        { name: "Medium Light", color: hslToHex(h, s, Math.min(90, l + 15)) },
        { name: "Light", color: hslToHex(h, s, Math.min(95, l + 30)) },
      ],
      // Complementary - colors opposite on the color wheel
      complementary: { 
        name: "Complementary", 
        color: hslToHex((h + 180) % 360, s, l) 
      },
      // Analogous - colors adjacent on the color wheel
      analogous: [
        { name: "Analogous 1", color: hslToHex((h + 30) % 360, s, l) },
        { name: "Analogous 2", color: hslToHex((h + 330) % 360, s, l) },
      ],
      // Triadic - three colors evenly spaced on the color wheel
      triadic: [
        { name: "Triadic 1", color: hslToHex((h + 120) % 360, s, l) },
        { name: "Triadic 2", color: hslToHex((h + 240) % 360, s, l) },
      ],
      // Split Complementary - base color + two colors adjacent to its complement
      splitComplementary: [
        { name: "Split Comp 1", color: hslToHex((h + 150) % 360, s, l) },
        { name: "Split Comp 2", color: hslToHex((h + 210) % 360, s, l) },
      ],
      // Tetradic - four colors evenly spaced on the color wheel
      tetradic: [
        { name: "Tetradic 1", color: hslToHex((h + 90) % 360, s, l) },
        { name: "Tetradic 2", color: hslToHex((h + 180) % 360, s, l) },
        { name: "Tetradic 3", color: hslToHex((h + 270) % 360, s, l) },
      ],
      // Contrasting - high contrast by varying saturation and lightness
      contrasting: [
        { name: "Contrasting 1", color: hslToHex(h, Math.min(100, s + 20), Math.max(30, l - 20)) },
        { name: "Contrasting 2", color: hslToHex((h + 180) % 360, Math.min(100, s + 20), Math.min(85, l + 15)) },
      ]
    };
  }, [colorData]);

  // Handle color input validation
  const handleHexChange = useCallback((value: string) => {
    const hexRegex = /^#?[0-9A-Fa-f]{6}$/;
    if (hexRegex.test(value)) {
      const newHex = value.startsWith("#") ? value : `#${value}`;
      setBaseColor(newHex);
      
      // Update RGB input
      const r = parseInt(newHex.slice(1, 3), 16);
      const g = parseInt(newHex.slice(3, 5), 16);
      const b = parseInt(newHex.slice(5, 7), 16);
      setRgbInput(`${r}, ${g}, ${b}`);
      
      setError("");
    } else {
      setError("Invalid hex color. Use format #RRGGBB");
    }
  }, []);

  // Handle RGB input change
  const handleRgbChange = useCallback((value: string) => {
    const rgbRegex = /^(\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})$/;
    const match = value.match(rgbRegex);
    
    if (match) {
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);
      
      if (r <= 255 && g <= 255 && b <= 255) {
        setRgbInput(value);
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        setBaseColor(hex);
        setError("");
      } else {
        setError("RGB values must be between 0-255");
      }
    } else {
      setError("Invalid RGB format. Use: r, g, b");
    }
  }, []);

  // Adjust HSL values with sliders
  const adjustHsl = useCallback(
    (type: "h" | "s" | "l", value: number) => {
      const hsl = colorData.hsl;
      const newHsl = { ...hsl, [type]: value };
      const hslToHex = (h: number, s: number, l: number) => {
        l /= 100;
        s /= 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = l - c / 2;
        const rgb = [0, 0, 0];
        if (h < 60) (rgb[0] = c), (rgb[1] = x);
        else if (h < 120) (rgb[0] = x), (rgb[1] = c);
        else if (h < 180) (rgb[1] = c), (rgb[2] = x);
        else if (h < 240) (rgb[1] = x), (rgb[2] = c);
        else if (h < 300) (rgb[0] = x), (rgb[2] = c);
        else (rgb[0] = c), (rgb[2] = x);
        return `#${rgb
          .map((v) =>
            Math.round((v + m) * 255)
              .toString(16)
              .padStart(2, "0")
          )
          .join("")}`;
      };
      const newHex = hslToHex(newHsl.h, newHsl.s, newHsl.l);
      setBaseColor(newHex);
      
      // Update RGB input
      const r = parseInt(newHex.slice(1, 3), 16);
      const g = parseInt(newHex.slice(3, 5), 16);
      const b = parseInt(newHex.slice(5, 7), 16);
      setRgbInput(`${r}, ${g}, ${b}`);
    },
    [colorData]
  );

  // Copy color to clipboard
  const copyToClipboard = useCallback((color: string) => {
    navigator.clipboard.writeText(color).then(() => {
      setCopiedColor(color);
      setTimeout(() => setCopiedColor(null), 1500);
    });
  }, []);

  // Pill-shaped color swatch component
  const ColorSwatch = ({ 
    color, 
    name, 
    schemeColors = [] 
  }: { 
    color: string; 
    name: string; 
    schemeColors?: string[];
  }) => {
    const isCopied = copiedColor === color;
    
    // Find a contrasting color from the scheme for the gradient
    const gradientColor = schemeColors.length > 1 
      ? schemeColors.find(c => c !== color) || schemeColors[0]
      : color;
    
    return (
      <div className="flex flex-col items-center mb-3 md:mb-4" style={{ width: "80px" }}>
        {/* The base pill */}
        <div 
          style={{ 
            width: "42px", 
            height: "100px", 
            borderRadius: "21px",
            backgroundColor: color,
            border: "1px solid rgba(0,0,0,0.1)",
            marginBottom: "10px"
          }}
          className="md:w-[48px] md:h-[112px] md:rounded-[24px] md:mb-3"
        />
        
        {/* Hex code and copy button */}
        <div className="flex items-center gap-1 mb-2 md:mb-3">
          <div className="text-xs font-mono">{color}</div>
          <button
            onClick={() => copyToClipboard(color)}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label={`Copy ${color} to clipboard`}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={isCopied ? "text-green-500" : "text-gray-500"}
            >
              {isCopied ? (
                <path d="M20 6L9 17l-5-5" />
              ) : (
                <>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </>
              )}
            </svg>
          </button>
        </div>
        
        {/* The linear gradient circle at the bottom */}
        <div 
          style={{ 
            width: "42px", 
            height: "42px", 
            borderRadius: "50%",
            background: `linear-gradient(to bottom right, ${color}, ${gradientColor})`,
            opacity: 0.7
          }}
          className="md:w-[48px] md:h-[48px]"
        />
      </div>
    );
  };

  // Color scheme card component
  const ColorSchemeCard = ({ 
    title, 
    colors
  }: { 
    title: string; 
    colors: { name: string; color: string }[] | { name: string; color: string };
  }) => {
    // Convert to array if it's a single object
    const colorArray = Array.isArray(colors) ? colors : [colors];
    // Get all colors in this scheme for gradients
    const allSchemeColors = colorArray.map(c => c.color);
    
    // Check if this card is expanded
    const isExpanded = expandedCards[title] || false;
    
    // Generate CSS and Tailwind code for this color scheme
    const cssCode = colorArray.map(c => `  --color-${c.name.toLowerCase().replace(/\s/g, '-')}: ${c.color};`).join('\n');
    
    const tailwindCode = colorArray.map(c => {
      const colorName = c.name.toLowerCase().replace(/\s/g, '-');
      return colorName === 'base' 
        ? `          DEFAULT: '${c.color}',` 
        : `          ${colorName}: '${c.color}',`;
    }).join('\n');
    
    return (
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">{title}</h3>
          <button
            onClick={() => toggleCardExport(title)}
            className="text-sm text-indigo-600 hover:text-indigo-800"
            aria-expanded={isExpanded}
          >
            {isExpanded ? "Hide Export" : "Show Export"}
          </button>
        </div>
        
        <div className="flex flex-wrap justify-center gap-2 md:gap-4">
          {colorArray.map((color, i) => (
            <ColorSwatch 
              key={i} 
              color={color.color} 
              name={color.name}
              schemeColors={allSchemeColors}
            />
          ))}
          
          {/* Add base color if it's not already included */}
          {!colorArray.some(c => c.color === baseColor) && title !== "Monochromatic" && (
            <ColorSwatch 
              color={baseColor} 
              name="Base"
              schemeColors={[baseColor, ...allSchemeColors]} 
            />
          )}
        </div>
        
        {/* Export section - shown only when expanded */}
        {isExpanded && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-2">CSS Variables</h4>
                <div className="bg-gray-100 p-2 md:p-3 rounded-md font-mono text-xs overflow-x-auto">
                  <pre>{`:root {\n${cssCode}\n}`}</pre>
                </div>
                <button
                  onClick={() => copyToClipboard(`:root {\n${cssCode}\n}`)}
                  className="px-2 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors mt-2 text-xs"
                >
                  Copy CSS
                </button>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Tailwind Config</h4>
                <div className="bg-gray-100 p-2 md:p-3 rounded-md font-mono text-xs overflow-x-auto">
                  <pre>{`// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        ${title.toLowerCase()}: {
${tailwindCode}
        }
      }
    }
  }
}`}</pre>
                </div>
                <button
                  onClick={() => copyToClipboard(`// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        ${title.toLowerCase()}: {
${tailwindCode}
        }
      }
    }
  }
}`)}
                  className="px-2 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors mt-2 text-xs"
                >
                  Copy Tailwind
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-2 md:p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-6">
          Color Palette Generator
        </h1>

        {/* Base Color Selection and Adjustment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Combined card on mobile, separate on desktop */}
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md order-1 md:order-1 w-full">
            <h2 className="text-xl font-semibold mb-4">Pick Base Color</h2>
            <div className="flex flex-col gap-3 md:gap-4 w-full">
              <div className="w-full">
                <HexColorPicker
                  color={baseColor}
                  onChange={handleHexChange}
                  aria-label="Color picker"
                  className="w-full"
                />
              </div>
              <div className="flex flex-col gap-3 md:gap-4 mt-3 md:mt-4">
                <div>
                  <label htmlFor="hex-input" className="block text-sm font-medium text-gray-700 mb-1">
                    Hex Color
                  </label>
                  <div className="flex">
                    <input
                      id="hex-input"
                      type="text"
                      className="flex-1 p-2 border rounded-l-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={baseColor}
                      onChange={(e) => handleHexChange(e.target.value)}
                      aria-invalid={!!error}
                      aria-describedby={error ? "hex-error" : undefined}
                    />
                    <button 
                      onClick={() => copyToClipboard(baseColor)}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-r-md border-y border-r"
                      aria-label={`Copy ${baseColor} to clipboard`}
                    >
                      {copiedColor === baseColor ? "✓" : "Copy"}
                    </button>
                  </div>
                  {error && (
                    <p id="hex-error" className="text-red-500 text-sm mt-1">
                      {error}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="rgb-input" className="block text-sm font-medium text-gray-700 mb-1">
                    RGB Color
                  </label>
                  <div className="flex">
                    <input
                      id="rgb-input"
                      type="text"
                      className="flex-1 p-2 border rounded-l-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={rgbInput}
                      onChange={(e) => handleRgbChange(e.target.value)}
                      placeholder="r, g, b"
                      aria-invalid={!!error}
                    />
                    <button 
                      onClick={() => copyToClipboard(`rgb(${rgbInput})`)}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-r-md border-y border-r"
                      aria-label={`Copy rgb(${rgbInput}) to clipboard`}
                    >
                      {copiedColor === `rgb(${rgbInput})` ? "✓" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Add Adjust Color on mobile only */}
            <div className="mt-6 md:hidden">
              <h2 className="text-xl font-semibold mb-3">Adjust Color</h2>
              <div className="space-y-3">
                {[
                  { key: "h", label: "Hue", max: 360 },
                  { key: "s", label: "Saturation", max: 100 },
                  { key: "l", label: "Lightness", max: 100 }
                ].map(({ key, label, max }) => (
                  <div key={key} className="flex flex-col">
                    <label htmlFor={`${key}-slider-mobile`} className="text-sm font-medium text-gray-700 flex justify-between">
                      <span>{label}</span>
                      <span>{colorData.hsl[key as keyof typeof colorData.hsl]}</span>
                    </label>
                    <input
                      id={`${key}-slider-mobile`}
                      type="range"
                      min={0}
                      max={max}
                      value={colorData.hsl[key as keyof typeof colorData.hsl]}
                      onChange={(e) => adjustHsl(key as "h" | "s" | "l", parseInt(e.target.value))}
                      className="w-full"
                      aria-label={`${label} slider`}
                    />
                  </div>
                ))}
                <div className="mt-4">
                  <div className="flex justify-center w-full">
                    {/* Special rectangular display for the Adjust Color section */}
                    <div className="flex flex-col items-center w-full">
                      <div 
                        style={{ 
                          width: "100%", 
                          height: "100px", 
                          borderRadius: "12px",
                          backgroundColor: baseColor,
                          border: "1px solid rgba(0,0,0,0.1)",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          marginBottom: "10px"
                        }}
                      />
                      <div className="flex items-center gap-1">
                        <div className="text-xs font-mono">{baseColor}</div>
                        <button
                          onClick={() => copyToClipboard(baseColor)}
                          className="p-1 rounded-full hover:bg-gray-100"
                          aria-label={`Copy ${baseColor} to clipboard`}
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="14" 
                            height="14" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            className={copiedColor === baseColor ? "text-green-500" : "text-gray-500"}
                          >
                            {copiedColor === baseColor ? (
                              <path d="M20 6L9 17l-5-5" />
                            ) : (
                              <>
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </>
                            )}
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HSL Adjustments - Only visible on desktop */}
          <div className="bg-white p-6 rounded-lg shadow-md order-2 md:order-2 hidden md:block">
            <h2 className="text-xl font-semibold mb-4">Adjust Color</h2>
            <div className="space-y-4">
              {[
                { key: "h", label: "Hue", max: 360 },
                { key: "s", label: "Saturation", max: 100 },
                { key: "l", label: "Lightness", max: 100 }
              ].map(({ key, label, max }) => (
                <div key={key} className="flex flex-col">
                  <label htmlFor={`${key}-slider`} className="text-sm font-medium text-gray-700 flex justify-between">
                    <span>{label}</span>
                    <span>{colorData.hsl[key as keyof typeof colorData.hsl]}</span>
                  </label>
                  <input
                    id={`${key}-slider`}
                    type="range"
                    min={0}
                    max={max}
                    value={colorData.hsl[key as keyof typeof colorData.hsl]}
                    onChange={(e) => adjustHsl(key as "h" | "s" | "l", parseInt(e.target.value))}
                    className="w-full"
                    aria-label={`${label} slider`}
                  />
                </div>
              ))}
              <div className="mt-6">
                <div className="flex justify-center w-full">
                  {/* Special rectangular display for the Adjust Color section */}
                  <div className="flex flex-col items-center w-full">
                    <div 
                      style={{ 
                        width: "100%", 
                        height: "120px", 
                        borderRadius: "12px",
                        backgroundColor: baseColor,
                        border: "1px solid rgba(0,0,0,0.1)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        marginBottom: "12px"
                      }}
                    />
                    <div className="flex items-center gap-1">
                      <div className="text-xs font-mono">{baseColor}</div>
                      <button
                        onClick={() => copyToClipboard(baseColor)}
                        className="p-1 rounded-full hover:bg-gray-100"
                        aria-label={`Copy ${baseColor} to clipboard`}
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="14" 
                          height="14" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          className={copiedColor === baseColor ? "text-green-500" : "text-gray-500"}
                        >
                          {copiedColor === baseColor ? (
                            <path d="M20 6L9 17l-5-5" />
                          ) : (
                            <>
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Generated Palette */}
        <div className="mt-6 md:mt-8">
          <h2 className="text-2xl font-semibold mb-4 md:mb-6">Generated Color Schemes</h2>
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            {/* Monochromatic */}
            <ColorSchemeCard 
              title="Monochromatic" 
              colors={palette.monochromatic}
            />

            {/* Complementary */}
            <ColorSchemeCard 
              title="Complementary" 
              colors={[{ name: "Base", color: baseColor }, palette.complementary]}
            />

            {/* Analogous */}
            <ColorSchemeCard 
              title="Analogous" 
              colors={[...palette.analogous]}
            />

            {/* Triadic */}
            <ColorSchemeCard 
              title="Triadic" 
              colors={[...palette.triadic]}
            />

            {/* Split Complementary */}
            <ColorSchemeCard 
              title="Split Complementary" 
              colors={[...palette.splitComplementary]}
            />

            {/* Tetradic */}
            <ColorSchemeCard 
              title="Tetradic" 
              colors={[...palette.tetradic]}
            />

            {/* Contrasting */}
            <ColorSchemeCard 
              title="Contrasting" 
              colors={[...palette.contrasting]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App; 