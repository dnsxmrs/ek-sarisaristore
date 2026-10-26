import { z } from "zod";

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Kinakailangan ang pangalan ng suki (Customer name is required)")
    .max(120, "Masyadong mahaba ang pangalan (Max 120 characters)"),
  nickname: z
    .string()
    .trim()
    .transform((val) => (val.length === 0 ? null : val))
    .nullable()
    .optional(),
  phone: z
    .string()
    .trim()
    .transform((val) => (val.length === 0 ? null : val))
    .nullable()
    .optional(),
  email: z
    .string()
    .trim()
    .transform((val) => (val.length === 0 ? null : val))
    .nullable()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Hindi wastong email format (Invalid email address)",
    }),
  notes: z
    .string()
    .trim()
    .transform((val) => (val.length === 0 ? null : val))
    .nullable()
    .optional(),
  isActive: z.boolean().default(true),
});

export type CustomerInput = z.input<typeof customerSchema>;
export type CustomerParsed = z.infer<typeof customerSchema>;

export const debtRecordSchema = z.object({
  customerId: z.string().min(1, "Pumili ng suki (Customer is required)"),
  amount: z.coerce
    .number({
      error: "Wastong halaga ang kailangan (Valid amount required)",
    })
    .min(0.25, "Dapat hindi bababa sa ₱0.25 ang halaga (Minimum ₱0.25)")
    .max(999999.99, "Masyadong mataas ang halaga"),
  description: z
    .string()
    .trim()
    .transform((val) => (val.length === 0 ? null : val))
    .nullable()
    .optional(),
  photoUrl: z
    .string()
    .trim()
    .transform((val) => (val.length === 0 ? null : val))
    .nullable()
    .optional(),
  dueDate: z
    .string()
    .trim()
    .transform((val) => (val ? new Date(val) : null))
    .nullable()
    .optional(),
});

export type DebtRecordInput = z.input<typeof debtRecordSchema>;
export type DebtRecordParsed = z.infer<typeof debtRecordSchema>;

export const debtPaymentSchema = z.object({
  customerId: z.string().min(1, "Kinakailangan ang suki"),
  debtRecordId: z
    .string()
    .trim()
    .transform((val) => (val.length === 0 ? null : val))
    .nullable()
    .optional(),
  amount: z.coerce
    .number({
      error: "Wastong halaga ang kailangan (Valid payment amount required)",
    })
    .min(0.25, "Dapat hindi bababa sa ₱0.25 ang bayad")
    .max(999999.99, "Masyadong mataas ang halaga"),
  notes: z
    .string()
    .trim()
    .transform((val) => (val.length === 0 ? null : val))
    .nullable()
    .optional(),
});

export type DebtPaymentInput = z.input<typeof debtPaymentSchema>;
export type DebtPaymentParsed = z.infer<typeof debtPaymentSchema>;
