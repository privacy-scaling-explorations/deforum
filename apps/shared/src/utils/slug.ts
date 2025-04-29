/**
 * Generates a URL-friendly slug from a string
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Removes special characters
 * - Limits consecutive hyphens to one
 * - Trims hyphens from start and end
 */
export function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD') // Normalize unicode characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Trim hyphens from start and end
}

/**
 * Generates a unique slug by appending a number if the slug already exists
 */
export function generateUniqueSlug(
  str: string,
  existingSlugs: string[],
): string {
  let slug = generateSlug(str);
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${generateSlug(str)}-${counter}`;
    counter++;
  }

  return slug;
} 