import { useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StepDatePickerProps {
  selected?: Date;
  onSelect: (date: Date) => void;
  minYear?: number;
  maxYear?: number;
  disabled?: (date: Date) => boolean;
}

type PickerStep = "year" | "month" | "day";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function StepDatePicker({
  selected,
  onSelect,
  minYear = 1950,
  maxYear = new Date().getFullYear(),
  disabled,
}: StepDatePickerProps) {
  const [step, setStep] = useState<PickerStep>("year");
  const [tempYear, setTempYear] = useState(selected?.getFullYear() || maxYear);
  const [tempMonth, setTempMonth] = useState(selected?.getMonth() || 0);
  const [tempDay, setTempDay] = useState(selected?.getDate() || 1);

  const isLeapYear = (year: number) => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  };

  const getDaysInMonth = (month: number, year: number) => {
    if (month === 1 && isLeapYear(year)) return 29;
    return MONTH_DAYS[month];
  };

  const handleYearSelect = (year: number) => {
    const testDate = new Date(year, tempMonth, tempDay);
    if (!disabled || !disabled(testDate)) {
      setTempYear(year);
      setStep("month");
    }
  };

  const handleMonthSelect = (month: number) => {
    const daysInMonth = getDaysInMonth(month, tempYear);
    const adjustedDay = Math.min(tempDay, daysInMonth);
    const testDate = new Date(tempYear, month, adjustedDay);
    
    if (!disabled || !disabled(testDate)) {
      setTempMonth(month);
      setTempDay(adjustedDay);
      setStep("day");
    }
  };

  const handleDaySelect = (day: number) => {
    const testDate = new Date(tempYear, tempMonth, day);
    if (!disabled || !disabled(testDate)) {
      setTempDay(day);
      onSelect(testDate);
    }
  };

  const handleBack = () => {
    if (step === "month") {
      setStep("year");
    } else if (step === "day") {
      setStep("month");
    }
  };

  // Year Selector View
  if (step === "year") {
    const yearsToShow = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Select Year</h3>
          <span className="text-sm font-medium text-primary">{tempYear}</span>
        </div>

        <div className="space-y-2">
          {/* Scrollable Year Container */}
          <div className="relative">
            <div className="h-72 overflow-y-auto rounded-lg border border-border bg-muted/40 p-3 scroll-smooth">
              <div className="grid grid-cols-3 gap-2">
                {yearsToShow.map((year) => (
                  <button
                    key={year}
                    onClick={() => handleYearSelect(year)}
                    aria-label={`Select year ${year}`}
                    className={cn(
                      "py-3 px-2 rounded-md text-sm font-medium transition-all duration-200",
                      "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                      tempYear === year
                        ? "bg-primary text-primary-foreground shadow-lg scale-105"
                        : "bg-card text-foreground border border-border hover:border-primary/60"
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Scroll to select year • Future dates are disabled
          </p>
        </div>
      </div>
    );
  }

  // Month Selector View
  if (step === "month") {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-primary hover:text-primary"
            aria-label="Go back to year selection"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h3 className="text-lg font-semibold text-foreground">
            {tempYear}
          </h3>
          <div className="w-12" />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground mb-3">Select Month</p>
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((month, idx) => (
              <button
                key={month}
                onClick={() => handleMonthSelect(idx)}
                aria-label={`Select ${month}`}
                className={cn(
                  "py-3 px-2 rounded-lg text-sm font-medium transition-all duration-200",
                  "hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                  tempMonth === idx
                    ? "bg-primary text-primary-foreground shadow-lg scale-105"
                    : "bg-muted text-foreground border border-border hover:border-primary/60"
                )}
              >
                {month.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Day Selector (Calendar) View
  if (step === "day") {
    const firstDay = new Date(tempYear, tempMonth, 1).getDay();
    const daysInMonth = getDaysInMonth(tempMonth, tempYear);
    const daysArray = Array.from({ length: firstDay }, () => 0).concat(
      Array.from({ length: daysInMonth }, (_, i) => i + 1)
    );

    const today = new Date();
    const isCurrentMonth = tempYear === today.getFullYear() && tempMonth === today.getMonth();

    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-primary hover:text-primary"
            aria-label="Go back to month selection"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h3 className="text-lg font-semibold text-foreground">
            {MONTHS[tempMonth]} {tempYear}
          </h3>
          <div className="w-12" />
        </div>

        <div className="space-y-3">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {daysArray.map((day, idx) => {
              if (day === 0) {
                return <div key={`empty-${idx}`} className="aspect-square" />;
              }

              const dateToCheck = new Date(tempYear, tempMonth, day);
              const isDisabled = disabled ? disabled(dateToCheck) : false;
              const isSelected = tempDay === day;
              const isFuture = isCurrentMonth && day > today.getDate();

              return (
                <button
                  key={day}
                  onClick={() => handleDaySelect(day)}
                  disabled={isDisabled || isFuture}
                  aria-label={`Select ${day} ${MONTHS[tempMonth]} ${tempYear}`}
                  aria-disabled={isDisabled || isFuture}
                  className={cn(
                    "aspect-square rounded-lg text-sm font-medium transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                    isSelected && !isDisabled
                      ? "bg-primary text-primary-foreground shadow-lg scale-105"
                      : isDisabled || isFuture
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-card border border-border text-foreground hover:border-primary/60 hover:bg-primary/10"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {isCurrentMonth ? "Future dates are disabled for date of birth" : ""}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
