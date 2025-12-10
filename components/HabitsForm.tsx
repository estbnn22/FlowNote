"use client";

import { useState, useEffect } from "react";
import { createHabit } from "@/app/actions/habits/actions";

const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];

export default function HabitForm() {
  const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("DAILY");
  const [type, setType] = useState<"YES_NO" | "COUNTER">("YES_NO");

  const daysDisabled = !(frequency === "WEEKLY" || frequency === "MONTHLY");
  const targetDisabled = type !== "COUNTER";

  // Optional: clear values when disabling to avoid stale data
  useEffect(() => {
    if (daysDisabled) {
      const checkboxes = document.querySelectorAll<HTMLInputElement>(
        'input[name="daysOfWeek"]'
      );
      checkboxes.forEach((cb) => {
        cb.checked = false;
      });
    }
  }, [daysDisabled]);

  useEffect(() => {
    if (targetDisabled) {
      const input = document.querySelector<HTMLInputElement>(
        'input[name="targetPerPeriod"]'
      );
      if (input) input.value = "";
    }
  }, [targetDisabled]);

  return (
    <form action={createHabit} className="space-y-3">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral/70">Title</label>
        <input
          name="title"
          type="text"
          required
          className="rounded-lg border border-base-300 bg-base-300/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
          placeholder="Drink water, Read 20 pages..."
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral/70">Description</label>
        <textarea
          name="description"
          rows={2}
          className="rounded-lg border border-base-300 bg-base-300/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
          placeholder="Optional extra details about this habit..."
        />
      </div>

      {/* Frequency & Type */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral/70">Frequency</label>
          <select
            name="frequency"
            className="select select-sm w-full rounded-lg border-base-300 bg-base-300/70 text-xs"
            value={frequency}
            onChange={(e) =>
              setFrequency(e.target.value as "DAILY" | "WEEKLY" | "MONTHLY")
            }
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral/70">Type</label>
          <select
            name="type"
            className="select select-sm w-full rounded-lg border-base-300 bg-base-300/70 text-xs"
            value={type}
            onChange={(e) =>
              setType(e.target.value as "YES_NO" | "COUNTER")
            }
          >
            <option value="YES_NO">Yes / No</option>
            <option value="COUNTER">Counter (e.g. 8 glasses)</option>
          </select>
        </div>
      </div>

      {/* Weekly / Monthly days */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral/70">
          Days of week{" "}
          <span className="text-[10px] text-neutral/50">
            (only for weekly / monthly)
          </span>
        </label>
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {weekdayLabels.map((label, index) => (
            <label
              key={index}
              className={`inline-flex items-center gap-1 rounded-full border border-base-300/70 px-2 py-1 ${
                daysDisabled
                  ? "bg-base-300/20 opacity-50 cursor-not-allowed"
                  : "bg-base-300/40"
              }`}
            >
              <input
                type="checkbox"
                name="daysOfWeek"
                value={index}
                disabled={daysDisabled}
                className="checkbox checkbox-[10px] checkbox-primary"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Target per period */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral/70">
          Target per period{" "}
          <span className="text-[10px] text-neutral/50">
            (only for counter habits)
          </span>
        </label>
        <input
          name="targetPerPeriod"
          type="number"
          min={1}
          disabled={targetDisabled}
          className={`w-28 rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 ${
            targetDisabled
              ? "border-base-300/60 bg-base-300/30 text-neutral/50 cursor-not-allowed focus:ring-0"
              : "border-base-300 bg-base-300/60 focus:ring-primary/60"
          }`}
          placeholder={targetDisabled ? "Enable by choosing Counter" : "e.g. 8"}
        />
      </div>

      <div className="pt-1">
        <button
          type="submit"
          className="btn btn-sm w-full rounded-xl bg-primary text-xs text-black"
        >
          Add habit
        </button>
      </div>
    </form>
  );
}