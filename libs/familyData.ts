export interface Person {
  id: string;
  name: string;
  gender?: "male" | "female";
  avatar?: string;
  dob?: string; // "YYYY-MM-DD"
  dod?: string; // "YYYY-MM-DD" — undefined if still alive
  biography?: string;
  spouses?: Person[]; // NEW
  children?: Person[];
}
