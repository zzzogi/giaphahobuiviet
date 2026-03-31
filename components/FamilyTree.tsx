"use client";

import {
  Background,
  Controls,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Person } from "@/libs/familyData";
import {
  buildFullFlow,
  buildRelationsMap,
  getIdsBeforeDepth,
  getLineageIds,
  MOBILE_ROOT_NODE_HEIGHT,
  MOBILE_ROOT_NODE_WIDTH,
  precomputeLayout,
  ROOT_NODE_HEIGHT,
  ROOT_NODE_WIDTH,
} from "@/libs/transformTreeToFlow";
import PersonModal from "./PersonModal";
import PersonNode from "./PersonNode";

import { useAuth } from "@/libs/authContext";
import { useTreeQuery } from "@/libs/hooks/useTreeQuery";
import AdminAvatar from "./AdminAvatar";
import SearchBar from "./SearchBar";
import StatsPanel from "./StatPanel";
import Image from "next/image";

const nodeTypes = { personNode: PersonNode };

// ← Thay đổi: responsive depth
const getInitialDepth = () => {
  if (typeof window === "undefined") return 4;
  return window.innerWidth < 1024 ? 10 : 4; // Mobile: 10 đời, Desktop: 4 đời
};

const isMobileView = () => {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 1024;
};

// ─────────────────────────────────────────────────────────────────────────────
function FamilyTreeInner() {
  const { setCenter } = useReactFlow();
  const { isAdmin } = useAuth();

  // ── Fetch tree từ API ──────────────────────────────────────────────────────
  const { data: treeData, isLoading, isError } = useTreeQuery();

  // ── Tính initial state từ treeData ─────────────────────────────────────────
  const initialState = useMemo(() => {
    if (!treeData) return null;
    const depth = getInitialDepth();
    const initialCollapsed = getIdsBeforeDepth(treeData, depth);
    const initialPositions = precomputeLayout(treeData, initialCollapsed);
    return { collapsed: initialCollapsed, positions: initialPositions };
  }, [treeData]);

  // ── Layout positions & Collapsed state ─────────────────────────────────────
  const [layoutPositions, setLayoutPositions] = useState<
    Map<string, { x: number; y: number }>
  >(() => initialState?.positions ?? new Map());

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(
    () => initialState?.collapsed ?? new Set(),
  );

  // ── Flag để track initial zoom ─────────────────────────────────────────────
  const hasInitialZoomed = useRef(false);

  // ── Zoom vào node gốc khi load xong ────────────────────────────────────────
  useEffect(() => {
    if (!treeData || layoutPositions.size === 0 || hasInitialZoomed.current)
      return;

    const timer = setTimeout(() => {
      const rootPos = layoutPositions.get(treeData.id);
      if (rootPos) {
        const isMobile = isMobileView();
        const nodeWidth = isMobile ? MOBILE_ROOT_NODE_WIDTH : ROOT_NODE_WIDTH;
        const nodeHeight = isMobile
          ? MOBILE_ROOT_NODE_HEIGHT
          : ROOT_NODE_HEIGHT;

        // Zoom level
        const zoomLevel = isMobile ? 1.2 : 0.8;

        // Lấy thông tin viewport
        const headerHeight =
          document.querySelector("header")?.offsetHeight || 0;
        const viewportHeight = window.innerHeight;

        // Khoảng cách từ header đến top của node (padding)
        const paddingFromHeader = 10;

        // Y position mong muốn cho CENTER của node trong viewport
        const desiredCenterYInViewport =
          headerHeight + paddingFromHeader + (nodeHeight * zoomLevel) / 2;

        // Tính offset cần thiết
        const viewportCenterY = viewportHeight / 2;
        const offsetY =
          (viewportCenterY - desiredCenterYInViewport) / zoomLevel;

        // Center X giữ nguyên, Y điều chỉnh
        const centerX = rootPos.x + nodeWidth / 2;
        const centerY = rootPos.y + nodeHeight / 2 + offsetY;

        setCenter(centerX, centerY, { zoom: zoomLevel, duration: 800 });
        hasInitialZoomed.current = true;
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [treeData, layoutPositions, setCenter]);

  // ── Recalc layout khi resize window (mobile ↔ desktop) ────────────────────
  useEffect(() => {
    if (!treeData) return;

    const handleResize = () => {
      const newPositions = precomputeLayout(treeData, collapsedIds);
      setLayoutPositions(newPositions);
      // Reset flag để zoom lại khi resize
      hasInitialZoomed.current = false;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [treeData, collapsedIds]);

  // ── Modal state ────────────────────────────────────────────────────────────
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── Relations map ──────────────────────────────────────────────────────────
  const relationsMap = useMemo(
    () => (treeData ? buildRelationsMap(treeData) : new Map()),
    [treeData],
  );

  // ── Lineage highlight ──────────────────────────────────────────────────────
  const highlightedIds = useMemo(() => {
    if (!selectedId || !treeData) return new Set<string>();
    return getLineageIds(treeData, selectedId);
  }, [selectedId, treeData]);

  // ── Toggle expand/collapse 1 node ─────────────────────────────────────────
  const handleToggle = useCallback(
    (id: string) => {
      if (!treeData) return;

      setCollapsedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });

      // Recalc layout sau khi state update
      setCollapsedIds((current) => {
        const newPositions = precomputeLayout(treeData, current);
        setLayoutPositions(newPositions);
        return current;
      });
    },
    [treeData],
  );

  // ── Helper: Tìm path từ root đến node ──────────────────────────────────────
  const findPathToNode = useCallback(
    (root: Person, targetId: string): string[] => {
      const path: string[] = [];

      function search(node: Person): boolean {
        path.push(node.id);

        if (node.id === targetId) return true;

        // Check trong spouses
        if (node.spouses?.some((s) => s.id === targetId)) {
          return true;
        }

        // Search trong children
        if (node.children) {
          for (const child of node.children) {
            if (search(child)) return true;
          }
        }

        path.pop();
        return false;
      }

      search(root);
      return path;
    },
    [],
  );

  // ── Expand path đến node ────────────────────────────────────────────────────
  const handleExpandToNode = useCallback(
    (nodeId: string) => {
      if (!treeData) return;

      // Tìm path từ root đến node
      const path = findPathToNode(treeData, nodeId);

      if (path.length === 0) return;

      // Expand tất cả nodes trong path
      setCollapsedIds((prev) => {
        const next = new Set(prev);

        // Remove tất cả ancestors trong path khỏi collapsed
        path.forEach((id) => {
          next.delete(id);
        });

        // Recalc layout với state mới
        const newPositions = precomputeLayout(treeData, next);
        setLayoutPositions(newPositions);

        return next;
      });
    },
    [treeData, findPathToNode],
  );

  // ── Node click → mở modal ─────────────────────────────────────────────────
  const handleSelect = useCallback((person: Person) => {
    setSelectedPerson((prev) => (prev?.id === person.id ? null : person));
    setSelectedId((prev) => (prev === person.id ? null : person.id));
  }, []);

  // ── Build nodes/edges ──────────────────────────────────────────────────────
  const { nodes: rawNodes, edges: rawEdges } = useMemo(() => {
    if (!treeData || layoutPositions.size === 0) {
      return { nodes: [], edges: [] };
    }
    return buildFullFlow(
      treeData,
      collapsedIds,
      handleToggle,
      handleSelect,
      highlightedIds,
      selectedId,
      layoutPositions,
    );
  }, [
    treeData,
    collapsedIds,
    handleToggle,
    handleSelect,
    highlightedIds,
    selectedId,
    layoutPositions,
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState(rawNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rawEdges);

  useEffect(() => {
    setNodes(rawNodes);
    setEdges(rawEdges);
  }, [rawNodes, rawEdges, setNodes, setEdges]);

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-slate-400 text-sm">
        Đang tải cây gia phả...
      </div>
    );
  }

  if (isError || !treeData) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-rose-400 text-sm">
        Không thể tải dữ liệu. Vui lòng thử lại.
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-screen flex flex-col overflow-hidden">
      {/* HEADER */}
      <header
        className="relative w-full z-20 shadow-md"
        style={{
          backgroundImage: "url('/bg-pattern.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-slate-100/90 backdrop-blur-sm" />

        <div className="relative">
          {/* Desktop layout: rồng + gia huy + rồng */}
          <div className="hidden lg:flex items-center justify-center pt-4 pb-4 px-4">
            <div className="flex items-center gap-0">
              <Image
                src="/rong-1.png"
                alt=""
                className="h-32 w-auto object-contain"
                width={128}
                height={128}
              />
              <Image
                src="/crest-top.png"
                alt="Gia huy"
                className="h-40 w-auto object-contain mx-1 drop-shadow-lg"
                width={160}
                height={160}
              />
              <Image
                src="/rong-2.png"
                alt=""
                className="h-32 w-auto object-contain"
                width={128}
                height={128}
              />
            </div>
          </div>

          {/* Mobile/Tablet layout */}
          <div className="lg:hidden flex flex-col items-center py-4 px-4">
            {/* Gia huy to hơn */}
            <Image
              src="/crest-top.png"
              alt="Gia huy"
              className="h-40 sm:h-48 w-auto object-contain drop-shadow-lg mb-3"
              width={160}
              height={160}
            />

            {/* Câu đối nằm ngang - CHỈ mobile */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 mb-2 items-center">
              <div className="flex items-center gap-0.5">
                <div className="h-px w-4 bg-amber-300/60" />
                {"Thờ tiên tổ như kính tại thượng".split("").map((char, i) => (
                  <span
                    key={i}
                    style={{ fontFamily: "OngDo" }}
                    className="text-amber-800/90 text-base sm:text-lg leading-none"
                  >
                    {char}
                  </span>
                ))}
                <div className="h-px w-4 bg-amber-300/60" />
              </div>

              <div className="flex items-center gap-0.5">
                <div className="h-px w-4 bg-amber-300/60" />
                {"Giúp hậu nhân sáng bởi duy tân".split("").map((char, i) => (
                  <span
                    key={i}
                    style={{ fontFamily: "OngDo" }}
                    className="text-amber-800/90 text-base sm:text-lg leading-none"
                  >
                    {char}
                  </span>
                ))}
                <div className="h-px w-4 bg-amber-300/60" />
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel + Avatar - góc trên phải */}
        <div className="absolute top-4 right-4 flex items-center gap-3 z-30">
          {/* Desktop: hiện full controls */}
          <AdminAvatar />
        </div>
      </header>

      {/* Câu đối trái - desktop only */}
      <div
        className="hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 z-10 
                   pointer-events-none select-none flex-col items-center gap-1"
      >
        <div className="w-px h-8 bg-amber-300/60" />
        {"Thờ tiên tổ như kính tại thượng".split(" ").map((char, i) => (
          <span
            key={i}
            style={{ fontFamily: "OngDo" }}
            className="text-amber-800/90 text-3xl leading-tight tracking-wider"
          >
            {char}
          </span>
        ))}
        <div className="w-px h-8 bg-amber-300/60" />
      </div>

      {/* Câu đối phải - desktop only */}
      <div
        className="hidden lg:flex fixed right-4 top-1/2 -translate-y-1/2 z-10 
                   pointer-events-none select-none flex-col items-center gap-1"
      >
        <div className="w-px h-8 bg-amber-300/60" />
        {"Giúp hậu nhân sáng bởi duy tân".split(" ").map((char, i) => (
          <span
            key={i}
            style={{ fontFamily: "OngDo" }}
            className="text-amber-800/90 text-3xl leading-tight tracking-wider"
          >
            {char}
          </span>
        ))}
        <div className="w-px h-8 bg-amber-300/60" />
      </div>

      {/* BIỂU ĐỒ */}
      <div
        className="flex-1 relative"
        style={{
          backgroundImage: "url('/bg-pattern.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-slate-100/85 backdrop-blur-[2px]" />

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView={false}
          minZoom={0.08}
          maxZoom={2}
          attributionPosition="bottom-right"
          nodesDraggable={false}
          panOnDrag={true}
          panOnScroll={false}
          zoomOnScroll={true}
          zoomOnPinch={true}
          selectionOnDrag={false}
        >
          <Background color="#cbd5e1" gap={24} />
          <Controls />

          {/* Stats Panel - bottom right */}
          <Panel position="bottom-right">
            <div className="flex gap-2 flex-col lg:flex-row items-end lg:items-center">
              <SearchBar
                treeData={treeData ?? null}
                onExpandToNode={handleExpandToNode}
              />
              <div className="mb-2 mr-2">
                <StatsPanel treeData={treeData} />
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Modal */}
      <PersonModal
        person={selectedPerson}
        relations={
          selectedPerson ? (relationsMap.get(selectedPerson.id) ?? null) : null
        }
        isAdmin={isAdmin}
        onClose={() => {
          setSelectedPerson(null);
          setSelectedId(null);
        }}
      />
    </div>
  );
}

// ── Provider wrapper ──────────────────────────────────────────────────────────
export default function FamilyTree() {
  return (
    <ReactFlowProvider>
      <FamilyTreeInner />
    </ReactFlowProvider>
  );
}
