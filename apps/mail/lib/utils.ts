import { format, isToday, isThisMonth, differenceInCalendarMonths } from "date-fns";
import { MAX_URL_LENGTH } from "./constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import LZString from "lz-string";
import axios from "axios";

export const FOLDERS = {
  SPAM: "spam",
  INBOX: "inbox",
  ARCHIVE: "archive",
  TRASH: "trash",
  DRAFT: "draft",
  SENT: "sent",
} as const;

export const LABELS = {
  SPAM: "SPAM",
  INBOX: "INBOX",
  UNREAD: "UNREAD",
  IMPORTANT: "IMPORTANT",
  SENT: "SENT",
} as const;

export const FOLDER_NAMES = [
  "inbox",
  "spam",
  "trash",
  "unread",
  "starred",
  "important",
  "sent",
  "draft",
];

export const FOLDER_TAGS: Record<string, string[]> = {
  [FOLDERS.SPAM]: [LABELS.SPAM],
  [FOLDERS.INBOX]: [LABELS.INBOX],
  [FOLDERS.ARCHIVE]: [],
  [FOLDERS.SENT]: [LABELS.SENT],
};

export const getFolderTags = (folder: string): string[] => {
  return FOLDER_TAGS[folder] || [];
};

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const compressText = (text: string): string => {
  const compressed = LZString.compressToEncodedURIComponent(text);
  return compressed.slice(0, MAX_URL_LENGTH);
};

export const decompressText = (compressed: string): string => {
  return LZString.decompressFromEncodedURIComponent(compressed) || "";
};

export const getCookie = (key: string): string | null => {
  const cookies = Object.fromEntries(
    document.cookie.split("; ").map((v) => v.split(/=(.*)/s).map(decodeURIComponent)),
  );
  return cookies?.[key] ?? null;
};

export const formatDate = (date: string) => {
  try {
    // Handle empty or invalid input
    if (!date) {
      return "";
    }

    // Parse the date string to a Date object
    const dateObj = new Date(date);
    const now = new Date();
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.error("Invalid date", date);
      return "";
    }
    
    // If it's today, always show the time
    if (isToday(dateObj)) {
      return format(dateObj, "h:mm a");
    }
    
    // Calculate hours difference between now and the email date
    const hoursDifference = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60);
    
    // If it's not today but within the last 12 hours, show the time
    if (hoursDifference <= 12) {
      return format(dateObj, "h:mm a");
    }
    
    // If it's this month or last month, show the month and day
    if (isThisMonth(dateObj) || differenceInCalendarMonths(now, dateObj) === 1) {
      return format(dateObj, "MMM dd");
    }
    
    // Otherwise show the date in MM/DD/YY format
    return format(dateObj, "MM/dd/yy");
  } catch (error) {
    console.error("Error formatting date", error);
    return "";
  }
};

export const cleanEmailAddress = (email: string = "") => {
  return email.replace(/[<>]/g, "").trim();
};

export const truncateFileName = (name: string, maxLength = 15) => {
  if (name.length <= maxLength) return name;
  const extIndex = name.lastIndexOf(".");
  if (extIndex !== -1 && name.length - extIndex <= 5) {
    return `${name.slice(0, maxLength - 5)}...${name.slice(extIndex)}`;
  }
  return `${name.slice(0, maxLength)}...`;
};

export const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export type FilterSuggestion = {
  filter: string;
  description: string;
  icon: React.ReactNode;
  prefix: string;
};

export const extractFilterValue = (filter: string): string => {
  if (!filter || !filter.includes(":")) return "";

  const colonIndex = filter.indexOf(":");
  const value = filter.substring(colonIndex + 1);

  return value || "";
};

export const defaultPageSize = 20;

export function createSectionId(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getFileIcon = (mimeType: string): string => {
  if (mimeType === "application/pdf") return "📄";
  if (mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") return "📊";
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    return "📝";
  if (mimeType.includes("image")) return ""; // Empty for images as they're handled separately
  return "📎"; // Default icon
};
