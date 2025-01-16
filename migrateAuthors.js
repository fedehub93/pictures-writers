const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function migrateAuthors() {
  try {
    // Trova tutti i post con un autore esistente
    const posts = await prisma.post.findMany({
      where: {
        userId: { not: null },
      },
      select: {
        id: true,
        userId: true,
      },
    });

    // Aggiorna ogni post aggiungendo l'utente al campo authors
    for (const post of posts) {
      await prisma.postAuthor.create({
        data: {
          postId: post.id,
          userId: post.userId,
          sort: 0,
        },
      });
      // await prisma.post.update({
      //   where: { id: post.id },
      //   data: {
      //     authors: {
      //       connect: { id: post.userId }, // Collega l'autore esistente
      //     },
      //   },
      // });
    }

    console.log(`Migration completed for ${posts.length} posts.`);
  } catch (error) {
    console.error("Error migrating authors:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateAuthors();
