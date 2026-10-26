import { z } from "zod";

export const saleItemInputSchema = z.object({
  productId: z
    .string()
    .trim()
    .transform((val) => (val.length === 0 ? null : val))
    .nullable()
    .optional(),
  productNameSnapshot: z
    .string()
    .trim()
    .min(1, "Kinakailangan ang pangalan ng produkto"),
  unitPriceSnapshot: z.coerce
    .number({ error: "Wastong presyo ang kailangan" })
    .min(0, "Hindi maaaring negatibo ang presyo"),
  quantity: z.coerce
    .number()
    .int("Dapat buong numero ang dami")
    .min(1, "Dapat kahit isang piraso"),
  subtotal: z.coerce
    .number()
    .min(0, "Hindi maaaring negatibo ang subtotal"),
});

export const createSaleSchema = z.object({
  items: z
    .array(saleItemInputSchema)
    .min(1, "Magdagdag ng kahit isang paninda sa benta"),
  totalAmount: z.coerce
    .number({ error: "Wastong kabuuang halaga ang kailangan" })
    .min(0.01, "Hindi maaaring zero ang kabuuan"),
  cashReceived: z.coerce
    .number({ error: "Wastong bayad ang kailangan" })
    .min(0, "Hindi maaaring negatibo ang binayad"),
  changeAmount: z.coerce
    .number()
    .min(0, "Hindi maaaring negatibo ang sukli")
    .default(0),
  paymentMethod: z.enum(["CASH", "GCASH"]).default("CASH"),
  notes: z
    .string()
    .trim()
    .transform((val) => (val.length === 0 ? null : val))
    .nullable()
    .optional(),
});

export type SaleItemInput = z.input<typeof saleItemInputSchema>;
export type SaleItemParsed = z.infer<typeof saleItemInputSchema>;

export type CreateSaleInput = z.input<typeof createSaleSchema>;
export type CreateSaleParsed = z.infer<typeof createSaleSchema>;
