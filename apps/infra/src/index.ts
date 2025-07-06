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

/**
 * Ensures the Traefik dynamic configuration file exists and has proper permissions
 */
const ensureTraefikFile = async (): Promise<void> => {
  try {
    // Check if file exists
    const fileExists = await Bun.file(TRAEFIK_DYNAMIC_PATH).exists();

    if (!fileExists) {
      // Create empty file if it doesn't exist
      await Bun.write(TRAEFIK_DYNAMIC_PATH, "");
      console.log("📝 Created empty Traefik configuration file");
    }
  } catch (error) {
    console.error("⚠️ Could not ensure Traefik file exists:", error);
    // Continue anyway - the main write operation will handle the error
  }
};

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

const main = async () => {
  // Ensure the Traefik file exists before processing
  console.log("🔍 Ensuring Traefik file exists...");
  await ensureTraefikFile();

  const domains = await sql`
    SELECT id, domain, "verifiedAt", "failedAt"
    FROM "Domain"
    WHERE "failedAt" IS NULL AND custom = true
  `;

  console.log(
    `🔍 ${domains.length} domains to check`,
    domains.map((domain: any) => domain.domain)
  );

  if (domains.length === 0) return;

  const routers: Record<string, any> = {};
  const domainsToUpdate: string[] = [];

  for (const domain of domains) {
    console.log(`🔍 Checking domain: ${domain.domain}`);
    const cnameRecords = await dns.resolveCname(domain.domain);
    const valid = cnameRecords.some(
      (record) => record === "cname.supaboard.io"
    );
    console.log(`🔍 Valid: ${valid}`);

    if (domain.verifiedAt) {
      // If the domain is verified, we need to check if the CNAME is still valid
      if (valid) {
        // If the CNAME is still valid, we need to add the domain to the routers
        domainsToUpdate.push(domain.domain);
        routers[`router-${domain.domain.replace(/\./g, "-")}`] = {
          rule: `Host(\`${domain.domain}\`)`,
          entryPoints: ["http", "https"],
          service: "supaboard-service",
          middlewares: ["redirect-to-https", "gzip"],
          tls: {
            certResolver: "letsencrypt",
          },
        };
        routers[`router-${domain.domain.replace(/\./g, "-")}-api`] = {
          rule: `Host(\`${domain.domain}\`) && PathPrefix(\`/api\`)`,
          entryPoints: ["http", "https"],
          service: "api-service",
          middlewares: ["redirect-to-https", "gzip", "strip-api-prefix"],
          tls: {
            certResolver: "letsencrypt",
          },
        };
      } else {
        // If the CNAME is not valid we do NOT add it to the routers and we update the domain to failed
        await sql`
          UPDATE "Domain"
          SET "failedAt" = ${new Date()}, "verifiedAt" = NULL
          WHERE id = ${domain.id}
        `;
      }
    } else {
      // If the domain is not verified yet, we need to check if the CNAME is valid
      if (valid) {
        // If the CNAME is valid, we update the domain to verified and add it to the routers
        await sql`
          UPDATE "Domain"
          SET "verifiedAt" = ${new Date()}, "failedAt" = NULL
          WHERE id = ${domain.id}
        `;

        domainsToUpdate.push(domain.domain);
        routers[`router-${domain.domain.replace(/\./g, "-")}`] = {
          rule: `Host(\`${domain.domain}\`)`,
          entryPoints: ["http", "https"],
          service: "supaboard-service",
          middlewares: ["redirect-to-https", "gzip"],
          tls: {
            certResolver: "html",
          },
        };
        routers[`router-${domain.domain.replace(/\./g, "-")}-api`] = {
          rule: `Host(\`${domain.domain}\`) && PathPrefix(\`/api\`)`,
          entryPoints: ["http", "https"],
          service: "api-service",
          middlewares: ["redirect-to-https", "gzip", "strip-api-prefix"],
          tls: {
            certResolver: "letsencrypt",
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
            SET "failedAt" = ${new Date()}, "verifiedAt" = NULL
            WHERE id = ${domain.id}
          `;
          await redis.del(`verification:cname:${domain.id}`);
        }
      }
    }
    console.log(Object.keys(routers).join(", "));
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
        "api-service": {
          loadBalancer: {
            servers: [
              {
                url: "http://supaboard-api:8000",
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
        "strip-api-prefix": {
          stripPrefix: {
            prefixes: ["/api"],
          },
        },
      },
    },
  };

  const yamlString = yaml.dump(yamlData);

  if (Object.keys(routers).length === 0) {
    console.log("🔍 No routers to update");
    return;
  }

  console.log(
    `🔍 ${domainsToUpdate.length} Domains to update: ${domainsToUpdate.join(
      ", "
    )}`
  );

  try {
    await Bun.write(TRAEFIK_DYNAMIC_PATH, yamlString);
    console.log("✅ custom-domains.yaml updated");
  } catch (error) {
    console.error("❌ Error updating custom-domains.yaml:", error);

    // Provide more specific error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes("EACCES")) {
        console.error(
          "🔐 Permission denied. Please check file permissions for:",
          TRAEFIK_DYNAMIC_PATH
        );
        console.error("   Expected owner: UID 1001 (bun user)");
        console.error("   Expected permissions: 777 (world-writable)");

        // Try alternative approaches to write the file
        try {
          console.log("🔧 Trying alternative write methods...");

          // Method 1: Try writing to a temporary file first
          const tempPath = `${TRAEFIK_DYNAMIC_PATH}.tmp`;
          await Bun.write(tempPath, yamlString);

          // Try to move the temp file to the target location
          const { execSync } = await import("child_process");
          execSync(`mv "${tempPath}" "${TRAEFIK_DYNAMIC_PATH}"`, {
            stdio: "pipe",
          });

          // Also try to set permissions on the target file
          execSync(`chmod 777 "${TRAEFIK_DYNAMIC_PATH}"`, { stdio: "pipe" });

          console.log(
            "✅ custom-domains.yaml updated using temporary file method"
          );
        } catch (tempError) {
          console.error("🔧 Temporary file method failed:", tempError);

          // Method 2: Try using a different approach - write to stdout and redirect
          try {
            const { execSync } = await import("child_process");
            execSync(
              `echo '${yamlString.replace(/'/g, "'\"'\"'")}' > "${TRAEFIK_DYNAMIC_PATH}"`,
              { stdio: "pipe" }
            );
            console.log("✅ custom-domains.yaml updated using echo method");
          } catch (echoError) {
            console.error("🔧 Echo method also failed:", echoError);

            // Method 3: Try writing to a different location as last resort
            try {
              const fallbackPath = "/tmp/custom-domains.yaml";
              await Bun.write(fallbackPath, yamlString);
              console.log(`⚠️ Wrote to fallback location: ${fallbackPath}`);
              console.log(
                "⚠️ You may need to manually copy this file to the correct location"
              );
            } catch (fallbackError) {
              console.error("🔧 All write methods failed:", fallbackError);
            }
          }
        }
      } else if (error.message.includes("ENOENT")) {
        console.error("📁 File or directory not found:", TRAEFIK_DYNAMIC_PATH);
        console.error("   Please ensure the directory exists and is writable");
      }
    }
  }
  return;
};

console.log("🚀 Starting Supaboard Infrastructure Service...");
console.log(`📁 Traefik dynamic config path: ${TRAEFIK_DYNAMIC_PATH}`);

// Check file permissions on startup
const checkFilePermissions = async () => {
  try {
    const fileExists = await Bun.file(TRAEFIK_DYNAMIC_PATH).exists();
    if (!fileExists) {
      console.error("❌ File does not exist:", TRAEFIK_DYNAMIC_PATH);
      console.error("   Please ensure the file exists and is writable");
    }
  } catch (error) {
    console.error("❌ File permission check failed:", error);
  }
};

// Run permission check on startup
checkFilePermissions();

CronJob.from({
  cronTime: "* * * * *",
  onTick: async () => {
    await main();
  },
  start: true,
});
