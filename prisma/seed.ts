import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Configure SQLite PRAGMAs
  console.log("⚙️  Configuring SQLite PRAGMAs...");
  await prisma.$queryRawUnsafe("PRAGMA journal_mode=WAL;");
  await prisma.$queryRawUnsafe("PRAGMA busy_timeout=5000;");
  await prisma.$queryRawUnsafe("PRAGMA synchronous=NORMAL;");
  await prisma.$queryRawUnsafe("PRAGMA foreign_keys=ON;");

  // Verify journal mode
  const journalModeResult: unknown = await prisma.$queryRawUnsafe("PRAGMA journal_mode;");
  console.log("📊 SQLite journal_mode is:", journalModeResult);

  // 2. Clean existing data in reverse dependency order
  console.log("🧹 Cleaning existing data...");
  await prisma.clinicTicket.deleteMany({});
  await prisma.recruitApplication.deleteMany({});
  await prisma.recruitBatch.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.user.deleteMany({});

  // 3. Seed Users
  console.log("👥 Seeding users...");
  const adminPassword = await hash("Admin123!");
  const techPassword = await hash("Tech123!");
  const studentPassword = await hash("Student123!");

  const admin = await prisma.user.create({
    data: {
      student_id: "admin",
      name: "超级管理员",
      phone: "13800000000",
      role: "ADMIN",
      hashed_password: adminPassword,
    },
  });

  const technician = await prisma.user.create({
    data: {
      student_id: "tech01",
      name: "李技师",
      phone: "13800000001",
      role: "MEMBER",
      hashed_password: techPassword,
    },
  });

  const student1 = await prisma.user.create({
    data: {
      student_id: "20240001",
      name: "张三同学",
      phone: "13800000002",
      role: "USER",
      hashed_password: studentPassword,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      student_id: "20240002",
      name: "李四同学",
      phone: "13800000003",
      role: "USER",
      hashed_password: studentPassword,
    },
  });

  console.log(`✅ Created 4 users: ${admin.student_id}, ${technician.student_id}, ${student1.student_id}, ${student2.student_id}`);

  // 4. Seed Departments
  console.log("🏢 Seeding departments...");
  const techDept = await prisma.department.create({
    data: { name: "技术部" },
  });
  const publicityDept = await prisma.department.create({
    data: { name: "宣传部" },
  });
  const liaisonDept = await prisma.department.create({
    data: { name: "外联部" },
  });
  const academicDept = await prisma.department.create({
    data: { name: "学术部" },
  });

  console.log(`✅ Created 4 departments: ${techDept.name}, ${publicityDept.name}, ${liaisonDept.name}, ${academicDept.name}`);

  // 5. Seed Recruit Batch
  console.log("📅 Seeding recruit batch...");
  const batch = await prisma.recruitBatch.create({
    data: {
      name: "2024年秋季招新",
      is_active: true,
    },
  });
  console.log(`✅ Created active recruit batch: ${batch.name} (${batch.id})`);

  // 6. Seed Sample Recruit Application
  console.log("📝 Seeding recruit application...");
  const application = await prisma.recruitApplication.create({
    data: {
      batch_id: batch.id,
      user_id: student1.id,
      first_choice_id: techDept.id,
      second_choice_id: academicDept.id,
      status: "PENDING",
      intro_text: "对全栈开发、Web 现代架构和开源工具充满热情，熟练掌握 TypeScript 与 React。",
      admin_notes: "简历较强，第一轮可安排技术面试。",
    },
  });
  console.log(`✅ Created recruit application ${application.id} for user ${student1.student_id}`);

  // 7. Seed Clinic Tickets (Including 1 CREATED for race condition tests, 1 ACCEPTED)
  console.log("💻 Seeding clinic tickets...");
  const ticketPending = await prisma.clinicTicket.create({
    data: {
      requester_id: student1.id,
      device_info: "MacBook Pro 14 M2",
      issue_desc: "风扇异响且偶现花屏，怀疑积灰或散热硅脂老化，求协助拆机清理。",
      status: "CREATED",
    },
  });

  const ticketAccepted = await prisma.clinicTicket.create({
    data: {
      requester_id: student2.id,
      technician_id: technician.id,
      device_info: "ThinkPad T14 Gen 3",
      issue_desc: "蓝屏报错 WHEA_UNCORRECTABLE_ERROR，需要重装 Windows 11 专业版。",
      status: "ACCEPTED",
      repair_notes: "已协助备份关键数据并准备官方引导镜像，正在进行全新安装。",
    },
  });

  console.log(`✅ Created clinic tickets:
    - Ticket 1 (ID: ${ticketPending.id}, Status: ${ticketPending.status} - Ready for grab test)
    - Ticket 2 (ID: ${ticketAccepted.id}, Status: ${ticketAccepted.status}, Tech: ${technician.name})`);

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
