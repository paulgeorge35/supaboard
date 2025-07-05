import * as Bun from "bun";
import { sql } from "bun";
import { CronJob } from "cron";
import * as yaml from "js-yaml";
import dns from "node:dns/promises";
import { redis } from "./redis";

const VERIFICATION_MAX_RETRIES = 5;
const TRAEFIK_DYNAMIC_PATH =
  Bun.env.TRAEFIK_DYNAMIC_PATH ||
  "/data/coolify/proxy/dynamic/custom-domains.yaml";

async function incrementVerificationAttempt(
  applicationId: string,
  type: "txt" | "cname"
): Promise<number> {
  const key = `verification:${type}:${applicationId}`;
  const attempts = await redis.incr(key);
  // Set expiry to 24 hours to cleanup old entries
  await redis.expire(key, 24 * 60 * 60);
  return attempts;
}

const refreshTraefik = async () => {
  const domains = await sql`
    SELECT id, domain, verified_at, failed_at
    FROM "Domain"
    WHERE failed_at IS NULL AND custom = true
  `;

  if (domains.length === 0) return;

  const routers: Record<string, any> = {};

  for (const domain of domains) {
    const cnameRecords = await dns.resolveCname(domain.domain);
    const valid = cnameRecords.some(
      (record) => record === "cname.supaboard.io"
    );

    if (domain.verified_at) {
      // If the domain is verified, we need to check if the CNAME is still valid
      if (valid) {
        // If the CNAME is still valid, we need to add the domain to the routers
        routers[`router-${domain.domain.replace(/\./g, "-")}`] = {
          rule: `Host(\`${domain.domain}\`)`,
          entryPoints: ["http", "https"],
          service: "supaboard-service",
          middlewares: ["redirect-to-https", "gzip"],
          tls: {
            certResolver: "html",
          },
        };
      } else {
        // If the CNAME is not valid we do NOT add it to the routers and we update the domain to failed
        await sql`
          UPDATE "Domain"
          SET failed_at = ${new Date()}, verified_at = NULL
          WHERE id = ${domain.id}
        `;
      }
    } else {
      // If the domain is not verified yet, we need to check if the CNAME is valid
      if (valid) {
        // If the CNAME is valid, we update the domain to verified and add it to the routers
        await sql`
          UPDATE "Domain"
          SET verified_at = ${new Date()}, failed_at = NULL
          WHERE id = ${domain.id}
        `;

        routers[`router-${domain.domain.replace(/\./g, "-")}`] = {
          rule: `Host(\`${domain.domain}\`)`,
          entryPoints: ["http", "https"],
          service: "supaboard-service",
          middlewares: ["redirect-to-https", "gzip"],
          tls: {
            certResolver: "html",
          },
        };
      } else {
        // If the CNAME is not valid we increment the verification attempt and if it reaches the max retries we update the domain to failed
        const attempts = await incrementVerificationAttempt(domain.id, "cname");
        if (attempts >= VERIFICATION_MAX_RETRIES) {
          console.log(
            `CNAME verification failed after ${attempts} attempts for ${domain.domain}`
          );
          await sql`
            UPDATE "Domain"
            SET failed_at = ${new Date()}, verified_at = NULL
            WHERE id = ${domain.id}
          `;
          await redis.del(`verification:cname:${domain.id}`);
        }
      }
    }
  }

  // We update the Traefik dynamic configuration with the new routers
  const yamlData = {
    http: {
      routers,
      services: {
        "supaboard-service": {
          loadBalancer: {
            servers: [
              {
                url: "http://supaboard-app:4173",
              },
            ],
          },
        },
      },
      middlewares: {
        "redirect-to-https": {
          redirectScheme: {
            scheme: "https",
          },
        },
        gzip: {
          compress: true,
        },
      },
    },
  };

  const yamlString = yaml.dump(yamlData);

  await Bun.write(TRAEFIK_DYNAMIC_PATH, yamlString)
    .then(() => {
      console.log("✅ custom-domains.yaml updated");
    })
    .catch((error) => {
      console.error("❌ Error updating custom-domains.yaml:", error);
    });
};

CronJob.from({
  cronTime: "*/5 * * * * *",
  onTick: async () => {
    await refreshTraefik();
  },
  start: true,
});
