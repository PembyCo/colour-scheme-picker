import React, { useState, useMemo, useCallback } from "react";
import { Button } from "react-aria-components";
import { HexColorPicker, HexColorInput, RgbColorPicker } from "react-colorful";

// Types for color management
interface Color {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
}

const App: React.FC = () => {
  const [baseColor, setBaseColor] = useState<string>("#4f46e5");
  const [error, setError] = useState<string>("");

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
      tones: [
        hslToHex(h, s, Math.max(10, l - 30)),
        hslToHex(h, s, Math.max(20, l - 10)),
        hslToHex(h, s, l + 10),
        hslToHex(h, s, l + 30),
      ],
      complementary: hslToHex((h + 180) % 360, s, l),
      analogous: [
        hslToHex((h + 30) % 360, s, l),
        hslToHex((h + 330) % 360, s, l),
      ],
      triadic: [
        hslToHex((h + 120) % 360, s, l),
        hslToHex((h + 240) % 360, s, l),
      ],
    };
  }, [colorData]);

  // Handle color input validation
  const handleColorChange = useCallback((value: string) => {
    const hexRegex = /^#?[0-9A-Fa-f]{6}$/;
    if (hexRegex.test(value)) {
      setBaseColor(value.startsWith("#") ? value : `#${value}`);
      setError("");
    } else {
      setError("Invalid hex color. Use format #RRGGBB");
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
      setBaseColor(hslToHex(newHsl.h, newHsl.s, newHsl.l));
    },
    [colorData]
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
          Color Palette Generator
        </h1>

        {/* Base Color Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Pick Base Color</h2>
            <div className="flex flex-col gap-4">
              <HexColorPicker
                className="w-full"
                onChange={setBaseColor}
                aria-label="Color picker"
              />
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hex Color
                  </label>
                  <HexColorInput
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                    value={baseColor}
                    onChange={handleColorChange}
                    aria-invalid={!!error}
                    aria-describedby={error ? "hex-error" : undefined}
                  />
                  {error && (
                    <p id="hex-error" className="text-red-500 text-sm mt-1">
                      {error}
                    </p>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RGB Color
                  </label>
                  <RgbColorPicker
                    className="w-full"
                    onChange={(rgb) => {
                      const hex = `#${rgb.r
                        .toString(16)
                        .padStart(2, "0")}${rgb.g
                        .toString(16)
                        .padStart(2, "0")}${rgb.b
                        .toString(16)
                        .padStart(2, "0")}`;
                      setBaseColor(hex);
                      setError("");
                    }}
                    aria-label="RGB picker"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* HSL Adjustments */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Adjust Color</h2>
            <div className="space-y-4">
              {["h", "s", "l"].map((type) => (
                <div key={type} className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 capitalize">
                    {type === "h"
                      ? "Hue"
                      : type === "s"
                      ? "Saturation"
                      : "Lightness"}
                    : {colorData.hsl[type as keyof typeof colorData.hsl]}
                  </label>
                  <input
                    type="range"
                    min={type === "h" ? 0 : 0}
                    max={type === "h" ? 360 : 100}
                    value={colorData.hsl[type as keyof typeof colorData.hsl]}
                    onChange={(e) =>
                      adjustHsl(
                        type as "h" | "s" | "l",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full"
                    aria-label={`${type} slider`}
                  />
                </div>
              ))}
              <div
                className="w-full h-24 rounded-md border"
                style={{ backgroundColor: baseColor }}
                role="img"
                aria-label={`Base color preview: ${baseColor}`}
              />
            </div>
          </div>
        </div>

        {/* Generated Palette */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-6">Generated Palette</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* Tones */}
            <div>
              <h3 className="text-lg font-medium mb-2">Tones</h3>
              <div className="space-y-2">
                {palette.tones.map((color, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2"
                    role="img"
                    aria-label={`Tone ${i + 1}: ${color}`}
                  >
                    <div
                      className="w-12 h-12 rounded-md border"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-gray-700">{color}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Complementary */}
            <div>
              <h3 className="text-lg font-medium mb-2">Complementary</h3>
              <div
                className="flex items-center gap-2"
                role="img"
                aria-label={`Complementary color: ${palette.complementary}`}
              >
                <div
                  className="w-12 h-12 rounded-md border"
                  style={{ backgroundColor: palette.complementary }}
                />
                <span className="text-sm text-gray-700">
                  {palette.complementary}
                </span>
              </div>
            </div>

            {/* Analogous */}
            <div>
              <h3 className="text-lg font-medium mb-2">Analogous</h3>
              <div className="space-y-2">
                {palette.analogous.map((color, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2"
                    role="img"
                    aria-label={`Analogous ${i + 1}: ${color}`}
                  >
                    <div
                      className="w-12 h-12 rounded-md border"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-gray-700">{color}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Triadic */}
            <div>
              <h3 className="text-lg font-medium mb-2">Triadic</h3>
              <div className="space-y-2">
                {palette.triadic.map((color, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2"
                    role="img"
                    aria-label={`Triadic ${i + 1}: ${color}`}
                  >
                    <div
                      className="w-12 h-12 rounded-md border"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-gray-700">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
