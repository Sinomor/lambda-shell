import { scale } from "./utils/color";

export const config = {
   app: {
      id: "io.github.LambdaShell",
      name: "Lambda Shell",
   },
   theme: {
      palette: {
         base00: "#1D1D20",
         base01: "#28282C",
         base02: "#36363A",
         base03: "#48484B",
         base04: "#808080",
         base05: "#C0C0C0",
         base06: "#ffffff",
         base07: "#ffffff",
         base08: "#e62d42",
         base09: "#ed5b00",
         base0A: "#c88800",
         base0B: "#3a944a",
         base0C: "#2190a4",
         base0D: "#3584e4",
         base0E: "#9141ac",
         base0F: "#ffffff",
      },
      colors: {
         bg: {
            get 0() {
               return config.theme.palette.base00;
            },
            get 1() {
               return config.theme.palette.base01;
            },
            get 2() {
               return config.theme.palette.base02;
            },
            get 3() {
               return config.theme.palette.base03;
            },
         },
         fg: {
            get 0() {
               return config.theme.palette.base06;
            },
            get 1() {
               return config.theme.palette.base05;
            },
            get 2() {
               return config.theme.palette.base04;
            },
         },
         get red() {
            return config.theme.palette.base08;
         },
         get redLight() {
            return scale(this.red, 25);
         },
         get redDark() {
            return scale(this.red, -25);
         },
         get orange() {
            return config.theme.palette.base09;
         },
         get orangeLight() {
            return scale(this.orange, 25);
         },
         get yellow() {
            return config.theme.palette.base0A;
         },
         get yellowLight() {
            return scale(this.yellow, 25);
         },
         get green() {
            return config.theme.palette.base0B;
         },
         get greenLight() {
            return scale(this.green, 25);
         },
         get cyan() {
            return config.theme.palette.base0C;
         },
         get cyanLight() {
            return scale(this.cyan, 25);
         },
         get blue() {
            return config.theme.palette.base0D;
         },
         get blueLight() {
            return scale(this.blue, 25);
         },
         get purple() {
            return config.theme.palette.base0E;
         },
         get purpleLight() {
            return scale(this.purple, 25);
         },
         get accent() {
            return this.purple;
         },
         get accentLight() {
            return this.purpleLight;
         },
      },
      syntax: {
         get keyword() {
            return config.theme.colors.purpleLight;
         },
         get variable() {
            return config.theme.colors.redLight;
         },
         get number() {
            return config.theme.colors.orangeLight;
         },
         get class() {
            return config.theme.colors.yellowLight;
         },
         get string() {
            return config.theme.colors.greenLight;
         },
         get support() {
            return config.theme.colors.cyanLight;
         },
         get function() {
            return config.theme.colors.blueLight;
         },
         get comment() {
            return config.theme.colors.fg[2];
         },
      },
      border: {
         width: 1,
         get color() {
            return config.theme.colors.bg[2];
         },
         get css() {
            return `${this.width}px solid ${this.color}`;
         },
      },
      outline: {
         width: 1,
         get color() {
            return config.theme.colors.fg[0];
         },
         get css() {
            return `${this.width}px solid ${this.color}`;
         },
      },
   },
   transition: {
      duration: 300,
      type: "ease",
      get css() {
         return `none ${this.duration}ms ${this.type}`;
      },
   },
   layout: {
      spacing: 10,
      bar: {
         padding: 6,
         spacing: 6,
         size: 44,
      },
      sidebar: {
         size: 355,
         padding: 15,
      },
   },
   behavior: {
      clipboard: {
         maxEntries: 50,
         imagePreviewSize: 480,
         maxTextLines: 3,
         maxCodeLines: 12,
      },
      notifications: {
         timeout: 5000,
      },
      osd: {
         timeout: 3000,
      },
   },
} as const;

export type Config = typeof config;
export const { theme, layout, transition, behavior } = config;
