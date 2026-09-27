import GObject from "gi://GObject?version=2.0";
import { register, property } from "gnim/gobject";

export type CalendarDay = {
   date: Date;
   day: number;
   isToday: boolean;
   isWeekend: boolean;
   isOtherMonth: boolean;
};

@register({ GTypeName: "CalendarService" })
export class CalendarService extends GObject.Object {
   static instance: CalendarService;
   static get_default(): CalendarService {
      if (!this.instance) this.instance = new CalendarService();
      return this.instance;
   }

   #date: Date = new Date();

   constructor() {
      super();
      this.reset();
   }

   @property
   get date(): Date {
      return new Date(this.#date.getTime());
   }
   set date(d: Date) {
      if (this.#date.getTime() === d.getTime()) return;
      this.#date = d;
      this.notify("date");
      this.notify("month");
      this.notify("year");
      this.notify("calendar");
   }

   @property
   get month(): number {
      return this.#date.getMonth();
   }

   @property
   get year(): number {
      return this.#date.getFullYear();
   }

   @property
   get calendar(): CalendarDay[] {
      const year = this.year;
      const month = this.month;
      const now = new Date();
      const startOfMonth = new Date(year, month, 1);
      const startDayOfWeek = (startOfMonth.getDay() + 6) % 7;

      const days: CalendarDay[] = [];
      const currentIterDate = new Date(year, month, 1 - startDayOfWeek);

      for (let i = 0; i < 42; i++) {
         const isToday =
            currentIterDate.getDate() === now.getDate() &&
            currentIterDate.getMonth() === now.getMonth() &&
            currentIterDate.getFullYear() === now.getFullYear();

         days.push({
            date: new Date(currentIterDate.getTime()),
            day: currentIterDate.getDate(),
            isToday,
            isWeekend:
               currentIterDate.getDay() === 0 || currentIterDate.getDay() === 6,
            isOtherMonth: currentIterDate.getMonth() !== month,
         });

         currentIterDate.setDate(currentIterDate.getDate() + 1);
      }

      return days;
   }

   shiftMonth(delta: number): void {
      this.date = new Date(this.year, this.month + delta, 1);
   }

   reset(): void {
      this.date = new Date();
   }
}
