import { ProtocolModel } from "../models/Protocol";

type UpsertProtocolInput = {
  name: string;
  slug: string;
  category?: string | null;
  chains?: string[];
  tvl?: number;
  website?: string | null;
  description?: string | null;
  featured?: boolean;
  lastSyncedAt?: Date | null;
};

export const protocolRepo = {
  async listFeatured(limit: number = 15) {
    return ProtocolModel.find({ featured: true })
      .sort({ tvl: -1, name: 1 })
      .limit(limit)
      .exec();
  },

  async findBySlug(slug: string) {
    return ProtocolModel.findOne({ slug: slug.toLowerCase().trim() }).exec();
  },

  async upsertBySlug(input: UpsertProtocolInput) {
    return ProtocolModel.findOneAndUpdate(
      { slug: input.slug.toLowerCase().trim() },
      {
        $set: {
          name: input.name,
          slug: input.slug.toLowerCase().trim(),
          category: input.category ?? null,
          chains: input.chains ?? [],
          tvl: input.tvl ?? 0,
          website: input.website ?? null,
          description: input.description ?? null,
          featured: input.featured ?? false,
          lastSyncedAt: input.lastSyncedAt ?? new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    ).exec();
  },
};
