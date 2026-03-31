import { Person } from "./familyData";

export interface TreeStats {
  total: number;
  males: number;
  females: number;
  generations: number;
}

export function computeTreeStats(root: Person | null | undefined): TreeStats {
  if (!root) return { total: 0, males: 0, females: 0, generations: 0 };

  let total = 0;
  let males = 0;
  let females = 0;
  let maxDepth = 0;

  function walk(p: Person, depth: number) {
    // Đếm main person
    total++;
    if (p.gender === "male") males++;
    else if (p.gender === "female") females++;
    if (depth > maxDepth) maxDepth = depth;

    // Đếm spouse (không tính vào thế hệ, chỉ tính đầu người)
    p.spouses?.forEach((s) => {
      total++;
      if (s.gender === "male") males++;
      else if (s.gender === "female") females++;
    });

    p.children?.forEach((child) => walk(child, depth + 1));
  }

  walk(root, 1);

  return { total, males, females, generations: maxDepth };
}
