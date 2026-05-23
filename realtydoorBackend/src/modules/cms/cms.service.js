const prisma = require('../../lib/prisma');
const ApiError = require('../../utils/ApiError');

async function getPublished(type, skip, limit) {
  const where = { isPublished: true };
  if (type) where.type = type;

  const [data, total] = await prisma.$transaction([
    prisma.contentBlock.findMany({ where, skip, take: limit, orderBy: { publishedAt: 'desc' } }),
    prisma.contentBlock.count({ where }),
  ]);
  return { data, total };
}

async function getBySlug(slug) {
  const block = await prisma.contentBlock.findUnique({ where: { slug, isPublished: true } });
  if (!block) throw new ApiError(404, 'Content not found');
  return block;
}

async function create(data) {
  if (data.isPublished && !data.publishedAt) data.publishedAt = new Date();
  return prisma.contentBlock.create({ data });
}

async function update(id, data) {
  if (data.isPublished && !data.publishedAt) data.publishedAt = new Date();
  return prisma.contentBlock.update({ where: { id }, data });
}

async function remove(id) {
  return prisma.contentBlock.delete({ where: { id } });
}

module.exports = { getPublished, getBySlug, create, update, remove };
