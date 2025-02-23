import * as Bun from 'bun';
import { DomainStatus, FeedbackStatus, Language, Priority, PrismaClient, Role, Theme } from '../generated/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  try {
    // Clear existing data
    await prisma.$transaction([
      prisma.vote.deleteMany(),
      prisma.activity.deleteMany(),
      prisma.feedback.deleteMany(),
      prisma.tag.deleteMany(),
      prisma.board.deleteMany(),
      prisma.member.deleteMany(),
      prisma.application.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    // Create admin user
    const adminPassword = await Bun.password.hash('admin123');
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: adminPassword,
      },
    });

    // Create regular users
    const regularPassword = await Bun.password.hash('user123');
    const users = await Promise.all(
      Array.from({ length: 5 }).map((_, index) =>
        prisma.user.create({
          data: {
            email: `user${index + 1}@example.com`,
            password: regularPassword,
          },
        })
      )
    );

    // Create applications
    const applications = await Promise.all([
      prisma.application.create({
        data: {
          name: 'Project Alpha',
          subdomain: 'alpha',
          customDomain: 'feedback.alpha.com',
          domainStatus: DomainStatus.VERIFIED,
          color: '#FF5733',
          preferredTheme: Theme.SYSTEM,
          preferredLanguage: Language.EN,
          ownerId: adminUser.id,
        },
      }),
      prisma.application.create({
        data: {
          name: 'Beta App',
          subdomain: 'beta',
          domainStatus: DomainStatus.PENDING,
          color: '#33FF57',
          preferredTheme: Theme.DARK,
          preferredLanguage: Language.EN,
          ownerId: users[0].id,
        },
      }),
    ]);

    // Create members
    await Promise.all(
      applications.flatMap((app) =>
        users.map((user) =>
          prisma.member.create({
            data: {
              role: Role.COLLABORATOR,
              userId: user.id,
              applicationId: app.id,
            },
          })
        )
      )
    );

    // Create tags for each application
    const tags = await Promise.all(
      applications.flatMap((app) => [
        prisma.tag.create({
          data: {
            name: 'Bug',
            color: '#FF0000',
            applicationId: app.id,
          },
        }),
        prisma.tag.create({
          data: {
            name: 'Feature',
            color: '#00FF00',
            applicationId: app.id,
          },
        }),
        prisma.tag.create({
          data: {
            name: 'Enhancement',
            color: '#0000FF',
            applicationId: app.id,
          },
        }),
      ])
    );

    // Create boards for each application
    const boards = await Promise.all(
      applications.map((app) =>
        prisma.board.create({
          data: {
            name: 'Feature Requests',
            url: '/feature-requests',
            public: true,
            applicationId: app.id,
          },
        })
      )
    );

    // Create feedback items
    const feedbacks = await Promise.all(
      boards.flatMap((board) =>
        Array.from({ length: 3 }).map((_, index) =>
          prisma.feedback.create({
            data: {
              title: `Feedback ${index + 1} for ${board.name}`,
              description: `This is a detailed description for feedback ${index + 1}`,
              status: FeedbackStatus.OPEN,
              priority: Priority.MEDIUM,
              applicationId: board.applicationId,
              boardId: board.id,
              authorId: users[index % users.length].id,
              tags: {
                connect: [{ id: tags[index % tags.length].id }],
              },
            },
          })
        )
      )
    );

    // Create votes
    await Promise.all(
      feedbacks.flatMap((feedback) =>
        users.slice(0, 3).map((user) =>
          prisma.vote.create({
            data: {
              feedbackId: feedback.id,
              authorId: user.id,
            },
          })
        )
      )
    );

    console.log('Seed data created successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
