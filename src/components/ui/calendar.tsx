"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 bg-white w-full max-w-[360px] shadow-2xl rounded-3xl border border-gray-100", className)}
      formatters={{
        formatWeekdayName: (day) => format(day, "EEEEEE"),
      }}
      classNames={{
        months: "w-full flex flex-col space-y-4",
        month: "space-y-4 w-full",
        caption: "flex justify-between items-center h-10 px-1 relative mb-4",
        caption_label: "text-sm font-black uppercase tracking-[0.2em] text-[#081621]",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 bg-gray-50 hover:bg-gray-100 border-none rounded-xl p-0 transition-all active:scale-90"
        ),
        table: "w-full border-collapse select-none",
        head_row: "grid grid-cols-7 gap-1 mb-2",
        head_cell: "text-muted-foreground font-black text-[10px] uppercase tracking-tighter text-center flex items-center justify-center w-10 h-10",
        row: "grid grid-cols-7 gap-1 mt-1",
        cell: "h-10 w-10 text-center p-0 relative focus-within:relative focus-within:z-20 flex items-center justify-center",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-black text-[11px] uppercase rounded-xl transition-all hover:bg-primary/10 hover:text-primary active:scale-90 flex items-center justify-center border-none"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-lg shadow-primary/20",
        day_today: "bg-gray-100 text-primary ring-2 ring-primary/20",
        day_outside: "day-outside text-gray-300 opacity-50",
        day_disabled: "text-gray-300 opacity-30 cursor-not-allowed",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
