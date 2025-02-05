import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { type ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
    console.error('Error:', err);

    if (err instanceof PrismaClientKnownRequestError) {
        res.status(400).json({
            error: 'Database operation failed',
            message: err.message,
        });
        return next();
    }

    if (err instanceof PrismaClientValidationError) {
        res.status(400).json({
            error: 'Invalid data provided',
            message: err.message,
        });
        return next();
    }

    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production' 
            ? 'An unexpected error occurred' 
            : err.message,
    });
    return next();
}; 