import { z } from 'zod';
import rawMenu from '../data/menu.json';

export const CATEGORIES = ['mezze', 'mains', 'sides', 'desserts', 'drinks'] as const;
export type Category = (typeof CATEGORIES)[number];

export const menuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number().positive(),
  category: z.enum(CATEGORIES),
  diet: z.array(z.enum(['v', 'gf'])).default([]),
  featured: z.boolean().default(false),
});
export type MenuItem = z.infer<typeof menuItemSchema>;

export const MENU: MenuItem[] = z.array(menuItemSchema).parse(rawMenu);

export function getItemById(id: string): MenuItem | undefined {
  return MENU.find((i) => i.id === id);
}
export function getByCategory(category: Category): MenuItem[] {
  return MENU.filter((i) => i.category === category);
}
export function getFeatured(): MenuItem[] {
  return MENU.filter((i) => i.featured);
}
