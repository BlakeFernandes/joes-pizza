import { prisma } from "..";

module.exports = async () => {
  try {
    console.log("Connecting Prisma to the database...");
    await prisma.$connect();
    console.log("Prisma connected to the database.");
  } catch (error) {
    console.error("Prisma failed to connect to the database:", error);
    return;
  } finally {
    await prisma.$disconnect(); // Make sure to disconnect when done.
  }
};
