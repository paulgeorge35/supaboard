import { db } from "@repo/database";
import { type Response } from "express";
import type { BareSessionRequest } from "../../types";

export async function getApplication(req: BareSessionRequest, res: Response) {
    const application = await db.application.findUnique({
        where: { id: req.application?.id },
    });

    if (!application) {
        res.status(404).json({ error: 'Application not found', code: 'NOT_FOUND' });
        return;
    }

    res.status(200).json(application);
}

export async function getBoards(req: BareSessionRequest, res: Response) {
    const boards = await db.board.findMany({
        where: { applicationId: req.application?.id },
        select: {
            name: true,
            slug: true,
            feedbacks: {
                where: {
                    status: {
                        in: ['PLANNED', 'IN_PROGRESS', 'RESOLVED']
                    }
                },
                select: {
                    id: true,
                    title: true,
                    status: true,
                    slug: true,
                    votes: {
                        select: {
                            authorId: true,
                        }
                    },
                    board: {
                        select: {
                            slug: true,
                            name: true,
                        }
                    },
                    _count: {
                        select: {
                            votes: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    feedbacks: {
                        where: {
                            status: {
                                notIn: ['CLOSED', 'RESOLVED']
                            }
                        },
                    },
                },
            },
        },
    });

    res.status(200).json(boards.map(board => ({
        name: board.name,
        slug: board.slug,
        count: board._count.feedbacks,
        feedbacks: board.feedbacks.map(feedback => ({
            id: feedback.id,
            title: feedback.title,
            status: feedback.status,
            slug: feedback.slug,
            votes: feedback._count.votes,
            votedByMe: feedback.votes.some(vote => vote.authorId === req.auth?.id),
            board: {
                slug: feedback.board.slug,
                name: feedback.board.name,
            },
        })),
    })));
}