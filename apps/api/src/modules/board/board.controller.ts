import type { Response } from "express";
import { db } from "../../../../../packages/database/src/client";
import type { BareSessionRequest } from "../../types";

export async function getBoardBySlug(req: BareSessionRequest, res: Response) {
    const userId = req.auth?.id;
    const { slug } = req.params;
    const board = await db.board.findFirst({
        where: { slug, applicationId: req.application?.id },
        select: {
            id: true,
            name: true,
            slug: true,
            feedbacks: {
                where: {
                    OR: req.query.search ? [
                        { title: { contains: req.query.search as string } },
                        { description: { contains: req.query.search as string } },
                    ] : undefined
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    status: true,
                    slug: true,
                    votes: {
                        select: {
                            authorId: true,
                        },
                    },
                    _count: {
                        select: {
                            votes: true,
                            activities: true,
                        },
                    },
                },
            },
        },
    });

    if (!board) {
        res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
        return;
    }

    res.status(200).json({
        id: board.id,
        name: board.name,
        slug: board.slug,
        feedbacks: board.feedbacks.map(feedback => ({
            id: feedback.id,
            title: feedback.title,
            description: feedback.description,
            status: feedback.status,
            slug: feedback.slug,
            votes: feedback._count.votes,
            activities: feedback._count.activities,
            votedByMe: feedback.votes.some(vote => vote.authorId === userId),
        })),
    });
}
