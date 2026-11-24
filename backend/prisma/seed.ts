import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with demo user and Ethereal SMTP senders...');

  const demoUser = await prisma.user.upsert({
    where: { email: 'oliver.brown@domain.io' },
    update: {},
    create: {
      email: 'oliver.brown@domain.io',
      name: 'Oliver Brown',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
    },
  });

  // Generate 2 real Ethereal test accounts automatically
  for (let i = 1; i <= 2; i++) {
    const testAccount = await nodemailer.createTestAccount();
    await prisma.sender.upsert({
      where: {
        userId_email: {
          userId: demoUser.id,
          email: testAccount.user,
        },
      },
      update: {
        smtpUser: testAccount.user,
        smtpPass: testAccount.pass,
      },
      create: {
        userId: demoUser.id,
        email: testAccount.user,
        name: `Sender ${i} (${testAccount.user.split('@')[0]})`,
        smtpHost: testAccount.smtp.host,
        smtpPort: testAccount.smtp.port,
        smtpUser: testAccount.user,
        smtpPass: testAccount.pass,
      },
    });
    console.log(`✅ Created Ethereal Sender ${i}: ${testAccount.user}`);
  }

  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });