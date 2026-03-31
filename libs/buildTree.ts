import { Person as PrismaPerson } from "@prisma/client";
import { Person } from "./familyData";

export function buildTreeFromFlat(flat: PrismaPerson[]): Person | null {
  const map = new Map<string, Person>();

  // First pass: create all Person objects
  for (const p of flat) {
    map.set(p.id, {
      id: p.id,
      name: p.name,
      gender: p.gender as "male" | "female" | undefined,
      avatar: p.avatar ?? undefined,
      dob: p.dob ?? undefined,
      dod: p.dod ?? undefined,
      biography: p.biography ?? undefined,
      children: [],
      spouses: [],
    });
  }

  let root: Person | null = null;

  // Second pass: wire relationships
  for (const p of flat) {
    const node = map.get(p.id)!;

    if (p.isSpouseOf) {
      // Attach to spouse list of the main person
      const main = map.get(p.isSpouseOf);
      main?.spouses?.push(node);
    } else if (p.parentId) {
      const parent = map.get(p.parentId);
      parent?.children?.push(node);
    } else {
      root = node; // no parent → root
    }
  }

  return root;
}
