import dayjs from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/ru";
import duration from "dayjs/plugin/duration";
import type { ExperienceItem, Lang } from "@/lib/types";

dayjs.extend(duration);

function pluralRu(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function formatPeriod(
  startDate: string,
  endDate: string | null,
  lang: Lang,
) {
  dayjs.locale(lang);
  const start = dayjs(startDate);
  const end = endDate ? dayjs(endDate) : dayjs();

  let startFormatted = start.format("MMM YYYY");
  let endFormatted = endDate
    ? end.format("MMM YYYY")
    : lang === "ru"
      ? "настоящее время"
      : "Present";

  if (lang === "ru") {
    startFormatted =
      startFormatted.charAt(0).toUpperCase() + startFormatted.slice(1);
    if (endDate) {
      endFormatted =
        endFormatted.charAt(0).toUpperCase() + endFormatted.slice(1);
    }
  }

  return `${startFormatted} – ${endFormatted}`;
}

export function formatExperience(
  startDate: string,
  endDate: string | null,
  lang: Lang,
) {
  const start = dayjs(startDate);
  const end = endDate ? dayjs(endDate) : dayjs();
  const diff = dayjs.duration(end.diff(start));
  const years = Math.floor(diff.asYears());
  const months = Math.floor(diff.asMonths() % 12);

  const parts: string[] = [];

  if (years > 0) {
    if (lang === "ru") {
      parts.push(`${years} ${pluralRu(years, "год", "года", "лет")}`);
    } else {
      parts.push(`${years} ${years === 1 ? "year" : "years"}`);
    }
  }

  if (months > 0) {
    if (lang === "ru") {
      parts.push(`${months} мес`);
    } else {
      parts.push(`${months} ${months === 1 ? "month" : "months"}`);
    }
  }

  return parts.length > 0
    ? parts.join(" ")
    : lang === "ru"
      ? "менее месяца"
      : "less than a month";
}

export function formatTotalExperience(
  experiences: ExperienceItem[],
  lang: Lang,
) {
  if (!experiences.length) {
    return lang === "ru" ? "менее месяца" : "less than a month";
  }

  let totalMonths = 0;
  for (const exp of experiences) {
    const start = dayjs(exp.startDate);
    const end = exp.endDate ? dayjs(exp.endDate) : dayjs();
    totalMonths += Math.floor(dayjs.duration(end.diff(start)).asMonths());
  }

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  const parts: string[] = [];
  if (years > 0) {
    if (lang === "ru") {
      parts.push(`${years} ${pluralRu(years, "год", "года", "лет")}`);
    } else {
      parts.push(`${years} ${years === 1 ? "year" : "years"}`);
    }
  }
  if (months > 0) {
    if (lang === "ru") {
      parts.push(`${months} мес`);
    } else {
      parts.push(`${months} ${months === 1 ? "month" : "months"}`);
    }
  }

  return parts.length > 0
    ? parts.join(" ")
    : lang === "ru"
      ? "менее месяца"
      : "less than a month";
}
