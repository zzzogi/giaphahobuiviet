"use client";

import { PersonNodeData } from "@/libs/transformTreeToFlow";
import { Handle, Node, NodeProps, Position } from "@xyflow/react";
import { memo } from "react";

type PersonFlowNode = Node<PersonNodeData, "personNode">;

function PersonNode({ data }: NodeProps<PersonFlowNode>) {
  const {
    person,
    generation,
    isCollapsed,
    hasChildren,
    onToggle,
    isHighlighted,
    isSelected,
    onSelect,
    isRoot,
    isDimmed,
    spouses,
  } = data;

  // Desktop: từ đời 4 mới vertical, Mobile: tất cả đều vertical
  const isVertical = generation >= 4;

  const genderStyle =
    person.gender === "male"
      ? "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-700 text-amber-900"
      : person.gender === "female"
        ? "bg-gradient-to-br from-red-50 to-pink-50 border-red-700 text-red-900"
        : "bg-gradient-to-br from-stone-50 to-slate-50 border-stone-700 text-stone-900";

  const selectedRing = isSelected
    ? "ring-4 ring-red-600 shadow-2xl scale-105"
    : isHighlighted
      ? "ring-3 ring-red-400"
      : "";

  return (
    <div
      className={`
        relative flex items-center justify-center
        cursor-pointer select-none transition-all duration-200
        hover:shadow-xl hover:scale-105
        ${genderStyle} ${selectedRing}
        ${isDimmed ? "opacity-30" : "opacity-100"}
        ${
          isRoot
            ? "w-[120px] min-h-[130px] lg:w-[280px] lg:min-h-[110px] px-3 py-4 lg:px-5 lg:pt-5 lg:pb-4"
            : isVertical && spouses && spouses.length > 0
              ? spouses.length === 1
                ? "min-w-[130px] w-auto min-h-[90px] lg:w-[150px] lg:min-h-[90px] px-2 py-2"
                : "min-w-[170px] w-auto min-h-[90px] lg:w-[195px] lg:min-h-[90px] px-2 py-2"
              : isVertical
                ? "min-w-[70px] w-auto min-h-[100px] lg:w-[85px] lg:min-h-[90px] px-1 py-2"
                : "min-w-[70px] w-auto min-h-[90px] lg:w-[180px] lg:min-h-[70px] px-2 py-2 lg:px-3 lg:pt-3 lg:pb-3"
        }
        }
        border-[3px] shadow-md rounded-sm
        
        /* Hiệu ứng giấy cũ */
        relative
        before:absolute before:inset-0 before:rounded-sm
        before:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIgLz48ZmVDb2xvck1hdHJpeCB0eXBlPSJzYXR1cmF0ZSIgdmFsdWVzPSIwIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')]
        before:opacity-40 before:pointer-events-none
        
        /* Đường viền trang trí kiểu cổ */
        after:absolute after:inset-[6px] after:border after:border-current after:opacity-20
        after:rounded-sm after:pointer-events-none
      `}
      onClick={() => onSelect(person)}
      style={{
        fontFamily: "'Noto Serif', 'Times New Roman', serif",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!bg-amber-800 !w-2 !h-2 !border-2 !border-amber-200"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!bg-red-800 !w-2 !h-2 !border-2 !border-red-200"
      />

      {/* Desktop layout */}

      <div className="hidden lg:block w-full z-10">
        {isRoot && (
          <div className="text-center mb-1">
            <span className="text-[10px] lg:text-xs uppercase tracking-widest opacity-60 font-semibold">
              Cụ tổ
            </span>
          </div>
        )}
        {isVertical && spouses && spouses.length > 0 ? (
          // Đời 4+ có spouse: layout ngang A | B | C
          <div className="flex items-center justify-center gap-1">
            {spouses.length === 2 ? (
              <>
                {/* Spouse bên trái */}
                <div className="flex flex-col items-center gap-0.5">
                  {spouses[0].name.split(" ").map((char, i) => (
                    <span
                      key={i}
                      className="font-bold leading-none text-[9px] opacity-70"
                      style={{ fontFamily: "'Noto Serif', serif" }}
                    >
                      {char}
                    </span>
                  ))}
                </div>

                <div className="w-px h-8 bg-current opacity-30" />

                {/* Main person */}
                <div className="flex flex-col items-center gap-0.5">
                  {person.name.split(" ").map((char, i) => (
                    <span
                      key={i}
                      className="font-bold leading-none text-[10px]"
                      style={{ fontFamily: "'Noto Serif', serif" }}
                    >
                      {char}
                    </span>
                  ))}
                </div>

                <div className="w-px h-8 bg-current opacity-30" />

                {/* Spouse bên phải */}
                <div className="flex flex-col items-center gap-0.5">
                  {spouses[1].name.split(" ").map((char, i) => (
                    <span
                      key={i}
                      className="font-bold leading-none text-[9px] opacity-70"
                      style={{ fontFamily: "'Noto Serif', serif" }}
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Spouse bên trái */}
                <div className="flex flex-col items-center gap-0.5">
                  {spouses[0].name.split(" ").map((char, i) => (
                    <span
                      key={i}
                      className="font-bold leading-none text-[9px] opacity-70"
                      style={{ fontFamily: "'Noto Serif', serif" }}
                    >
                      {char}
                    </span>
                  ))}
                </div>

                <div className="w-px h-8 bg-current opacity-30" />

                {/* Main person */}
                <div className="flex flex-col items-center gap-0.5">
                  {person.name.split(" ").map((char, i) => (
                    <span
                      key={i}
                      className="font-bold leading-none text-[10px]"
                      style={{ fontFamily: "'Noto Serif', serif" }}
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : isVertical ? (
          // Đời 4+ không spouse: hiển thị dọc
          <div className="flex flex-col items-center justify-center gap-0.5">
            {person.name.split(" ").map((char, i) => (
              <span
                key={i}
                className="font-bold leading-none text-[10px]"
                style={{ fontFamily: "'Noto Serif', serif" }}
              >
                {char}
              </span>
            ))}
          </div>
        ) : (
          // Đời 1-3: hiển thị ngang với spouse stack dọc
          <>
            <span
              className={`
                font-bold text-center leading-tight break-words block w-full
                ${isRoot ? "text-xl" : "text-sm"}
                drop-shadow-sm
              `}
              style={{ fontFamily: "'Noto Serif', serif" }}
            >
              {person.name}
            </span>

            {/* Spouses (nếu có) - stack dọc cho đời 1-3 */}
            {spouses && spouses.length > 0 && (
              <div className="mt-1 flex flex-col items-center gap-0.5">
                <div className="w-8 h-px bg-current opacity-30" />
                {spouses.map((spouse) => (
                  <span
                    key={spouse.id}
                    className="font-bold text-center leading-tight text-xs opacity-80"
                    style={{ fontFamily: "'Noto Serif', serif" }}
                  >
                    {spouse.name}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile: TẤT CẢ đều dùng layout dọc/ngang như đời 4+ */}
      <div className="lg:hidden flex items-center justify-center gap-1 z-10">
        {spouses && spouses.length > 0 ? (
          // Mobile có spouse: layout ngang
          <>
            {spouses.length === 2 ? (
              <>
                {/* Spouse trái */}
                <div className="flex flex-col items-center gap-1">
                  {spouses[0].name.split(" ").map((char, i) => (
                    <span
                      key={i}
                      className="font-bold leading-none text-[9px] opacity-70"
                      style={{ fontFamily: "'Noto Serif', serif" }}
                    >
                      {char}
                    </span>
                  ))}
                </div>

                <div className="w-px h-10 bg-current opacity-30" />

                {/* Main */}
                <div className="flex flex-col items-center gap-1">
                  {person.name.split(" ").map((char, i) => (
                    <span
                      key={i}
                      className={`font-bold leading-none ${isRoot ? "text-[11px]" : "text-[10px]"}`}
                      style={{ fontFamily: "'Noto Serif', serif" }}
                    >
                      {char}
                    </span>
                  ))}
                </div>

                <div className="w-px h-10 bg-current opacity-30" />

                {/* Spouse phải */}
                <div className="flex flex-col items-center gap-1">
                  {spouses[1].name.split(" ").map((char, i) => (
                    <span
                      key={i}
                      className="font-bold leading-none text-[9px] opacity-70"
                      style={{ fontFamily: "'Noto Serif', serif" }}
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Spouse */}
                <div className="flex flex-col items-center gap-1">
                  {spouses[0].name.split(" ").map((char, i) => (
                    <span
                      key={i}
                      className="font-bold leading-none text-[9px] opacity-70"
                      style={{ fontFamily: "'Noto Serif', serif" }}
                    >
                      {char}
                    </span>
                  ))}
                </div>

                <div className="w-px h-10 bg-current opacity-30" />

                {/* Main */}
                <div className="flex flex-col items-center gap-1">
                  {person.name.split(" ").map((char, i) => (
                    <span
                      key={i}
                      className={`font-bold leading-none ${isRoot ? "text-[11px]" : "text-[10px]"}`}
                      style={{ fontFamily: "'Noto Serif', serif" }}
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          // Mobile không spouse: dọc với gap
          <div className="flex flex-col items-center gap-1">
            {person.name.split(" ").map((char, i) => (
              <span
                key={i}
                className={`font-bold leading-none ${isRoot ? "text-[11px]" : "text-[10px]"}`}
                style={{ fontFamily: "'Noto Serif', serif" }}
              >
                {char}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Nút toggle */}
      {hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(person.id);
          }}
          className={`
            absolute -bottom-3 left-1/2 -translate-x-1/2
            rounded-full shadow-lg
            font-bold flex items-center justify-center z-20 transition-all
            border-[3px]
            ${isRoot ? "w-6 h-6 text-xs lg:w-7 lg:h-7 lg:text-sm" : "w-5 h-5 text-[10px] lg:w-6 lg:h-6 lg:text-xs"}
            ${
              isCollapsed
                ? "bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 border-amber-300"
                : "bg-gradient-to-br from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 border-red-300"
            }
            text-white
          `}
        >
          {isCollapsed ? "+" : "−"}
        </button>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!bg-red-800 !w-2 !h-2 !border-2 !border-red-200"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!bg-amber-800 !w-2 !h-2 !border-2 !border-amber-200"
      />
    </div>
  );
}

export default memo(PersonNode);
