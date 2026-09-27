import GLib from "gi://GLib?version=2.0";
import hljs from "highlight.js/lib/core";
import hljsBash from "highlight.js/lib/languages/bash";
import hljsC from "highlight.js/lib/languages/c";
import hljsCpp from "highlight.js/lib/languages/cpp";
import hljsCss from "highlight.js/lib/languages/css";
import hljsGo from "highlight.js/lib/languages/go";
import hljsJson from "highlight.js/lib/languages/json";
import hljsJs from "highlight.js/lib/languages/javascript";
import hljsPython from "highlight.js/lib/languages/python";
import hljsRust from "highlight.js/lib/languages/rust";
import hljsSql from "highlight.js/lib/languages/sql";
import hljsTs from "highlight.js/lib/languages/typescript";
import hljsXml from "highlight.js/lib/languages/xml";
import hljsYaml from "highlight.js/lib/languages/yaml";
import { config } from "../config";
import { truncateLines } from "./format";
const { syntax } = config.theme;

hljs.registerLanguage("bash", hljsBash);
hljs.registerLanguage("c", hljsC);
hljs.registerLanguage("cpp", hljsCpp);
hljs.registerLanguage("css", hljsCss);
hljs.registerLanguage("go", hljsGo);
hljs.registerLanguage("json", hljsJson);
hljs.registerLanguage("javascript", hljsJs);
hljs.registerLanguage("python", hljsPython);
hljs.registerLanguage("rust", hljsRust);
hljs.registerLanguage("sql", hljsSql);
hljs.registerLanguage("typescript", hljsTs);
hljs.registerLanguage("xml", hljsXml);
hljs.registerLanguage("yaml", hljsYaml);

export interface CodeClassification {
   isCode: boolean;
   languageId: string | null;
}

const CODE_RELEVANCE_THRESHOLD = 3;

export function classifyCode(content: string): CodeClassification {
   const trimmed = content.trim();
   if (trimmed.length < 8) return { isCode: false, languageId: null };

   const slice = trimmed.slice(0, 10000);
   const n = Math.max(1, slice.length / 100);
   const result = hljs.highlightAuto(slice);

   if (result.language && result.relevance / n >= CODE_RELEVANCE_THRESHOLD) {
      return { isCode: true, languageId: result.language };
   }
   return { isCode: false, languageId: null };
}

const HLJS_COLOR_MAP: Record<
   string,
   { color?: string; bold?: boolean; italic?: boolean }
> = {
   "hljs-keyword": { color: syntax.keyword },
   "hljs-template-tag": { color: syntax.keyword },
   "hljs-template-variable": { color: syntax.keyword },
   "hljs-doctag": { color: syntax.keyword },
   "hljs-selector-pseudo": { color: syntax.keyword },
   "hljs-emphasis": { color: syntax.keyword },
   "hljs-variable": { color: syntax.variable },
   "hljs-symbol": { color: syntax.variable },
   "hljs-name": { color: syntax.variable },
   "hljs-selector-tag": { color: syntax.variable },
   "hljs-deletion": { color: syntax.variable },
   "hljs-bullet": { color: syntax.variable },
   "hljs-number": { color: syntax.number },
   "hljs-literal": { color: syntax.number },
   "hljs-attr": { color: syntax.number },
   "hljs-attribute": { color: syntax.number },
   "hljs-selector-attr": { color: syntax.number },
   "hljs-selector-class": { color: syntax.number },
   "hljs-meta": { color: syntax.number },
   "hljs-type": { color: syntax.class },
   "hljs-title class_": { color: syntax.class },
   "hljs-selector-id": { color: syntax.class },
   "hljs-strong": { color: syntax.class },
   "hljs-string": { color: syntax.string },
   "hljs-addition": { color: syntax.string },
   "hljs-code": { color: syntax.string },
   "hljs-regexp": { color: syntax.support },
   "hljs-built_in": { color: syntax.support },
   "hljs-quote": { color: syntax.support },
   "hljs-title": { color: syntax.function },
   "hljs-title function_": { color: syntax.function },
   "hljs-section": { color: syntax.function },
   "hljs-comment": { color: syntax.comment },
   "hljs-formula": { color: syntax.comment },
};

function resolveHljsStyle(classAttr: string) {
   if (HLJS_COLOR_MAP[classAttr]) return HLJS_COLOR_MAP[classAttr];
   const primary = classAttr.split(/\s+/)[0];
   return HLJS_COLOR_MAP[primary] ?? null;
}

function hljsHtmlToPangoMarkup(html: string): string {
   return html.replace(
      /<span class="([^"]+)">/g,
      (_match, classAttr: string) => {
         const style = resolveHljsStyle(classAttr);
         if (!style) return "<span>";
         const attrs: string[] = [];
         if (style.color) attrs.push(`foreground="${style.color}"`);
         if (style.bold) attrs.push(`font_weight="bold"`);
         if (style.italic) attrs.push(`font_style="italic"`);
         return attrs.length ? `<span ${attrs.join(" ")}>` : "<span>";
      },
   );
}

export function highlightMarkup(
   content: string,
   languageId: string,
   maxLines: number,
) {
   const text = truncateLines(content, maxLines);
   try {
      const result = hljs.highlight(text, { language: languageId });
      return hljsHtmlToPangoMarkup(result.value);
   } catch (error) {
      console.error(error);
      return GLib.markup_escape_text(text, -1);
   }
}
