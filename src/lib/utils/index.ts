export * from "./format";

// Utility function to conditionally join class names
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
