import dagre from "@dagrejs/dagre";
import { Edge, Node, Position } from "@xyflow/react";
import { Person } from "./familyData";

export interface PersonNodeData extends Record<string, unknown> {
  person: Person;
  generation: number;
  isCollapsed: boolean;
  hasChildren: boolean;
  onToggle: (id: string) => void;
  isHighlighted: boolean;
  isSelected: boolean;
  onSelect: (person: Person) => void;
  isRoot: boolean;
  isDimmed: boolean;
  spouses?: Person[]; // ← THÊM DÒNG NÀY
}

// Desktop sizes
export const NODE_WIDTH = 160;
export const NODE_HEIGHT = 64;

// Mobile sizes - HẸP HƠN, CAO HƠN cho chữ dọc
export const MOBILE_NODE_WIDTH = 65;
export const MOBILE_NODE_HEIGHT = 80;

// Sizes cho đời 4+ desktop (vertical compact)
export const VERTICAL_NODE_WIDTH = 80;

export const VERTICAL_NODE_WITH_1_SPOUSE_WIDTH = 140;
export const VERTICAL_NODE_WITH_2_SPOUSE_WIDTH = 180;

// 1. Tăng khoảng cách giữa các node
const DESKTOP_SIBLING_GAP = 20; // từ 12 → 20
const DESKTOP_RANKSEP = 100; // từ 80 → 100

const MOBILE_SIBLING_GAP = 15; // từ 8 → 15
const MOBILE_RANKSEP = 80; // từ 60 → 80

// 2. Tăng height cho node dọc
export const VERTICAL_NODE_HEIGHT = 90; // từ 60 → 90
export const MOBILE_VERTICAL_NODE_HEIGHT = 100; // từ 80 → 100

// 3. Mobile node tự co giãn → dùng min-width thay vì fixed width
export const MOBILE_VERTICAL_NODE_WIDTH = 70; // tăng nhẹ
export const MOBILE_VERTICAL_NODE_WITH_1_SPOUSE_WIDTH = 130;
export const MOBILE_VERTICAL_NODE_WITH_2_SPOUSE_WIDTH = 170;

// 4. Root node to hơn
export const ROOT_NODE_WIDTH = 280; // từ 240 → 280
export const ROOT_NODE_HEIGHT = 110; // từ 90 → 110
export const MOBILE_ROOT_NODE_WIDTH = 120; // từ 100 → 120
export const MOBILE_ROOT_NODE_HEIGHT = 130; // từ 110 → 130

// Helper để tính width của node
function getNodeWidth(
  person: Person,
  isRoot: boolean,
  generation: number,
  isMobile: boolean,
): number {
  if (isRoot) {
    return isMobile ? MOBILE_ROOT_NODE_WIDTH : ROOT_NODE_WIDTH;
  }

  const spouseCount = person.spouses?.length ?? 0;

  // Mobile: TẤT CẢ đều dùng vertical layout
  if (isMobile) {
    if (spouseCount === 0) return MOBILE_VERTICAL_NODE_WIDTH;
    if (spouseCount === 1) return MOBILE_VERTICAL_NODE_WITH_1_SPOUSE_WIDTH;
    return MOBILE_VERTICAL_NODE_WITH_2_SPOUSE_WIDTH;
  }

  // Desktop: từ đời 4 mới vertical
  if (generation >= 4) {
    if (spouseCount === 0) return VERTICAL_NODE_WIDTH;
    if (spouseCount === 1) return VERTICAL_NODE_WITH_1_SPOUSE_WIDTH;
    return VERTICAL_NODE_WITH_2_SPOUSE_WIDTH;
  }

  // Desktop đời 1-3: horizontal
  return NODE_WIDTH;
}

function getNodeHeight(
  isRoot: boolean,
  generation: number,
  isMobile: boolean,
): number {
  if (isRoot) {
    return isMobile ? MOBILE_ROOT_NODE_HEIGHT : ROOT_NODE_HEIGHT;
  }

  // Mobile: TẤT CẢ đều cao hơn cho chữ dọc
  if (isMobile) {
    return MOBILE_VERTICAL_NODE_HEIGHT;
  }

  // Desktop: từ đời 4 mới compact
  if (generation >= 4) {
    return VERTICAL_NODE_HEIGHT;
  }

  return NODE_HEIGHT;
}

function buildDagreLayout(
  root: Person,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _: Set<string> = new Set(),
): Map<string, { x: number; y: number }> {
  const isMobile = isMobileView();

  const SIBLING_GAP = isMobile ? MOBILE_SIBLING_GAP : DESKTOP_SIBLING_GAP;
  const RANKSEP = isMobile ? MOBILE_RANKSEP : DESKTOP_RANKSEP;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB",
    ranksep: RANKSEP,
    nodesep: SIBLING_GAP,
    marginx: isMobile ? 15 : 40,
    marginy: isMobile ? 15 : 40,
  });

  // Pass 1: Đăng ký nodes
  function registerNodes(
    p: Person,
    generation: number,
    isRoot: boolean = false,
  ) {
    const width = getNodeWidth(p, isRoot, generation, isMobile);
    const height = getNodeHeight(isRoot, generation, isMobile);

    g.setNode(p.id, { width, height });

    p.children?.forEach((child) => {
      registerNodes(child, generation + 1, false);
      g.setEdge(p.id, child.id);
    });
  }

  registerNodes(root, 1, true);
  dagre.layout(g);

  // Pass 2: Extract positions
  const positions = new Map<string, { x: number; y: number }>();

  function extractPositions(
    p: Person,
    generation: number,
    isRoot: boolean = false,
  ) {
    const nodeData = g.node(p.id);
    if (!nodeData) return;

    const width = getNodeWidth(p, isRoot, generation, isMobile);
    const height = getNodeHeight(isRoot, generation, isMobile);

    const x = nodeData.x - width / 2;
    const y = nodeData.y - height / 2;

    positions.set(p.id, { x, y });

    p.children?.forEach((child) =>
      extractPositions(child, generation + 1, false),
    );
  }

  extractPositions(root, 1, true);
  return positions;
}

// Detect if mobile based on window width
function isMobileView(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 1024; // lg breakpoint
}

// ─── Collect all persons (main + spouses) flatly ───────────────────────────
// function collectAllPersons(root: Person): Person[] {
//   const all: Person[] = [];
//   function walk(p: Person) {
//     all.push(p);
//     p.spouses?.forEach((s) => all.push(s));
//     p.children?.forEach(walk);
//   }
//   walk(root);
//   return all;
// }

// ─── Build all nodes + edges with hidden flags for collapse ─────────────────
export function buildFullFlow(
  root: Person,
  collapsedIds: Set<string>,
  onToggle: (id: string) => void,
  onSelect: (person: Person) => void,
  highlightedIds: Set<string>,
  selectedId: string | null,
  positions: Map<string, { x: number; y: number }>,
): { nodes: Node<PersonNodeData>[]; edges: Edge[] } {
  const nodes: Node<PersonNodeData>[] = [];
  const edges: Edge[] = [];

  const hasHighlight = highlightedIds.size > 0;
  const isMobile = isMobileView();

  // ← Map để track spouse → children relationship
  const spouseChildrenMap = new Map<string, Set<string>>();

  function buildSpouseChildrenMap(p: Person) {
    if (
      p.spouses &&
      p.spouses.length > 0 &&
      p.children &&
      p.children.length > 0
    ) {
      p.spouses.forEach((spouse) => {
        const childrenOfSpouse =
          p.children?.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (child) => (child as any).spouseParentId === spouse.id,
          ) ?? [];

        if (childrenOfSpouse.length > 0) {
          spouseChildrenMap.set(
            spouse.id,
            new Set(childrenOfSpouse.map((c) => c.id)),
          );
        }
      });
    }

    p.children?.forEach(buildSpouseChildrenMap);
  }

  buildSpouseChildrenMap(root);

  function walk(
    p: Person,
    isHidden: boolean,
    generation: number,
    isRoot: boolean = false,
  ) {
    const pos = positions.get(p.id) ?? { x: 0, y: 0 };
    const hasChildren = !!p.children?.length;
    const isCollapsed = collapsedIds.has(p.id);
    const isSelected = selectedId === p.id;
    const isHighlighted = highlightedIds.has(p.id);
    const isDimmed = hasHighlight && !isHighlighted;

    // const baseWidth = isMobile
    //   ? isRoot
    //     ? MOBILE_ROOT_NODE_WIDTH
    //     : MOBILE_NODE_WIDTH
    //   : isRoot
    //     ? ROOT_NODE_WIDTH
    //     : NODE_WIDTH;

    // Main person node
    nodes.push({
      id: p.id,
      type: "personNode",
      position: pos,
      hidden: isHidden,
      draggable: false,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: {
        person: p,
        generation,
        isCollapsed,
        hasChildren,
        onToggle,
        isHighlighted,
        isSelected,
        onSelect,
        isRoot,
        isDimmed,
        spouses: p.spouses || [],
      },
    });

    // Spouse nodes
    // p.spouses?.forEach((spouse, spouseIndex) => {
    //   const spousePos = positions.get(spouse.id) ?? {
    //     x: pos.x + baseWidth + MARRIAGE_GAP + spouseIndex * SPOUSE_SPACING,
    //     y: pos.y,
    //   };

    //   const spouseHighlighted = highlightedIds.has(spouse.id);
    //   const spouseDimmed = hasHighlight && !spouseHighlighted;

    //   nodes.push({
    //     id: spouse.id,
    //     type: "personNode",
    //     position: spousePos,
    //     hidden: isHidden,
    //     draggable: false,
    //     sourcePosition: Position.Bottom,
    //     targetPosition: Position.Top,
    //     data: {
    //       person: spouse,
    //       generation,
    //       isCollapsed: false,
    //       hasChildren: false,
    //       onToggle: () => {},
    //       isHighlighted: spouseHighlighted,
    //       isSelected: selectedId === spouse.id,
    //       onSelect,
    //       isRoot: false,
    //       isDimmed: spouseDimmed,
    //     },
    //   });

    //   // Marriage edge (dashed horizontal line)
    //   edges.push({
    //     id: `marriage-${p.id}-${spouse.id}`,
    //     source: p.id,
    //     target: spouse.id,
    //     type: "straight",
    //     hidden: isHidden,
    //     sourceHandle: "right",
    //     targetHandle: "left",
    //     style: {
    //       stroke: spouseDimmed ? "#f43f5e40" : "#f43f5e",
    //       strokeDasharray: "5,4",
    //       strokeWidth: isMobile ? 1 : 1.5,
    //       opacity: spouseDimmed ? 0.3 : 1,
    //     },
    //     data: { isMarriage: true },
    //   });

    //   // Edge từ spouse đến con riêng (nếu có)
    //   const spouseChildren = spouseChildrenMap.get(spouse.id);
    //   if (spouseChildren && !isCollapsed) {
    //     spouseChildren.forEach((childId) => {
    //       edges.push({
    //         id: `spouse-child-${spouse.id}-${childId}`,
    //         source: spouse.id,
    //         target: childId,
    //         sourceHandle: "bottom",
    //         targetHandle: "top",
    //         type: "smoothstep",
    //         hidden: isHidden,
    //         style: {
    //           stroke: "#f43f5e",
    //           strokeDasharray: "5,4",
    //           strokeWidth: isMobile ? 1 : 1.5,
    //           opacity: spouseDimmed ? 0.3 : 1,
    //         },
    //       });
    //     });
    //   }
    // });

    // Parent → child edges + recurse
    if (!isCollapsed) {
      p.children?.forEach((child) => {
        const childHidden = isHidden;
        const childHighlighted = highlightedIds.has(child.id);
        const edgeHighlighted = isHighlighted && childHighlighted;
        const edgeDimmed = hasHighlight && !edgeHighlighted;

        edges.push({
          id: `e-${p.id}-${child.id}`,
          source: p.id,
          target: child.id,
          sourceHandle: "bottom",
          targetHandle: "top",
          type: "smoothstep",
          hidden: childHidden,
          animated: edgeHighlighted,
          style: {
            stroke: edgeHighlighted
              ? "#f59e0b"
              : edgeDimmed
                ? "#94a3b840"
                : "#94a3b8",
            strokeWidth: edgeHighlighted
              ? isMobile
                ? 2
                : 3
              : isMobile
                ? 1
                : 1.5,
            opacity: edgeDimmed ? 0.3 : 1,
          },
        });
        walk(child, childHidden, generation + 1, false);
      });
    } else {
      // Collapsed: walk nhưng set hidden = true
      p.children?.forEach((child) => {
        walk(child, true, generation + 1, false);
      });
    }
  }

  walk(root, false, 1, true);

  return { nodes, edges };
}

// ─── One-time layout precomputation ─────────────────────────────────────────
export function precomputeLayout(
  root: Person,
  collapsedIds: Set<string> = new Set(),
): Map<string, { x: number; y: number }> {
  return buildDagreLayout(root, collapsedIds);
}

// ─── Lineage highlight helper ───────────────────────────────────────────────
export function getLineageIds(person: Person, targetId: string): Set<string> {
  const result = new Set<string>();

  function findAncestors(node: Person, path: string[]): boolean {
    const currentPath = [...path, node.id];

    node.spouses?.forEach((spouse) => {
      if (!currentPath.includes(spouse.id)) {
        currentPath.push(spouse.id);
      }
    });

    if (node.id === targetId) {
      currentPath.forEach((id) => result.add(id));
      return true;
    }

    if (node.spouses?.some((s) => s.id === targetId)) {
      currentPath.forEach((id) => result.add(id));
      return true;
    }

    for (const child of node.children ?? []) {
      if (findAncestors(child, currentPath)) return true;
    }
    return false;
  }

  function collectDescendants(node: Person) {
    result.add(node.id);
    node.spouses?.forEach((s) => result.add(s.id));
    node.children?.forEach(collectDescendants);
  }

  findAncestors(person, []);

  function findNode(node: Person): Person | null {
    if (node.id === targetId) return node;
    if (node.spouses?.some((s) => s.id === targetId)) return node;
    for (const child of node.children ?? []) {
      const found = findNode(child);
      if (found) return found;
    }
    return null;
  }

  const target = findNode(person);
  if (target) collectDescendants(target);

  return result;
}

// ─── Collect IDs beyond a given depth ───────────────────────────────────────
export function getIdsBeforeDepth(root: Person, maxDepth: number): Set<string> {
  const result = new Set<string>();

  function walk(p: Person, depth: number) {
    if (depth >= maxDepth) {
      result.add(p.id);
      return;
    }
    p.children?.forEach((child) => walk(child, depth + 1));
  }
  walk(root, 0);
  return result;
}

export function getAllCollapsibleIds(root: Person): Set<string> {
  const result = new Set<string>();
  function walk(p: Person) {
    if (p.children?.length) result.add(p.id);
    p.children?.forEach(walk);
  }
  walk(root);
  return result;
}

// ─── Relations map ─────────────────────────────────────────────────────────
export interface PersonRelations {
  parent: Person | null;
  children: Person[];
  spouses: Person[];
}

export function buildRelationsMap(root: Person): Map<string, PersonRelations> {
  const map = new Map<string, PersonRelations>();

  function walk(p: Person, parent: Person | null) {
    map.set(p.id, {
      parent,
      children: p.children ?? [],
      spouses: p.spouses ?? [],
    });
    p.spouses?.forEach((s) => {
      map.set(s.id, { parent: null, children: [], spouses: [p] });
    });
    p.children?.forEach((child) => walk(child, p));
  }
  walk(root, null);
  return map;
}
