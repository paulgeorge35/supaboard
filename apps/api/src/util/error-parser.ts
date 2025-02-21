import type { Response } from "express";
import { z } from "zod";

/**
 * Validates data against a Zod schema and returns the parsed data.
 * If validation fails, sends a 400 response and throws an error.
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param res - Express response object
 * @returns Parsed and typed data
 * @throws Error if validation fails
 */
export const parseAndThrowFirstError = <T>(
    schema: z.ZodSchema<T>, 
    data: unknown, 
    res: Response
): T => {
    const result = schema.safeParse(data);
    if (!result.success) {
        res.status(400).json({ error: result.error.errors[0].message });
        throw new Error(result.error.errors[0].message);
    }
    return result.data;
}