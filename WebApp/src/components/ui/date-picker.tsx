"use client";

import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { DayPicker, type Matcher } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils/cn";

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  ariaLabel: string;
  className?: string;
};

function fromIsoDate(value?: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  ariaLabel,
  className,
}: DatePickerProps) {
  const selected = fromIsoDate(value);
  const minDate = fromIsoDate(min);
  const maxDate = fromIsoDate(max);
  const disabled: Matcher[] = [
    ...(minDate ? [{ before: minDate }] : []),
    ...(maxDate ? [{ after: maxDate }] : []),
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={ariaLabel}
          className={cn(
            "h-11 w-full justify-between rounded-xl border-white/80 bg-white/75 px-4 text-sm font-normal text-slate-700 shadow-sm hover:bg-white sm:w-44",
            className
          )}
        >
          <span className="tabular-nums">
            {selected ? format(selected, "d MMM yyyy", { locale: th }) : "เลือกวันที่"}
          </span>
          <CalendarDays className="size-4 text-primary" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto rounded-2xl border-white/80 bg-white p-3 shadow-xl">
        <DayPicker
          mode="single"
          locale={th}
          selected={selected}
          defaultMonth={selected}
          startMonth={minDate}
          endMonth={maxDate}
          disabled={disabled}
          onSelect={(date) => date && onChange(toIsoDate(date))}
          showOutsideDays
          classNames={{
            root: "text-slate-700",
            months: "flex",
            month: "space-y-3",
            month_caption: "relative flex h-9 items-center justify-center",
            caption_label: "text-sm font-semibold text-slate-800",
            nav: "absolute inset-x-0 top-3 flex justify-between px-3",
            button_previous:
              "inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            button_next:
              "inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            month_grid: "w-full border-collapse",
            weekdays: "flex",
            weekday: "w-10 py-2 text-center text-xs font-medium text-slate-400",
            week: "mt-1 flex w-full",
            day: "relative size-10 p-0 text-center text-sm",
            day_button:
              "inline-flex size-10 items-center justify-center rounded-xl tabular-nums hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            selected:
              "[&>button]:bg-primary [&>button]:font-semibold [&>button]:text-primary-foreground [&>button]:hover:bg-primary",
            today: "[&>button]:border [&>button]:border-primary [&>button]:font-semibold [&>button]:text-primary",
            outside: "text-slate-300",
            disabled: "pointer-events-none text-slate-300 opacity-50",
            hidden: "invisible",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
