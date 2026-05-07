export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatOrdinalDay(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const suffix =
    day >= 11 && day <= 13 ? "th" : ["st", "nd", "rd"][(day % 10) - 1] || "th";
  const month = date.toLocaleDateString("en-US", { month: "long" });
  return `${day}${suffix} ${month}`;
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
