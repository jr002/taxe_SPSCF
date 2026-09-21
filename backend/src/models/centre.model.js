const prisma = require('../config/prisma');

const CENTRE_TYPES = ['Centre Fiscal', 'SRE', 'DGE', 'autre'];

class CentreModel {
  static async create(data) {
    return prisma.centres.create({
      data: {
        nom_centre: data.nom_centre,
        type_centre: data.type_centre,
        numero_centre: data.numero_centre,
        email_centre: data.email_centre || null,
        telephone_centre: data.telephone_centre || null,
      },
    });
  }

  static async findAll() {
    return prisma.centres.findMany({
      orderBy: { nom_centre: 'asc' },
      include: { _count: { select: { contribuables: true } } },
    });
  }

  static async findById(id) {
    const numericId = parseInt(id, 10);
    if (Number.isNaN(numericId)) return null;

    return prisma.centres.findUnique({
      where: { id_centre: numericId },
      include: { _count: { select: { contribuables: true } } },
    });
  }

  static async update(id, data) {
    const numericId = parseInt(id, 10);
    if (Number.isNaN(numericId)) return null;

    const updateData = {};
    for (const field of ['nom_centre', 'type_centre', 'numero_centre', 'email_centre', 'telephone_centre']) {
      if (data[field] !== undefined) updateData[field] = data[field] || null;
    }
    updateData.date_modification = new Date();

    try {
      return await prisma.centres.update({
        where: { id_centre: numericId },
        data: updateData,
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      throw error;
    }
  }

  static async delete(id) {
    const numericId = parseInt(id, 10);
    if (Number.isNaN(numericId)) return null;

    try {
      return await prisma.centres.delete({ where: { id_centre: numericId } });
    } catch (error) {
      if (error.code === 'P2025') return null;
      throw error;
    }
  }
}

module.exports = { CentreModel, CENTRE_TYPES };
