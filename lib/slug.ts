import { nanoid } from "nanoid";

export function makeSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const suffix = nanoid(4).toLowerCase().replace(/[^a-z0-9]/g, "x");
  return `${base}-${suffix}`;
}
