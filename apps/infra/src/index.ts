import { DomainStatus, db } from '@repo/database';
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

const addDomain = (domain: string) => {
    const scriptPath = path.join(import.meta.dir, 'add_domain.sh');
    return Bun.spawn(['sh', scriptPath, domain], {
        cwd: import.meta.dir,
    });
};

CronJob.from({
    cronTime: '*/5 * * * * *',
    onTick: async () => {
        const applications = await db.application.findMany({
            where: {
                domainStatus: DomainStatus.PENDING,
                customDomain: {
                    not: null
                }
            },
        });

        if (applications.length === 0) return;
        console.log(`Checking TXT ${applications.length} applications`);

        for (const application of applications) {
            const baseDomain = application.customDomain?.split('.').slice(-2).join('.');
            if (!baseDomain || !application.verificationCode) continue;

            try {
                console.log(`Checking ${baseDomain}`);
                const txtRecords = await dns.resolveTxt(baseDomain);
                const valid = txtRecords.some(record => application.verificationCode && record.includes(application.verificationCode));
                console.log(txtRecords);

                if (valid) {
                    console.log(`TXT for ${application.customDomain} is valid`);
                    await db.application.update({
                        where: { id: application.id },
                        data: { domainStatus: DomainStatus.CONFIRMED_OWNERSHIP },
                    });
                } else {
                    const attempts = await incrementVerificationAttempt(application.id, 'txt');
                    if (attempts >= VERIFICATION_MAX_RETRIES) {
                        console.log(`TXT verification failed after ${attempts} attempts for ${application.customDomain}`);
                        await db.application.update({
                            where: { id: application.id },
                            data: { domainStatus: DomainStatus.FAILED },
                        });
                        await redis.del(`verification:txt:${application.id}`);
                    }
                }
            } catch (error) {
                console.log(`TXT for ${baseDomain} is invalid`);
                console.error(error);
                const attempts = await incrementVerificationAttempt(application.id, 'txt');
                if (attempts >= VERIFICATION_MAX_RETRIES) {
                    console.log(`TXT verification failed after ${attempts} attempts for ${application.customDomain}`);
                    await db.application.update({
                        where: { id: application.id },
                        data: { domainStatus: DomainStatus.FAILED },
                    });
                    await redis.del(`verification:txt:${application.id}`);
                }
            }
        }
    },
    // start: true,
});


CronJob.from({
    cronTime: '*/5 * * * * *',
    onTick: async () => {
        const applications = await db.application.findMany({
            where: {
                domainStatus: DomainStatus.CONFIRMED_OWNERSHIP,
                customDomain: {
                    not: null
                }
            },
        });

        if (applications.length === 0) return;
        console.log(`Checking CNAME ${applications.length} applications`);

        for (const application of applications) {
            if (!application.customDomain) continue;

            try {
                const cnameRecords = await dns.resolveCname(application.customDomain);
                const valid = cnameRecords.some(record => application.customDomain && record === 'tenant.supaboard.app');

                if (valid) {
                    console.log(`CNAME for ${application.customDomain} is valid`);

                    await addDomain(application.customDomain).exited;

                    await db.application.update({
                        where: { id: application.id },
                        data: { domainStatus: DomainStatus.VERIFIED },
                    });
                } else {
                    const attempts = await incrementVerificationAttempt(application.id, 'cname');
                    if (attempts >= VERIFICATION_MAX_RETRIES) {
                        console.log(`CNAME verification failed after ${attempts} attempts for ${application.customDomain}`);
                        await db.application.update({
                            where: { id: application.id },
                            data: { domainStatus: DomainStatus.FAILED },
                        });
                        await redis.del(`verification:cname:${application.id}`);
                    }
                }
            } catch (error) {
                console.log(`CNAME for ${application.customDomain} is invalid`);
                console.error(error);
                const attempts = await incrementVerificationAttempt(application.id, 'cname');
                if (attempts >= VERIFICATION_MAX_RETRIES) {
                    console.log(`CNAME verification failed after ${attempts} attempts for ${application.customDomain}`);
                    await db.application.update({
                        where: { id: application.id },
                        data: { domainStatus: DomainStatus.FAILED },
                    });
                    await redis.del(`verification:cname:${application.id}`);
                }
            }
        }
    },
    start: true,
});
