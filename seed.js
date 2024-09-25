import { ChromaClient } from "chromadb";
import data from "./ctg-studies.json" assert { type: "json" };
import { z } from "zod";
const COLLECTION_NAME = "clinical_trials";

// There are lots of other fields defined. I chose this one for simplicity, but
// can definitely see us wanting to incorporate other data.
const protocolSectionSchema = z.object({
  identificationModule: z
    .object({
      nctId: z.string().optional(),
      orgStudyIdInfo: z
        .object({
          id: z.string().optional(),
        })
        .optional(),
      organization: z
        .object({
          fullName: z.string().optional(),
          class: z.string().optional(),
        })
        .optional(),
      briefTitle: z.string().optional(),
      officialTitle: z.string().optional(),
    })
    .optional(),
  descriptionModule: z
    .object({
      briefSummary: z.string().optional(),
      detailedDescription: z.string().optional(),
    })
    .optional(),
});

const itemSchema = z.object({
  protocolSection: protocolSectionSchema.nullable(),
});

const trialData = z.array(itemSchema).parse(data);

const cli = new ChromaClient({ path: process.env.CHROMADB_URL });

const collection = await cli.getOrCreateCollection({ name: COLLECTION_NAME });

/**
 * Returns a newline separated text document containing information related to
 * the clinical trial. Things like title, description, organization name, etc.
 */
function textForEmbed(trial) {
  const parts = [];
  if (trial?.identificationModule) {
    parts.push(trial.identificationModule.briefTitle);
    parts.push(trial.identificationModule.officialTitle);
    parts.push(trial.identificationModule.organization.fullName);
  }
  if (trial?.descriptionModule) {
    parts.push(trial.descriptionModule.briefSummary);
  }
  return parts.join("\n");
}

// Max chunk size for chroma is ~5000
const CHUNK_SIZE = 2500;

// Add clinical trial data to chroma. Chroma handles generating embeddings for us.
// We use the default embedding function, which allowed me to avoid making paid API calls.
for (
  let chunkStart = 0;
  chunkStart < trialData.length;
  chunkStart += CHUNK_SIZE
) {
  const chunkData = trialData.slice(
    chunkStart,
    Math.min(chunkStart + CHUNK_SIZE, trialData.length)
  );
  await collection.upsert({
    ids: chunkData.map((t) => t?.protocolSection?.identificationModule?.nctId),
    documents: chunkData.map(textForEmbed),
    metadatas: chunkData.map((t) => ({
      briefTitle: t?.protocolSection?.identificationModule?.briefTitle,
      officialTitle: t?.protocolSection?.identificationModule?.briefTitle,
      orgFullName:
        t?.protocolSection?.identificationModule?.organization?.fullName,
      description: t?.protocolSection?.descriptionModule?.briefSummary,
    })),
  });
}
