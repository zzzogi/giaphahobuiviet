"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { Person } from "@/libs/familyData";

interface Props {
  treeData: Person | null;
  onExpandToNode?: (nodeId: string) => void; // ← Mới: callback để expand
}

// Flatten toàn bộ cây thành mảng phẳng để search
function flattenPersons(root: Person | null): Person[] {
  if (!root) return [];
  const result: Person[] = [];
  function walk(p: Person) {
    result.push(p);
    p.spouses?.forEach((s) => result.push(s));
    p.children?.forEach(walk);
  }
  walk(root);
  return result;
}

export default function SearchBar({ treeData, onExpandToNode }: Props) {
  const { setCenter, getNodes } = useReactFlow();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Flatten persons — chỉ tính lại khi treeData thay đổi
  const allPersons = useMemo(() => flattenPersons(treeData), [treeData]);

  // Filter kết quả — debounce không cần thiết vì filter trên mảng RAM
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return allPersons
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 8); // tối đa 8 kết quả
  }, [query, allPersons]);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Zoom đến node được chọn
  const handleSelect = useCallback(
    (person: Person) => {
      setQuery(person.name);
      setOpen(false);

      // ← Mới: Expand cây trước khi zoom
      if (onExpandToNode) {
        onExpandToNode(person.id);
      }

      // Delay để đợi expand xong rồi mới zoom
      setTimeout(() => {
        // Tìm node trong React Flow
        const nodes = getNodes();
        const target = nodes.find((n) => n.id === person.id);

        if (target && target.position) {
          const x = target.position.x + (target.measured?.width ?? 160) / 2;
          const y = target.position.y + (target.measured?.height ?? 60) / 2;
          // Zoom đến node, giữ zoom level 1.5
          setCenter(x, y, { zoom: 1.5, duration: 600 });
        }
      }, 300); // ← Delay để đợi expand animation
    },
    [getNodes, setCenter, onExpandToNode],
  );

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 bg-white rounded-lg shadow border border-slate-200 px-3 py-1.5">
        {/* Search icon */}
        <svg
          className="w-3.5 h-3.5 text-slate-400 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => query && setOpen(true)}
          placeholder="Tìm kiếm..."
          className="w-24 sm:w-36 text-xs outline-none bg-transparent text-slate-700 placeholder-slate-400"
        />

        {query && (
          <button
            onClick={() => {
              setQuery("");
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="text-slate-300 hover:text-slate-500 transition-colors"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown kết quả — luôn dropup */}
      {open && results.length > 0 && (
        <div
          className="
            absolute 
            bottom-full mb-1
            left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0
            w-[80vw] sm:w-64
            bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50
          "
        >
          {results.map((person) => (
            <button
              key={person.id}
              onClick={() => handleSelect(person)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
            >
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  person.gender === "male"
                    ? "bg-blue-400"
                    : person.gender === "female"
                      ? "bg-rose-400"
                      : "bg-gray-300"
                }`}
              />
              <span className="text-sm text-slate-700">{person.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Không tìm thấy — luôn dropup */}
      {open && query.trim() && results.length === 0 && (
        <div
          className="
            absolute 
            bottom-full mb-1
            left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0
            w-[80vw] sm:w-64
            bg-white rounded-xl shadow-xl border border-slate-100 px-4 py-3 text-xs text-slate-400 z-50
          "
        >
          Không tìm thấy &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
