import type { BareSessionRequest } from '@/types'
import { parseAndThrowFirstError } from '@/util/error-parser'
import { ActivityType, db, StatusType } from '@repo/database'
import type { Response } from 'express'
import { z } from 'zod'


const generateUniqueSlug = async (name: string, applicationId: string) => {
    const baseSlug = name.toLowerCase().replace(/ /g, '-').replace(/^-|-$/g, '')
    let slug = baseSlug
    let counter = 0

    while (true) {
        const status = await db.status.findUnique({ where: { applicationId_slug: { applicationId, slug } } })
        if (!status) return slug
        counter++
        slug = `${baseSlug}-${counter}`
    }
}

const createStatusSchema = z.object({
    id: z.string(),
    name: z.string().min(1).max(20),
    color: z.string().min(1).max(20).optional(),
    type: z.nativeEnum(StatusType),
})

const create = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!
    const { id, name, color, type } = parseAndThrowFirstError(createStatusSchema, req.body, res)

    const slug = await generateUniqueSlug(name, applicationId)

    const order = await db.status.count({ where: { applicationId, type } })

    const status = await db.status.create({ data: { id, name, color, type, slug, applicationId, order } })

    res.status(201).json(status)
}

const get = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!
    const statuses = await db.status.findMany({ where: { applicationId } })

    const types = [StatusType.DEFAULT, StatusType.ACTIVE, StatusType.COMPLETE, StatusType.CLOSED];

    const orderedStatuses = statuses.sort((a, b) => {
        const typeOrder = types.indexOf(a.type) - types.indexOf(b.type)

        if (typeOrder !== 0) return typeOrder

        return a.order - b.order
    })

    res.status(200).json(orderedStatuses)
}

const deleteStatus = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!
    const statusId = req.params.statusId

    const status = await db.status.findUnique({ where: { id: statusId } })

    if (!status) {
        res.status(404).json({ error: 'Status not found', code: 'NOT_FOUND' })
        return
    }

    const defaultStatus = await db.status.findFirst({ where: { applicationId, type: StatusType.DEFAULT } })

    if (!defaultStatus) {
        res.status(404).json({ error: 'Default status not found', code: 'NOT_FOUND' })
        return
    }

    await db.$transaction(async tx => {
        await tx.feedback.updateMany({ where: { statusId: status.id }, data: { statusId: defaultStatus.id } })

        await tx.activity.deleteMany({
            where: {
                feedback: { applicationId },
                type: ActivityType.FEEDBACK_STATUS_CHANGE,
                OR: [
                    { data: { path: ['from'], equals: status.slug } },
                    { data: { path: ['to'], equals: status.slug } }
                ]
            }
        })

        await tx.status.delete({ where: { id: status.id } })
    });

    res.status(200).json(status)
}

const updateStatusSchema = z.object({
    name: z.string().min(1).max(20).optional(),
    color: z.string().min(1).max(20).optional(),
    type: z.nativeEnum(StatusType).optional(),
    order: z.number().optional(),
    includeInRoadmap: z.boolean().optional(),
})

const updateStatus = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!
    const statusId = req.params.statusId
    const { name, color, type, order, includeInRoadmap } = parseAndThrowFirstError(updateStatusSchema, req.body, res);

    const status = await db.status.findUnique({ where: { id: statusId } })

    if (!status) {
        res.status(404).json({ error: 'Status not found', code: 'NOT_FOUND' })
        return
    }

    await db.$transaction(async tx => {
        if (order !== undefined && status.order !== order) {
            const orderChange = status.order < order ? 'movedUp' : 'movedDown';
            const statusesToUpdate = await tx.status.findMany({
                where: {
                    applicationId,
                    type: status.type,
                    order: orderChange === 'movedUp' ? { gt: status.order, lte: order } : { gte: order, lt: status.order }
                }
            });

            await tx.status.updateMany({
                where: { id: { in: statusesToUpdate.map(s => s.id) } },
                data: { order: orderChange === 'movedUp' ? { decrement: 1 } : { increment: 1 } }
            });
        }
        await tx.status.update({ where: { id: status.id }, data: { name, color, type, order, includeInRoadmap } });
    })

    res.status(200).json(status)
}

const getBySlug = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!
    const statusSlug = req.params.statusSlug

    const status = await db.status.findUnique({ where: { applicationId_slug: { applicationId, slug: statusSlug } } })

    if (!status) {
        res.status(404).json({ error: 'Status not found', code: 'NOT_FOUND' })
        return
    }

    res.status(200).json(status)
}

export const controller = {
    get,
    create,
    delete: deleteStatus,
    update: updateStatus,
    getBySlug,
}