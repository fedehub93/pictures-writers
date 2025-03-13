const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function migrateCategories() {
  const posts = await prisma.post.findMany({
    where: { categoryId: { not: null } },
    select: { id: true, categoryId: true },
  });

  for (const post of posts) {
    if (post.categoryId) {
      await prisma.postCategory.create({
        data: {
          postId: post.id,
          categoryId: post.categoryId,
          sort: 0,
        },
      });
    }
  }

  console.log("Migrazione completata!");
}

migrateCategories()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
