import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

export const formatDate = (
  dateString: string,
  outputFormat: string = "DD/MM/YYYY HH:mm:ss"
): string => {
  let parsed = dayjs(dateString);
  if (!parsed.isValid() && typeof dateString === "string" && dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    parsed = dayjs(dateString, "DD/MM/YYYY");
  }
  return parsed.isValid() ? parsed.format(outputFormat) : "";
};

export const isSameDate = (date1: string, date2: string): boolean => {
  const d1 = dayjs(formatDate(date1, "DD/MM/YYYY"), "DD/MM/YYYY");
  const d2 = dayjs(formatDate(date2, "DD/MM/YYYY"), "DD/MM/YYYY");
  return d1.isValid() && d2.isValid() && d1.isSame(d2, "day");
};

export const getCurrentDateString = () => {
  return new Date().toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const getCurrentMonthString = () => {
  return `Tháng ${new Date().getMonth() + 1}`;
};
