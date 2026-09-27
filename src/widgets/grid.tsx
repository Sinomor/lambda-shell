import GObject from "gi://GObject?version=2.0";
import Gtk from "gi://Gtk?version=4.0";
import {
   appendChild,
   removeChild,
   type Buildable,
   type MaybeAccessor,
   type GnimNode,
} from "gnim";
import { register, property } from "gnim/gobject";

interface GridChildProps {
   col?: MaybeAccessor<number>;
   row?: MaybeAccessor<number>;
   colSpan?: MaybeAccessor<number>;
   rowSpan?: MaybeAccessor<number>;
}

export namespace GridChild {
   export interface ReadableProperties
      extends GObject.Object.ReadableProperties {
      col: number;
      row: number;
      "col-span": number;
      "row-span": number;
   }
}

@register
export class GridChild extends GObject.Object implements Buildable {
   #grid: Gtk.Grid | null = null;
   #child: Gtk.Widget | null = null;
   #signalIds: number[] = [];
   declare $readableProperties: GridChild.ReadableProperties;

   @property col: number = 0;
   @property row: number = 0;
   @property colSpan: number = 1;
   @property rowSpan: number = 1;

   constructor(props?: GridChildProps) {
      super();
      if (typeof props?.col === "number") this.col = props.col;
      if (typeof props?.row === "number") this.row = props.row;
      if (typeof props?.colSpan === "number") this.colSpan = props.colSpan;
      if (typeof props?.rowSpan === "number") this.rowSpan = props.rowSpan;
   }

   get child() {
      return this.#child;
   }

   _mount(grid: Gtk.Grid) {
      this.#grid = grid;

      if (this.#child) {
         grid.attach(
            this.#child,
            this.col,
            this.row,
            this.colSpan,
            this.rowSpan,
         );
      }

      const reattach = () => {
         if (!this.#grid || !this.#child) return;
         this.#grid.remove(this.#child);
         this.#grid.attach(
            this.#child,
            this.col,
            this.row,
            this.colSpan,
            this.rowSpan,
         );
      };

      this.#signalIds = [
         GObject.signal_connect(this, "notify::col", reattach),
         GObject.signal_connect(this, "notify::row", reattach),
         GObject.signal_connect(this, "notify::col-span", reattach),
         GObject.signal_connect(this, "notify::row-span", reattach),
      ];
   }

   _unmount() {
      for (const id of this.#signalIds) this.disconnect(id);
      this.#signalIds = [];

      if (this.#grid && this.#child) {
         this.#grid.remove(this.#child);
      }
      this.#grid = null;
   }

   [appendChild](child: GObject.Object) {
      if (!(child instanceof Gtk.Widget)) return false;

      if (this.#child && this.#grid) {
         this.#grid.remove(this.#child);
      }

      this.#child = child;

      if (this.#grid) {
         this.#grid.attach(
            child,
            this.col,
            this.row,
            this.colSpan,
            this.rowSpan,
         );
      }

      return true;
   }

   [removeChild](child: GObject.Object) {
      if (child !== this.#child) return false;

      if (this.#grid) {
         this.#grid.remove(this.#child!);
      }

      this.#child = null;
      return true;
   }
}

@register
export class Grid extends Gtk.Grid implements Buildable {
   [appendChild](child: GObject.Object) {
      if (!(child instanceof GridChild)) return false;
      child._mount(this);
      return true;
   }

   [removeChild](child: GObject.Object) {
      if (!(child instanceof GridChild)) return false;
      child._unmount();
      return true;
   }
}
