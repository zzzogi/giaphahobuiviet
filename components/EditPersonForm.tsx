"use client";

import { Person } from "@/libs/familyData";
import { useState } from "react";

interface Props {
  person: Person;
  onSave: (data: Partial<Person>) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export default function EditPersonForm({
  person,
  onSave,
  onCancel,
  isSaving,
}: Props) {
  const [form, setForm] = useState({
    name: person.name ?? "",
    gender: person.gender ?? "",
    dob: person.dob ?? "",
    dod: person.dod ?? "",
    biography: person.biography ?? "",
    avatar: person.avatar ?? "",
  });

  const set =
    (field: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          name: form.name,
          gender: (form.gender as "male" | "female") || undefined,
          dob: form.dob || undefined,
          dod: form.dod || undefined,
          biography: form.biography || undefined,
          avatar: form.avatar || undefined,
        });
      }}
      className="space-y-3"
    >
      <Field label="Họ tên *">
        <input
          required
          value={form.name}
          onChange={set("name")}
          className="input-base"
          placeholder="Nguyễn Văn A"
        />
      </Field>

      <Field label="Giới tính">
        <select
          value={form.gender}
          onChange={set("gender")}
          className="input-base"
        >
          <option value="">— Chọn —</option>
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
        </select>
      </Field>

      <Field label="Ngày sinh">
        <input
          type="date"
          value={form.dob}
          onChange={set("dob")}
          className="input-base"
        />
      </Field>

      <Field label="Ngày mất">
        <input
          type="date"
          value={form.dod}
          onChange={set("dod")}
          className="input-base"
        />
      </Field>

      <Field label="Ảnh đại diện (URL)">
        <input
          value={form.avatar}
          onChange={set("avatar")}
          className="input-base"
          placeholder="https://..."
        />
      </Field>

      <Field label="Tiểu sử">
        <textarea
          value={form.biography}
          onChange={set("biography")}
          rows={3}
          className="input-base resize-none"
        />
      </Field>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
        >
          {isSaving ? "Đang lưu..." : "Lưu"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-2 rounded-lg transition-colors"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
