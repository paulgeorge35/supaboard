import { db } from '@repo/database';
import * as Bun from 'bun';
import { CronJob } from 'cron';
import dns from 'node:dns/promises';
import path from 'node:path';
import { redis } from './redis';

const VERIFICATION_MAX_RETRIES = 5;

async function incrementVerificationAttempt(applicationId: string, type: 'txt' | 'cname'): Promise<number> {
    const key = `verification:${type}:${applicationId}`;
    const attempts = await redis.incr(key);
    // Set expiry to 24 hours to cleanup old entries
    await redis.expire(key, 24 * 60 * 60);
    return attempts;
}

const getScriptPath = (scriptName: string) => {
    return path.join(import.meta.dir, scriptName);
}

const addDomain = async (domain: string) => {
    const scriptPath = getScriptPath('add_domain.sh');

    const proc = Bun.spawn(['bash', scriptPath, domain], {
        cwd: path.dirname(scriptPath),
    });

    const output = await new Response(proc.stdout).text();
    const error = await new Response(proc.stderr).text();

    if (error) {
        console.error('Script error:', error);
        throw new Error(error);
    }

    return output;
};

CronJob.from({
    cronTime: '*/5 * * * * *',
    onTick: async () => {
        const domains = await db.domain.findMany({
            where: {
                verifiedAt: null,
                failedAt: null,
            },
        });

        if (domains.length === 0) return;
        console.log(`Checking CNAME for ${domains.length} domains`);

        for (const domain of domains) {
            try {
                const cnameRecords = await dns.resolveCname(domain.domain);
                const valid = cnameRecords.some(record => record === 'cname.supaboard.io');

                if (valid) {
                    console.log(`CNAME for ${domain.domain} is valid`);

                    await addDomain(domain.domain);

                    await db.domain.update({
                        where: { id: domain.id },
                        data: { verifiedAt: new Date(), failedAt: null },
                    });
                } else {
                    const attempts = await incrementVerificationAttempt(domain.id, 'cname');
                    if (attempts >= VERIFICATION_MAX_RETRIES) {
                        console.log(`CNAME verification failed after ${attempts} attempts for ${domain.domain}`);
                        await db.domain.update({
                            where: { id: domain.id },
                            data: { failedAt: new Date(), verifiedAt: null },
                        });
                        await redis.del(`verification:cname:${domain.id}`);
                    }
                }
            } catch (error) {
                console.log(`CNAME for ${domain.domain} is invalid`);
                const attempts = await incrementVerificationAttempt(domain.id, 'cname');
                if (attempts >= VERIFICATION_MAX_RETRIES) {
                    console.log(`CNAME verification failed after ${attempts} attempts for ${domain.domain}`);
                    await db.domain.update({
                        where: { id: domain.id },
                        data: { failedAt: new Date(), verifiedAt: null },
                    });
                    await redis.del(`verification:cname:${domain.id}`);
                }
            }
        }
    },
    start: true,
});
