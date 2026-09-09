import { describe, it, expect } from 'vitest';
import { MENU, getItemById, getByCategory, getFeatured, CATEGORIES } from './menu';

describe('menu data', () => {
  it('has unique kebab-case ids', () => {
    const ids = MENU.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/));
  });
  it('has positive prices and substantive copy', () => {
    MENU.forEach((i) => {
      expect(i.price).toBeGreaterThan(0);
      expect(i.name.length).toBeGreaterThan(2);
      expect(i.description.length).toBeGreaterThan(10);
    });
  });
  it('only uses known categories', () => {
    MENU.forEach((i) => expect(CATEGORIES).toContain(i.category));
  });
  it('has exactly 3 featured items', () => {
    expect(getFeatured()).toHaveLength(3);
  });
  it('looks items up by id', () => {
    expect(getItemById('hummus')?.name).toContain('Hummus');
    expect(getItemById('nope')).toBeUndefined();
  });
  it('filters by category', () => {
    getByCategory('mains').forEach((i) => expect(i.category).toBe('mains'));
    expect(getByCategory('mains').length).toBeGreaterThanOrEqual(5);
  });
});
