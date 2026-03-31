const BASE = "/api/tree";

export type PersonInput = {
  name: string;
  gender?: "male" | "female";
  avatar?: string;
  dob?: string;
  dod?: string;
  biography?: string;
  parentId?: string;
  isSpouseOf?: string;
};

export async function fetchTree() {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error("Không thể tải cây gia phả");
  return res.json();
}

export async function createPerson(data: PersonInput) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Tạo thất bại");
  return res.json();
}

export async function updatePerson(id: string, data: Partial<PersonInput>) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Cập nhật thất bại");
  return res.json();
}

export async function deletePerson(id: string) {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json()).error ?? "Xóa thất bại");
  return res.json();
}
