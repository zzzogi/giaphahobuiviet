"use client";

import { Person } from "@/libs/familyData";
import {
  useCreatePerson,
  useDeletePerson,
  useUpdatePerson,
} from "@/libs/hooks/useTreeMutations";
import { formatDateWithLunar } from "@/libs/lunar";
import { PersonRelations } from "@/libs/transformTreeToFlow";
import { useEffect, useRef, useState } from "react";
import EditPersonForm from "./EditPersonForm";
import Image from "next/image";

interface Props {
  person: Person | null;
  relations: PersonRelations | null;
  isAdmin: boolean;
  onClose: () => void;
}

function calcAge(dob: string, dod?: string): { label: string; value: number } {
  const birth = new Date(dob);
  const end = dod ? new Date(dod) : new Date();
  const age = Math.floor(
    (end.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
  return { label: dod ? "Hưởng dương" : "Tuổi", value: age };
}

// function formatDate(d?: string) {
//   if (!d) return "—";
//   const [y, m, day] = d.split("-");
//   return `${day}/${m}/${y}`;
// }

export default function PersonModal({
  person,
  relations,
  isAdmin,
  onClose,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const [mode, setMode] = useState<"view" | "edit" | "addChild" | "addSpouse">(
    "view",
  );

  const updateMutation = useUpdatePerson();
  const deleteMutation = useDeletePerson();
  const createMutation = useCreatePerson();

  const handleUpdate = (data: Partial<Person>) => {
    if (!person) return;
    updateMutation.mutate(
      { id: person.id, data },
      { onSuccess: () => setMode("view") },
    );
  };

  const handleDelete = () => {
    if (!person || !confirm(`Xóa "${person.name}"?`)) return;
    deleteMutation.mutate(person.id, {
      onSuccess: () => onClose(),
    });
  };

  const handleAddChild = (data: Partial<Person>) => {
    if (!person) return;
    createMutation.mutate(
      { ...(data as Omit<Person, "parentId">), parentId: person.id },
      { onSuccess: () => setMode("view") },
    );
  };

  const handleAddSpouse = (data: Partial<Person>) => {
    if (!person) return;
    createMutation.mutate(
      { ...(data as Omit<Person, "isSpouseOf">), isSpouseOf: person.id },
      { onSuccess: () => setMode("view") },
    );
  };

  if (!person) return null;

  const age = person.dob ? calcAge(person.dob, person.dod) : null;

  const genderLabel =
    person.gender === "male" ? "Nam" : person.gender === "female" ? "Nữ" : "—";
  const genderColor =
    person.gender === "male"
      ? "bg-blue-100 text-blue-700"
      : person.gender === "female"
        ? "bg-rose-100 text-rose-700"
        : "bg-gray-100 text-gray-600";

  const initial = person.name.charAt(0).toUpperCase();
  const avatarBg =
    person.gender === "male"
      ? "bg-blue-400"
      : person.gender === "female"
        ? "bg-rose-400"
        : "bg-gray-400";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-end bg-black/30 "
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="
        w-full sm:w-80 sm:h-full
        max-h-[85vh] sm:max-h-full
        bg-white shadow-2xl flex flex-col overflow-y-auto
        rounded-t-2xl sm:rounded-none
      "
        style={{ animation: "slideUp 0.22s ease-out" }}
      >
        {/* Header */}
        <div
          className={`flex items-center gap-4 p-5 shrink-0 ${
            person.gender === "male"
              ? "bg-blue-50"
              : person.gender === "female"
                ? "bg-rose-50"
                : "bg-gray-50"
          }`}
        >
          {/* avatar/initial — giữ nguyên */}
          {person.avatar ? (
            <Image
              src={person.avatar}
              alt={person.name}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white shadow"
              width={64}
              height={64}
            />
          ) : (
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold ${avatarBg} shrink-0`}
            >
              {initial}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 leading-tight truncate">
              {person.name}
            </h2>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${genderColor}`}
            >
              {genderLabel}
            </span>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-600 text-xl leading-none p-1"
          >
            ✕
          </button>
        </div>

        {/* Details */}
        <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto">
          <InfoRow label="Ngày sinh" value={formatDateWithLunar(person.dob)} />
          <InfoRow
            label="Ngày mất"
            value={person.dod ? formatDateWithLunar(person.dod) : "Còn sống"}
          />
          {age && (
            <InfoRow
              label={age.label}
              value={`${age.value} tuổi`}
              highlight={!!person.dod}
            />
          )}

          {person.biography && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Tiểu sử
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {person.biography}
              </p>
            </div>
          )}
          {/* ── NEW: Parent info ── */}
          {relations?.parent && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Cha / Mẹ
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    relations.parent.gender === "male"
                      ? "bg-blue-400"
                      : "bg-rose-400"
                  }`}
                />
                <span className="text-gray-700 font-medium">
                  {relations.parent.name}
                </span>
              </div>
            </div>
          )}

          {/* ── Vợ / Chồng ── */}
          {relations && relations.spouses.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Vợ / Chồng ({relations.spouses.length})
              </p>
              <ul className="space-y-1.5">
                {relations.spouses.map((spouse) => (
                  <li
                    key={spouse.id}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          spouse.gender === "male"
                            ? "bg-blue-400"
                            : spouse.gender === "female"
                              ? "bg-rose-400"
                              : "bg-gray-300"
                        }`}
                      />
                      <span className="text-gray-700">{spouse.name}</span>
                    </div>
                    {/* Admin actions — hiện khi hover */}
                    {isAdmin && (
                      <div className="hidden group-hover:flex items-center gap-1">
                        <button
                          onClick={() => {
                            /* mở edit form cho spouse */
                          }}
                          className="p-1 rounded text-blue-400 hover:bg-blue-50 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Xóa "${spouse.name}"?`)) {
                              deleteMutation.mutate(spouse.id);
                            }
                          }}
                          className="p-1 rounded text-rose-400 hover:bg-rose-50 transition-colors"
                          title="Xóa"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {/* Nút Thêm vợ/chồng — chỉ hiện với admin, đã có sẵn ở section Quản trị */}
            </div>
          )}

          {/* ── NEW: Children list ── */}
          {relations && relations.children.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Con cái ({relations.children.length})
              </p>
              <ul className="space-y-1.5">
                {relations.children.map((child) => (
                  <li
                    key={child.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        child.gender === "male"
                          ? "bg-blue-400"
                          : child.gender === "female"
                            ? "bg-rose-400"
                            : "bg-gray-300"
                      }`}
                    />
                    <span className="text-gray-700">{child.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {isAdmin && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              {mode === "view" && (
                <>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Quản trị
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMode("edit")}
                      className="flex-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <PencilIcon /> Chỉnh sửa
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                      className="flex-1 text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <TrashIcon />{" "}
                      {deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMode("addChild")}
                      className="flex-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium py-2 px-3 rounded-lg transition-colors"
                    >
                      + Thêm con
                    </button>
                    <button
                      onClick={() => setMode("addSpouse")}
                      className="flex-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium py-2 px-3 rounded-lg transition-colors"
                    >
                      + Thêm vợ/chồng
                    </button>
                  </div>
                  {(updateMutation.isError ||
                    deleteMutation.isError ||
                    createMutation.isError) && (
                    <p className="text-xs text-rose-500">
                      {(updateMutation.error as Error)?.message ??
                        (deleteMutation.error as Error)?.message ??
                        (createMutation.error as Error)?.message}
                    </p>
                  )}
                </>
              )}

              {mode === "edit" && (
                <>
                  <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2">
                    Chỉnh sửa thông tin
                  </p>
                  <EditPersonForm
                    person={person!}
                    onSave={handleUpdate}
                    onCancel={() => setMode("view")}
                    isSaving={updateMutation.isPending}
                  />
                </>
              )}

              {mode === "addChild" && (
                <>
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">
                    Thêm con cho {person?.name}
                  </p>
                  <EditPersonForm
                    person={{ id: "", name: "" }}
                    onSave={handleAddChild}
                    onCancel={() => setMode("view")}
                    isSaving={createMutation.isPending}
                  />
                </>
              )}

              {mode === "addSpouse" && (
                <>
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">
                    Thêm vợ/chồng cho {person?.name}
                  </p>
                  <EditPersonForm
                    person={{ id: "", name: "" }}
                    onSave={handleAddSpouse}
                    onCancel={() => setMode("view")}
                    isSaving={createMutation.isPending}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
      <span className="text-gray-400 font-medium">{label}</span>
      <span
        className={`font-semibold ${highlight ? "text-rose-600" : "text-gray-700"}`}
      >
        {value}
      </span>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg
      className="w-3 h-3"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.232 5.232l3.536 3.536M9 13l6.5-6.5a2 2 0 012.828 2.828L11.828 16H9v-2.828z"
      />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg
      className="w-3 h-3"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M3 7h18"
      />
    </svg>
  );
}
