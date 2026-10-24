"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validation/product";
import { Prisma } from "@/generated/prisma/client";

export type ActionResult<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Get all available product categories.
 */
export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return categories;
  } catch (err) {
    console.error("Error fetching categories:", err);
    return [];
  }
}

/**
 * Exact barcode lookup (Primary search mechanism for Price Lookup).
 */
export async function getProductByBarcode(rawBarcode: string) {
  try {
    const barcode = rawBarcode.trim();
    if (!barcode) {
      return { success: false, error: "Walang barcode na ibinigay (No barcode provided)" };
    }

    const product = await prisma.product.findFirst({
      where: {
        barcode,
      },
      include: {
        category: true,
      },
    });

    if (!product) {
      return {
        success: false,
        notFound: true,
        barcode,
        error: `Walang nahanap na produkto para sa barcode: ${barcode}`,
      };
    }

    return {
      success: true,
      notFound: false,
      product: {
        ...product,
        sellingPrice: Number(product.sellingPrice),
      },
    };
  } catch (err) {
    console.error("Error looking up barcode:", err);
    return {
      success: false,
      error: "Nagkaroon ng aberya sa paghahanap ng barcode. Subukan muli.",
    };
  }
}

/**
 * Search products by name (partial, case-insensitive) or barcode.
 */
export async function searchProducts(params?: {
  query?: string;
  categoryId?: string;
  isActive?: boolean;
}) {
  try {
    const { query, categoryId, isActive } = params || {};
    const trimmedQuery = query?.trim();

    const where: Prisma.ProductWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (categoryId && categoryId !== "ALL") {
      where.categoryId = categoryId;
    }

    if (trimmedQuery) {
      where.OR = [
        {
          name: {
            contains: trimmedQuery,
            mode: "insensitive",
          },
        },
        {
          barcode: {
            contains: trimmedQuery,
          },
        },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [
        { isActive: "desc" },
        { name: "asc" },
      ],
      take: 50,
    });

    return {
      success: true,
      products: products.map((p) => ({
        ...p,
        sellingPrice: Number(p.sellingPrice),
      })),
    };
  } catch (err) {
    console.error("Error searching products:", err);
    return {
      success: false,
      error: "Hindi makuha ang listahan ng mga produkto. Subukan muli.",
      products: [],
    };
  }
}

/**
 * Get product by ID for editing.
 */
export async function getProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      return null;
    }

    return {
      ...product,
      sellingPrice: Number(product.sellingPrice),
    };
  } catch (err) {
    console.error("Error fetching product by ID:", err);
    return null;
  }
}

/**
 * Create a new product.
 */
export async function createProduct(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = productSchema.safeParse(input);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstErrorMessage =
        Object.values(fieldErrors)[0]?.[0] || "May mali sa mga impormasyong ibinigay.";
      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = parsed.data;

    // Check duplicate barcode if barcode is provided
    if (data.barcode) {
      const existing = await prisma.product.findUnique({
        where: { barcode: data.barcode },
      });

      if (existing) {
        return {
          success: false,
          error: `May nakarehistro nang produkto sa barcode na '${data.barcode}': ${existing.name}`,
          fieldErrors: {
            barcode: [`May nakarehistro nang '${existing.name}' sa barcode na ito.`],
          },
        };
      }
    }

    const created = await prisma.product.create({
      data: {
        name: data.name,
        sellingPrice: new Prisma.Decimal(data.sellingPrice),
        barcode: data.barcode,
        categoryId: data.categoryId,
        description: data.description,
        isActive: data.isActive,
      },
    });

    revalidatePath("/");
    revalidatePath("/products");

    return {
      success: true,
      data: { id: created.id },
      message: `Matagumpay na naidagdag ang '${created.name}'!`,
    };
  } catch (err) {
    console.error("Error creating product:", err);
    return {
      success: false,
      error: "Hindi naisave ang produkto. Pakisuri ang impormasyon at subukan muli.",
    };
  }
}

/**
 * Update an existing product.
 */
export async function updateProduct(
  id: string,
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = productSchema.safeParse(input);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstErrorMessage =
        Object.values(fieldErrors)[0]?.[0] || "May mali sa mga impormasyong ibinigay.";
      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = parsed.data;

    // Check duplicate barcode on other products
    if (data.barcode) {
      const existing = await prisma.product.findFirst({
        where: {
          barcode: data.barcode,
          id: { not: id },
        },
      });

      if (existing) {
        return {
          success: false,
          error: `May ibang produkto nang gumagamit ng barcode na '${data.barcode}': ${existing.name}`,
          fieldErrors: {
            barcode: [`May nakarehistro nang '${existing.name}' sa barcode na ito.`],
          },
        };
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        sellingPrice: new Prisma.Decimal(data.sellingPrice),
        barcode: data.barcode,
        categoryId: data.categoryId,
        description: data.description,
        isActive: data.isActive,
      },
    });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${id}/edit`);

    return {
      success: true,
      data: { id: updated.id },
      message: `Matagumpay na na-update ang '${updated.name}'!`,
    };
  } catch (err) {
    console.error("Error updating product:", err);
    return {
      success: false,
      error: "Hindi na-update ang produkto. Pakisuri ang impormasyon at subukan muli.",
    };
  }
}

/**
 * Soft delete or toggle active status of a product.
 */
export async function toggleProductStatus(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const updated = await prisma.product.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath("/");
    revalidatePath("/products");

    return {
      success: true,
      data: updated,
      message: isActive
        ? `Naibalik sa aktibo ang '${updated.name}'.`
        : `Na-deactivate ang '${updated.name}'.`,
    };
  } catch (err) {
    console.error("Error toggling product status:", err);
    return {
      success: false,
      error: "Hindi nagbago ang status ng produkto.",
    };
  }
}
