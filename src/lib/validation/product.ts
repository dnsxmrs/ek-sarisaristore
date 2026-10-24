import { z } from "zod";

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Kinakailangan ang pangalan ng produkto (Product name is required)")
    .max(150, "Masyadong mahaba ang pangalan ng produkto (Maximum 150 characters)"),
  sellingPrice: z
    .coerce
    .number({
      error: "Wastong presyo ang kailangan (Valid price is required)",
    })
    .min(0, "Hindi maaaring negatibo ang presyo (Price cannot be negative)")
    .max(999999.99, "Masyadong mataas ang presyo (Maximum price exceeded)"),
  barcode: z
    .string()
    .trim()
    .transform((val) => (val.length === 0 ? null : val))
    .nullable()
    .optional(),
  categoryId: z
    .string()
    .trim()
    .transform((val) => (val.length === 0 ? null : val))
    .nullable()
    .optional(),
  description: z
    .string()
    .trim()
    .transform((val) => (val.length === 0 ? null : val))
    .nullable()
    .optional(),
  isActive: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;
