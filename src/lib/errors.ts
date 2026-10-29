import { Prisma } from "@/generated/prisma/client";
import { ZodError } from "zod";

/**
 * Sanitizes technical, database, and system errors into clean, user-friendly
 * Tagalog / English messages. Prevents internal database schemas, column names,
 * and stack traces from ever leaking into the UI.
 */
export function sanitizeError(
  err: unknown,
  fallbackMessage: string = "Nagkaroon ng hindi inaasahang problema. Pakisubukan muli."
): string {
  // Always log full technical error details to server console for troubleshooting
  console.error("[ServerError]:", err);

  if (!err) {
    return fallbackMessage;
  }

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    if (firstIssue) {
      return firstIssue.message || "Pakisuri ang mga inilagay na impormasyon.";
    }
    return "May maling impormasyon sa form. Pakisuri muli.";
  }

  // Handle Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        const target = (err.meta?.target as string[]) || [];
        if (target.includes("barcode")) {
          return "Mayroon nang nakarehistrong paninda na may kaparehong barcode.";
        }
        if (target.includes("name")) {
          return "Mayroon nang nakarehistro na may kaparehong pangalan.";
        }
        return "Mayroon nang katulad na talaan sa database (duplicate entry).";
      }

      case "P2003":
        return "Hindi maipagpatuloy dahil may kaugnay na talaan na hindi mahanap o nagamit na.";

      case "P2025":
        return "Hindi natagpuan ang talaan sa database o maaari itong nabura na.";

      default:
        return fallbackMessage;
    }
  }

  // Handle Database Connection Errors
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return "Hindi makakonekta sa database. Pakisuri kung umaandar ang local PostgreSQL service.";
  }

  // Handle standard Error instances with safe, known messages
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes("econnrefused") || msg.includes("connection terminated")) {
      return "Nawalan ng koneksyon sa database. Pakisubukan muli makalipas ang ilang sandali.";
    }
    // If the error message was intentionally thrown as a business logic error without sensitive data
    if (!msg.includes("prisma") && !msg.includes("select") && !msg.includes("insert") && !msg.includes("update") && !msg.includes("table")) {
      return err.message;
    }
  }

  return fallbackMessage;
}
