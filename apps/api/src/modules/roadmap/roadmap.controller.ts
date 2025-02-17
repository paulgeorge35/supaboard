import type { BareSessionRequest } from "@/types"
import { db, roadmapDetailSelect, roadmapSummarySelect } from "@repo/database"
import type { Response } from "express"
import { z } from "zod"

const generateUniqueSlug = async (name: string, applicationId: string, existingSlug?: string) => {
    const slug = name.toLowerCase().replace(/ /g, '-')

    if (existingSlug) {
        const existing = await db.roadmap.findFirst({ where: { slug: existingSlug, applicationId } })
        if (existing) {
            return generateUniqueSlug(`${name}-${existing.id}`, applicationId, existingSlug)
        }
        return existingSlug
    }

    const existing = await db.roadmap.findFirst({ where: { slug, applicationId } })

    if (existing) {
        return generateUniqueSlug(`${name}-${existing.id}`, applicationId)
    }

    return slug
}

const createRoadmapSchema = z.object({
    name: z.string().min(1).max(100),
})

const createRoadmap = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!;
    const name = createRoadmapSchema.parse(req.body).name;

    const slug = await generateUniqueSlug(name, applicationId)

    const roadmap = await db.roadmap.create({ select: roadmapSummarySelect, data: { name, slug, applicationId } })

    res.status(201).json(roadmap)
}

const duplicateRoadmap = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!
    const roadmapSlug = req.params.roadmapSlug

    const roadmap = await db.roadmap.findUnique({ where: { applicationId_slug: { applicationId, slug: roadmapSlug } } })

    if (!roadmap) {
        res.status(404).json({ error: "Roadmap not found" })
        return;
    }

    const slug = await generateUniqueSlug(roadmap.name, roadmap.applicationId, `${roadmap.slug}-copy`)

    const newRoadmap = await db.roadmap.create({ select: roadmapSummarySelect, data: { name: `${roadmap.name} (Copy)`, slug, applicationId: roadmap.applicationId } })

    res.status(201).json(newRoadmap)
}

const renameRoadmap = async (req: BareSessionRequest, res: Response) => {
    const roadmapSlug = req.params.roadmapSlug
    const name = createRoadmapSchema.parse(req.body).name

    const roadmap = await db.roadmap.update({ select: roadmapSummarySelect, where: { slug: roadmapSlug }, data: { name } })

    res.status(200).json(roadmap)
}

const deleteRoadmap = async (req: BareSessionRequest, res: Response) => {
    const roadmapSlug = req.params.roadmapSlug

    const isLastRoadmap = await db.roadmap.count({ where: { applicationId: req.application?.id! } }) === 1

    if (isLastRoadmap) {
        res.status(400).json({ error: "Cannot delete the last roadmap" })
        return;
    }

    await db.roadmap.delete({ where: { slug: roadmapSlug } })

    res.status(200).json({ success: true })
}

const addToRoadmap = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!
    const { roadmapSlug, feedbackId } = req.params;

    const roadmap = await db.roadmap.findUnique({ where: { applicationId_slug: { applicationId, slug: roadmapSlug } } })

    if (!roadmap) {
        res.status(404).json({ error: "Roadmap not found" })
        return;
    }

    const feedback = await db.feedback.findUnique({ where: { id: feedbackId } })

    if (!feedback) {
        res.status(404).json({ error: "Feedback not found" })
        return;
    }

    await db.roadmapItem.create({ data: { roadmapId: roadmap.id, feedbackId: feedback.id } })

    res.status(200).json({ success: true })
}

const removeFromRoadmap = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!
    const { roadmapSlug, feedbackId } = req.params;

    const roadmap = await db.roadmap.findUnique({ where: { applicationId_slug: { applicationId, slug: roadmapSlug } } })

    if (!roadmap) {
        res.status(404).json({ error: "Roadmap not found" })
        return;
    }

    await db.roadmapItem.delete({ where: { feedbackId_roadmapId: { feedbackId, roadmapId: roadmap.id } } })

    res.status(200).json({ success: true })
}

const getAllRoadmaps = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!

    const roadmaps = await db.roadmap.findMany({
        select: roadmapSummarySelect,
        where: { applicationId },
        orderBy: { createdAt: "desc" }
    })
    res.status(200).json(roadmaps)
}

const getRoadmapBySlug = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!
    const roadmapSlug = req.params.roadmapSlug

    const roadmap = await db.roadmap.findUnique({ select: roadmapDetailSelect, where: { applicationId_slug: { applicationId, slug: roadmapSlug } } });

    if (!roadmap) {
        res.status(404).json({ error: "Roadmap not found" })
        return;
    }

    res.status(200).json({
        ...roadmap,
        items: roadmap.items.map((item) => ({
            ...item.feedback,
            impact: item.impact,
            effort: item.effort,
            tags: item.feedback.tags.map((tag) => tag.name),
            votes: item.feedback._count.votes,
            _count: undefined,
        })),
    })
}

const updateRoadmapItemSchema = z.object({
    impact: z.number().min(0).max(10).optional(),
    effort: z.number().min(0).max(100).optional(),
})

const updateRoadmapItem = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!
    const { roadmapSlug, feedbackId } = req.params;
    const { impact, effort } = updateRoadmapItemSchema.parse(req.body);

    const roadmap = await db.roadmap.findUnique({ where: { applicationId_slug: { applicationId, slug: roadmapSlug } } })

    if (!roadmap) {
        res.status(404).json({ error: "Roadmap not found" })
        return;
    }

    await db.roadmapItem.update({ where: { feedbackId_roadmapId: { feedbackId, roadmapId: roadmap.id } }, data: { impact, effort } })

    res.status(200).json({ success: true })
}

export default {
    getAll: getAllRoadmaps,
    getBySlug: getRoadmapBySlug,
    create: createRoadmap,
    delete: deleteRoadmap,
    duplicate: duplicateRoadmap,
    rename: renameRoadmap,
    add: addToRoadmap,
    remove: removeFromRoadmap,
    update: updateRoadmapItem,
}