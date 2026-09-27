import { exec, execAsync } from "@gnim-js/io/process";
import GLib from "gi://GLib?version=2.0";

export async function bash(
   strings: TemplateStringsArray | string,
   ...values: unknown[]
): Promise<string> {
   const cmd =
      typeof strings === "string"
         ? strings
         : strings.flatMap((str, i) => str + `${values[i] ?? ""}`).join("");

   return execAsync(["bash", "-c", cmd]).catch((Error) => {
      if (String(Error).includes("Unknown error")) return "";
      console.error(cmd, Error);
      return "";
   });
}

export function dependencies(...bins: string[]): boolean {
   const missing = bins.filter((bin) => {
      try {
         exec(["which", bin]);
         return false;
      } catch {
         return true;
      }
   });

   if (missing.length > 0) {
      console.warn(`Missing dependencies: ${missing.join(", ")}`);
   }

   return missing.length === 0;
}
