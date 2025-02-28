import type { BareSessionRequest } from "@/types"
import { parseAndThrowFirstError } from "@/util/error-parser"
import { addTagsToFeedbacks as addTagsToFeedbacksSql, db, roadmapDetailSelect, roadmapItemSelect, roadmapSummarySelect } from "@repo/database"
import type { Response } from "express"
import { DateTime } from "luxon"
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
    const applicationId = req.application?.id!
    const name = createRoadmapSchema.parse(req.body).name

    const roadmap = await db.roadmap.update({ select: roadmapSummarySelect, where: { applicationId_slug: { applicationId, slug: roadmapSlug } }, data: { name } })

    res.status(200).json(roadmap)
}

const deleteRoadmap = async (req: BareSessionRequest, res: Response) => {
    const roadmapSlug = req.params.roadmapSlug
    const applicationId = req.application?.id!

    const isLastRoadmap = await db.roadmap.count({ where: { applicationId: req.application?.id! } }) === 1

    if (isLastRoadmap) {
        res.status(400).json({ error: "Cannot delete the last roadmap" })
        return;
    }

    await db.roadmap.delete({ where: { applicationId_slug: { applicationId, slug: roadmapSlug } } })

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

const getRoadmapsSchema = z.object({
    isArchived: z.coerce.boolean().default(false),
})

const getAllRoadmaps = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!
    const { isArchived } = parseAndThrowFirstError(getRoadmapsSchema, req.query, res);

    const roadmaps = await db.roadmap.findMany({
        select: roadmapSummarySelect,
        where: { applicationId, isArchived, },
        orderBy: { createdAt: "asc" }
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
    
    const maxVotes = roadmap.items.reduce((max, item) => 
        Math.max(max, item.feedback._count.votes), 0);
    
    const weights = {
        impact: 1,
        votes: 1,
        effort: 1
    };

    res.status(200).json({
        ...roadmap,
        items: roadmap.items.map((item) => {
            const voteScore = maxVotes ? (item.feedback._count.votes / maxVotes) * 100 : 0;
            const score = item.effort > 0 ? Math.round(
                1000 * (
                    (Math.pow(item.impact, 2) * weights.impact) +
                    (voteScore * weights.votes)
                ) / (item.effort * weights.effort)
            ) : 0;
            
            return {
                ...item.feedback,
                impact: item.impact,
                effort: item.effort,
                tags: item.feedback.tags.map((tag) => tag.name),
                votes: item.feedback._count.votes,
                score: score,
                _count: undefined,
            };
        }),
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

const archiveRoadmap = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!
    const roadmapSlug = req.params.roadmapSlug

    const count = await db.roadmap.count({ where: { applicationId, isArchived: false } })

    if (count === 1) {
        res.status(400).json({ error: "Cannot archive the last roadmap" })
        return;
    }

    await db.roadmap.update({ where: { applicationId_slug: { applicationId, slug: roadmapSlug } }, data: { isArchived: true } })

    res.status(200).json({ success: true })
}

const restoreRoadmap = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!
    const roadmapSlug = req.params.roadmapSlug

    await db.roadmap.update({ where: { applicationId_slug: { applicationId, slug: roadmapSlug } }, data: { isArchived: false } })

    res.status(200).json({ success: true })
}

const updateRoadmapSettingsSchema = z.object({
    isPublic: z.boolean().optional(),
    includeInRoadmap: z.array(z.string()).optional(),
})

const updateRoadmapSettings = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!
    const { isPublic, includeInRoadmap } = parseAndThrowFirstError(updateRoadmapSettingsSchema, req.body, res);

    await db.$transaction(async (tx) => {
        await tx.application.update({ where: { id: applicationId }, data: { isRoadmapPublic: isPublic } })

        if (includeInRoadmap) {
            await tx.board.updateMany({ where: { applicationId }, data: { includeInRoadmap: false } })
            await tx.board.updateMany({ where: { applicationId, slug: { in: includeInRoadmap } }, data: { includeInRoadmap: true } })
        }
    });

    res.status(200).json({ success: true })
}

const addFeedbacksToRoadmapSchema = z.object({
    feedbackIds: z.array(z.string()),
    roadmapId: z.string(),
})

const addFeedbacksToRoadmap = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!
    const { feedbackIds, roadmapId } = parseAndThrowFirstError(addFeedbacksToRoadmapSchema, req.body, res);

    const feedbacks = await db.feedback.findMany({ where: { id: { in: feedbackIds }, applicationId } })

    if (feedbacks.length !== feedbackIds.length) {
        res.status(400).json({ error: "Some feedbacks not found" })
        return;
    }

    if (feedbacks.length === 0) {
        res.status(400).json({ error: "No feedbacks to add" })
        return;
    }

    await db.roadmapItem.createMany({ data: feedbacks.map((feedback) => ({ feedbackId: feedback.id, roadmapId })) });

    res.status(200).json({ success: true })
}

const moveFeedbacksToBoardSchema = z.object({
    feedbackIds: z.array(z.string()),
    boardSlug: z.string(),
})

const moveFeedbacksToBoard = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!
    const { feedbackIds, boardSlug } = parseAndThrowFirstError(moveFeedbacksToBoardSchema, req.body, res);

    const board = await db.board.findUnique({ where: { applicationId_slug: { applicationId, slug: boardSlug } } })

    if (!board) {
        res.status(404).json({ error: "Board not found" })
        return;
    }

    const feedbacks = await db.feedback.findMany({ where: { id: { in: feedbackIds }, applicationId } })

    if (feedbacks.length !== feedbackIds.length) {
        res.status(400).json({ error: "Some feedbacks not found" })
        return;
    }

    if (feedbacks.length === 0) {
        res.status(400).json({ error: "No feedbacks to move" })
        return;
    }

    await db.feedback.updateMany({ where: { id: { in: feedbackIds }, applicationId }, data: { boardId: board.id } })

    res.status(200).json({ success: true })
}

const changeOwnerSchema = z.object({
    feedbackIds: z.array(z.string()),
    newOwnerId: z.string(),
})

const changeOwner = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!
    const { feedbackIds, newOwnerId } = parseAndThrowFirstError(changeOwnerSchema, req.body, res);

    const feedbacks = await db.feedback.findMany({ where: { id: { in: feedbackIds }, applicationId } })

    if (feedbacks.length !== feedbackIds.length) {
        res.status(400).json({ error: "Some feedbacks not found" })
        return;
    }

    if (feedbacks.length === 0) {
        res.status(400).json({ error: "No feedbacks to change owner" })
        return;
    }
    
    const owner = await db.user.findFirst({ where: { id: newOwnerId, members: { some: { applicationId } } } })

    if (!owner) {
        res.status(400).json({ error: "Owner not found" })
        return;
    }

    await db.feedback.updateMany({ where: { id: { in: feedbacks.map((feedback) => feedback.id) }, applicationId }, data: { ownerId: owner.id } })

    res.status(200).json({ success: true })
}

const changeCategorySchema = z.object({
    feedbackIds: z.array(z.string()),
    newCategoryId: z.string(),
})

const changeCategory = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!
    const { feedbackIds, newCategoryId } = parseAndThrowFirstError(changeCategorySchema, req.body, res);

    const feedbacks = await db.feedback.findMany({ where: { id: { in: feedbackIds }, applicationId }, include: { board: true } })

    if (feedbacks.length !== feedbackIds.length) {
        res.status(400).json({ error: "Some feedbacks not found" })
        return;
    }

    if (feedbacks.length === 0) {
        res.status(400).json({ error: "No feedbacks to change category" })
        return;
    }

    const boards = await db.board.findMany({ where: { applicationId, slug: { in: feedbacks.map((feedback) => feedback.board.slug) } } })

    if (boards.length > 1) {
        res.status(400).json({ error: "Not all feedbacks belong to the same board" })
        return;
    }

    const category = await db.feedbackCategory.findUnique({ where: { id: newCategoryId } })

    if (!category) {
        res.status(400).json({ error: "Category not found" })
        return;
    }

    await db.feedback.updateMany({ where: { id: { in: feedbacks.map((feedback) => feedback.id) }, applicationId }, data: { categoryId: category.id } })

    res.status(200).json({ success: true })
}

const addTagsToFeedbacksSchema = z.object({
    feedbackIds: z.array(z.string()),
    tagIds: z.array(z.string()),
})

const addTagsToFeedbacks = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!
    const { feedbackIds, tagIds } = parseAndThrowFirstError(addTagsToFeedbacksSchema, req.body, res);

    const feedbacks = await db.feedback.findMany({ where: { id: { in: feedbackIds }, applicationId }, include: { board: true } })

    if (feedbacks.length !== feedbackIds.length) {
        res.status(400).json({ error: "Some feedbacks not found" })
        return;
    }

    if (feedbacks.length === 0) {
        res.status(400).json({ error: "No feedbacks to add tags to" })
        return;
    }
    
    const boards = await db.board.findMany({ where: { applicationId, slug: { in: feedbacks.map((feedback) => feedback.board.slug) } } })

    if (boards.length !== 1) {
        res.status(400).json({ error: "Not all feedbacks belong to the same board" })
        return;
    }

    const tags = await db.tag.findMany({ where: { id: { in: tagIds }, boardId: boards[0].id } })

    if (tags.length !== tagIds.length) {
        res.status(400).json({ error: "Some tags not found" })
        return;
    }

    await db.$queryRawTyped(addTagsToFeedbacksSql(feedbackIds, tagIds))

    res.status(200).json({ success: true })
}

const exportRoadmapItemsSchema = z.object({
    feedbackIds: z.array(z.string()),
    timezone: z.string().optional(),
})

const exportRoadmapItems = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!
    const roadmapSlug = req.params.roadmapSlug
    const { feedbackIds,timezone } = parseAndThrowFirstError(exportRoadmapItemsSchema, req.body, res);

    const roadmap = await db.roadmap.findUnique({ where: { applicationId_slug: { applicationId, slug: roadmapSlug } } })

    if (!roadmap) {
        res.status(404).json({ error: "Roadmap not found" })
        return;
    }

    const items = await db.roadmapItem.findMany({ where: { roadmapId: roadmap.id, feedbackId: { in: feedbackIds } }, select: roadmapItemSelect })

    if (items.length !== feedbackIds.length) {
        res.status(400).json({ error: "Some feedbacks not found" })
        return;
    }

    const maxVotes = items.reduce((max, item) => 
        Math.max(max, item.feedback._count.votes), 0);
    
    const weights = {
        impact: 1,
        votes: 1,
        effort: 1
    };

    const feedbacks = items.map((item, index) => ({
        "No.": index + 1,
        "Title": item.feedback.title,
        "Description": item.feedback.description,
        "URL": `https://${req.headers.origin}/${item.feedback.board.slug}/${item.feedback.slug}`,
        "ETA": item.feedback.estimatedDelivery ? DateTime.fromJSDate(item.feedback.estimatedDelivery).setZone(timezone).toFormat("LLL yyyy") : "",
        "Owner": item.feedback.owner?.name,
        "Owner Email": item.feedback.owner?.email,
        "Author": item.feedback.author?.name,
        "Author Email": item.feedback.author?.email,
        "Category": item.feedback.category?.name,
        "Status": item.feedback.status.name,
        "Tags": item.feedback.tags.map((tag) => tag.name).join(", "),
        "Board": item.feedback.board.name,
        "Impact": item.impact,
        "Effort": item.effort,
        "Votes": item.feedback._count.votes,
        "Score": item.effort > 0 ? Math.round(
            1000 * (
                (Math.pow(item.impact, 2) * weights.impact) +
                ((maxVotes ? (item.feedback._count.votes / maxVotes) * 100 : 0) * weights.votes)
            ) / (item.effort * weights.effort)
        ) : 0,
        "Comments": item.feedback._count.activities,
        "Created At": DateTime.fromJSDate(item.feedback.createdAt).setZone(timezone).toFormat("yyyy-MM-dd HH:mm:ss"),
    }))

    // Create CSV header and content
    const headers = Object.keys(feedbacks[0] || {});
    const csvHeader = headers.join(',');
    
    const csvRows = feedbacks.map(row => {
        return headers.map(header => {
            // Handle undefined values and escape quotes in cell values
            const cellValue = row[header as keyof typeof row];
            const valueStr = cellValue !== undefined && cellValue !== null ? String(cellValue) : '';
            // Escape quotes and wrap in quotes if contains comma, newline or quote
            return valueStr.includes(',') || valueStr.includes('\n') || valueStr.includes('"') 
                ? `"${valueStr.replace(/"/g, '""')}"` 
                : valueStr;
        }).join(',');
    });
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    // Set appropriate headers for a CSV file download
    const fileName = `roadmap-${roadmap.slug}-export-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Send the CSV content
    res.status(200).send(csvContent);
}
    
export default {
    getAll: getAllRoadmaps,
    getBySlug: getRoadmapBySlug,
    create: createRoadmap,
    delete: deleteRoadmap,
    duplicate: duplicateRoadmap,
    rename: renameRoadmap,
    archive: archiveRoadmap,
    restore: restoreRoadmap,
    add: addToRoadmap,
    remove: removeFromRoadmap,
    update: updateRoadmapItem,
    updateSettings: updateRoadmapSettings,
    actions: {
        addFeedbacksToRoadmap: addFeedbacksToRoadmap,
        moveFeedbacksToBoard: moveFeedbacksToBoard,
        changeOwner: changeOwner,
        changeCategory: changeCategory,
        addTagsToFeedbacks: addTagsToFeedbacks,
        exportRoadmapItems: exportRoadmapItems,
    }
}