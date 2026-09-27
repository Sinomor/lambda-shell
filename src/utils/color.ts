function hexToHsl(hex: string): [number, number, number] {
   const r = parseInt(hex.slice(1, 3), 16) / 255;
   const g = parseInt(hex.slice(3, 5), 16) / 255;
   const b = parseInt(hex.slice(5, 7), 16) / 255;

   const max = Math.max(r, g, b);
   const min = Math.min(r, g, b);
   const l = (max + min) / 2;

   if (max === min) return [0, 0, l * 100];

   const d = max - min;
   const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

   let h: number;
   switch (max) {
      case r:
         h = (g - b) / d + (g < b ? 6 : 0);
         break;
      case g:
         h = (b - r) / d + 2;
         break;
      default:
         h = (r - g) / d + 4;
         break;
   }
   h *= 60;

   return [h, s * 100, l * 100];
}

function clamp(v: number, min: number, max: number): number {
   return Math.min(max, Math.max(min, v));
}

function hslToHex(h: number, s: number, l: number): string {
   s /= 100;
   l /= 100;

   const c = (1 - Math.abs(2 * l - 1)) * s;
   const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
   const m = l - c / 2;

   let [r, g, b] = [0, 0, 0];
   if (h < 60) [r, g, b] = [c, x, 0];
   else if (h < 120) [r, g, b] = [x, c, 0];
   else if (h < 180) [r, g, b] = [0, c, x];
   else if (h < 240) [r, g, b] = [0, x, c];
   else if (h < 300) [r, g, b] = [x, 0, c];
   else [r, g, b] = [c, 0, x];

   const toHex = (v: number) =>
      Math.round(clamp(v + m, 0, 1) * 255)
         .toString(16)
         .padStart(2, "0");

   return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function scale(hex: string, percent: number): string {
   const [h, s, l] = hexToHsl(hex);
   const bound = percent >= 0 ? 100 - l : l;
   const newL = l + bound * (percent / 100);
   return hslToHex(h, s, clamp(newL, 0, 100));
}
