import Gtk from "gi://Gtk?version=4.0";
import Gdk from "gi://Gdk?version=4.0";
import GObject from "gi://GObject?version=2.0";
import Graphene from "gi://Graphene?version=1.0";
import Gsk from "gi://Gsk?version=4.0";
import { register, property, signal } from "gnim/gobject";
import { appendChild, removeChild, type Buildable } from "gnim";

const enum AnimState {
   SHOWN,
   HIDDEN,
   ANIMATING_IN,
   ANIMATING_OUT,
}

function ease(t: number): number {
   return 1 - (1 - t) ** 3;
}
function easeInverse(y: number): number {
   return 1 - (1 - y) ** (1 / 3);
}

export namespace Reveal {
   export interface SignalSignatures extends Gtk.Widget.SignalSignatures {
      hidden(): void;
      shown(): void;
   }
   export interface ReadableProperties extends Gtk.Widget.ReadableProperties {
      "reveal-child": boolean;
      "transition-duration": number;
      "translate-x": number;
      "translate-y": number;
      "start-scale": number;
      "start-opacity": number;
      "origin-x": number;
      "origin-y": number;
   }
   export interface WritableProperties extends Gtk.Widget.WritableProperties {
      "reveal-child": boolean;
      "transition-duration": number;
      "translate-x": number;
      "translate-y": number;
      "start-scale": number;
      "start-opacity": number;
      "origin-x": number;
      "origin-y": number;
   }
}

@register({ GTypeName: "Reveal" })
export class Reveal extends Gtk.Widget implements Buildable {
   private _child: Gtk.Widget | null = null;

   private _state: AnimState = AnimState.HIDDEN;
   private _progress = 0;
   private _lastFrameTime = 0;
   private _tickId = 0;

   private _revealChild = false;

   declare readonly $signals: Reveal.SignalSignatures;
   declare readonly $readableProperties: Reveal.ReadableProperties;
   declare readonly $writableProperties: Reveal.WritableProperties;

   constructor(props: Partial<GObject.ConstructorProps<Reveal>>) {
      super(props);
      // филд-инициализаторы @property выполняются после super() и перезаписывают
      // значения из словаря конструктора — возвращаем их вручную
      if (typeof props?.transitionDuration === "number")
         this.transitionDuration = props.transitionDuration;
      if (typeof props?.translateX === "number")
         this.translateX = props.translateX;
      if (typeof props?.translateY === "number")
         this.translateY = props.translateY;
      if (typeof props?.startScale === "number")
         this.startScale = props.startScale;
      if (typeof props?.startOpacity === "number")
         this.startOpacity = props.startOpacity;
      if (typeof props?.originX === "number") this.originX = props.originX;
      if (typeof props?.originY === "number") this.originY = props.originY;
      if (typeof props?.revealChild === "boolean")
         this.revealChild = props.revealChild;
   }

   @property
   get revealChild(): boolean {
      return this._revealChild;
   }
   set revealChild(value: boolean) {
      if (this._revealChild === value) return;
      this._revealChild = value;
      this.notify("reveal-child");
      this._transition(value);
   }

   /** Длительность анимации, мс. */
   @property transitionDuration: number = 250;
   /** Смещение ребёнка по X в скрытом состоянии, px. */
   @property translateX: number = 0;
   /** Смещение ребёнка по Y в скрытом состоянии, px. */
   @property translateY: number = 8;
   /** Масштаб в скрытом состоянии (1 = без масштабирования). */
   @property startScale: number = 0.97;
   /** Непрозрачность в скрытом состоянии, 0..1. */
   @property startOpacity: number = 0;
   /** Точка масштабирования: доля ширины ребёнка (0 = слева, 1 = справа). */
   @property originX: number = 0.5;
   /** Точка масштабирования: доля высоты ребёнка (0 = сверху, 1 = снизу). */
   @property originY: number = 0.5;

   /** Анимация скрытия полностью завершена. */
   @signal hidden(): void {}
   /** Анимация появления полностью завершена. */
   @signal shown(): void {}

   // ---------- Buildable (gnim) ----------

   [appendChild](child: GObject.Object): boolean {
      if (child instanceof Gtk.Widget) {
         this._setChild(child);
         return true;
      }
      return false;
   }

   [removeChild](child: GObject.Object): boolean {
      if (child === this._child) {
         this._child.unparent();
         this._child = null;
         return true;
      }
      return false;
   }

   private _setChild(child: Gtk.Widget | null) {
      if (this._child === child) return;
      this._child?.unparent();
      this._child = child;
      if (child) {
         child.set_parent(this);
         child.set_child_visible(this._state !== AnimState.HIDDEN);
      }
      this.queue_resize();
   }

   // ---------- состояние ----------

   private _transition(reveal: boolean) {
      if (reveal) {
         if (
            this._state === AnimState.SHOWN ||
            this._state === AnimState.ANIMATING_IN
         )
            return;
      } else {
         if (
            this._state === AnimState.HIDDEN ||
            this._state === AnimState.ANIMATING_OUT
         )
            return;
      }

      const reversing =
         this._state === AnimState.ANIMATING_IN ||
         this._state === AnimState.ANIMATING_OUT;

      // разворот посреди анимации без визуального скачка
      this._progress = reversing ? easeInverse(1 - ease(this._progress)) : 0;

      if (reveal && this._state === AnimState.HIDDEN) {
         this._child?.set_child_visible(true);
      }

      this._state = reveal ? AnimState.ANIMATING_IN : AnimState.ANIMATING_OUT;

      if (this._tickId === 0) {
         this._lastFrameTime = 0;
         this._tickId = this.add_tick_callback(this._onTick.bind(this));
      }
      this.queue_draw();
   }

   private _onTick(_w: Gtk.Widget, clock: Gdk.FrameClock): boolean {
      if (
         this._state !== AnimState.ANIMATING_IN &&
         this._state !== AnimState.ANIMATING_OUT
      ) {
         this._tickId = 0;
         return false;
      }

      const now = clock.get_frame_time();
      if (this._lastFrameTime === 0) this._lastFrameTime = now;
      const dt = (now - this._lastFrameTime) / 1_000_000;
      this._lastFrameTime = now;

      const dur = Math.max(this.transitionDuration, 1) / 1000;
      this._progress = Math.min(1, this._progress + dt / dur);

      if (this._progress >= 1) {
         this._tickId = 0;
         const shown = this._state === AnimState.ANIMATING_IN;
         this._state = shown ? AnimState.SHOWN : AnimState.HIDDEN;
         if (shown) {
            this.shown();
         } else {
            this._child?.set_child_visible(false);
            this.hidden();
         }
         this.queue_draw();
         return false;
      }

      this.queue_draw(); // только растеризация, без relayout
      return true;
   }

   private _cancelTick() {
      if (this._tickId !== 0) {
         this.remove_tick_callback(this._tickId);
         this._tickId = 0;
      }
   }

   // ---------- layout / рендер ----------

   override vfunc_measure(
      orientation: Gtk.Orientation,
      forSize: number,
   ): [number, number, number, number] {
      if (!this._child) return [0, 0, -1, -1];
      return this._child.measure(orientation, forSize);
   }

   override vfunc_size_allocate(
      width: number,
      height: number,
      baseline: number,
   ) {
      this._child?.allocate(width, height, baseline, null);
   }

   override vfunc_snapshot(snapshot: Gtk.Snapshot) {
      if (!this._child || this._state === AnimState.HIDDEN) return;

      if (this._state === AnimState.SHOWN) {
         this.snapshot_child(this._child, snapshot);
         return;
      }

      const eased = ease(this._progress);
      // factor: 0 = показан, 1 = скрыт
      const factor = this._state === AnimState.ANIMATING_IN ? 1 - eased : eased;

      const alloc = this._child.get_allocation();
      const ox = alloc.width * this.originX;
      const oy = alloc.height * this.originY;

      const tx = this.translateX * factor;
      const ty = this.translateY * factor;
      const scale = 1 - (1 - this.startScale) * factor;
      const opacity = 1 - (1 - this.startOpacity) * factor;

      // масштаб вокруг (ox, oy), затем сдвиг
      const transform = new Gsk.Transform()
         .translate(new Graphene.Point({ x: ox + tx, y: oy + ty }))!
         .scale(scale, scale)!
         .translate(new Graphene.Point({ x: -ox, y: -oy }));

      snapshot.push_opacity(opacity);
      snapshot.save();
      snapshot.transform(transform);
      this.snapshot_child(this._child, snapshot);
      snapshot.restore();
      snapshot.pop();
   }

   override vfunc_dispose() {
      this._cancelTick();
      this._child?.unparent();
      this._child = null;
      super.vfunc_dispose();
   }
}
