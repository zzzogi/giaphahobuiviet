import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

const getGender = () => (Math.random() > 0.5 ? "male" : "female");

// DOB theo thế hệ (cách nhau ~22–28 năm)
const randomDOB = (generation: number) => {
  const baseYear = 1900 + generation * 25;

  const date = faker.date.birthdate({
    min: baseYear,
    max: baseYear + 5,
    mode: "year",
  });

  return date.toISOString().split("T")[0];
};

// DOD hợp lý
const randomDOD = (dob: string, generation: number) => {
  const birthYear = new Date(dob).getFullYear();

  // Đời sâu hơn → khả năng còn sống cao hơn
  const deathChance = generation < 6 ? 0.8 : generation < 10 ? 0.5 : 0.2;

  if (Math.random() > deathChance) return null;

  const deathYear = faker.number.int({
    min: birthYear + 50,
    max: birthYear + 90,
  });

  return faker.date
    .birthdate({ min: deathYear, max: deathYear, mode: "year" })
    .toISOString()
    .split("T")[0];
};

async function createPerson(parentId: string | null, generation: number) {
  const gender = getGender();
  const dob = randomDOB(generation);
  const dod = randomDOD(dob, generation);

  return prisma.person.create({
    data: {
      name: faker.person.fullName({
        sex: gender === "male" ? "male" : "female",
      }),
      gender,
      dob,
      dod,
      biography: faker.lorem.sentences(2),
      parentId,
    },
  });
}

async function createSpouse(personId: string) {
  const gender = getGender();

  const dob = faker.date
    .birthdate({ min: 1920, max: 2010, mode: "year" })
    .toISOString()
    .split("T")[0];

  const dod = randomDOD(dob, 5);

  return prisma.person.create({
    data: {
      name: faker.person.fullName({
        sex: gender === "male" ? "male" : "female",
      }),
      gender,
      dob,
      dod,
      biography: faker.lorem.sentence(),
      isSpouseOf: personId,
    },
  });
}

async function main() {
  await prisma.person.deleteMany();
  console.log("🗑️ Cleared old data");

  let total = 0;

  // ROOT
  let current = await createPerson(null, 0);
  await createSpouse(current.id);
  total += 2;

  // ── BUILD DEEP TREE (12 GENERATIONS) ──
  for (let gen = 1; gen <= 12; gen++) {
    // mỗi đời chỉ 1–2 con → cây sâu
    const childrenCount = faker.number.int({ min: 2, max: 4 });

    let next = null;

    for (let i = 0; i < childrenCount; i++) {
      const child = await createPerson(current.id, gen);
      total++;

      // chọn 1 đứa để đi tiếp dòng chính
      if (i === 0) {
        next = child;
      }

      // 70% có spouse
      if (Math.random() < 0.7) {
        await createSpouse(child.id);
        total++;
      }
    }

    // đi sâu theo 1 nhánh
    current = next;
  }

  console.log("✅ Deep tree created!");
  console.log(`🌳 Generations: 12`);
  console.log(`👨‍👩‍👧‍👦 Total people: ${total}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
