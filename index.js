import Papa from "papaparse";
import fs from "fs";
import "dotenv/config";

const DUNE_TICKET_QUERY_ID = 3308995
const DUNE_QUEST_QUERY_ID = 3318483

const cache = {};

export async function getAllowlistFromDune(query, filename, limit) {
  const cacheKey = `query-${query}`;
  const currentTime = new Date().getTime();
  const cacheExpiration = 300000; // 5 minutes

  if (!cache[cacheKey] || currentTime - cache[cacheKey].timestamp >= cacheExpiration) {
    try {
      const response = await fetch(
        `https://api.dune.com/api/v1/query/${query}/results/csv?api_key=${process.env.DUNE_KEY}`
      );
      const csvData = await response.text();
      cache[cacheKey] = {
        timestamp: currentTime,
        data: Papa.parse(csvData.trimEnd(), { header: true }).data
      };
    } catch (error) {
      console.error(error);
      return;
    }
  }

  const filteredData = cache[cacheKey].data
    .filter((item) => !limit || item.total_quests_claimed > limit)
    .map((item) => item.recipient);

  const csvContent = Papa.unparse(filteredData, { header: true });

  fs.writeFileSync(filename, csvContent);
}

(async () => {
  await getAllowlistFromDune(DUNE_QUEST_QUERY_ID, "questExplore.csv");
  await getAllowlistFromDune(DUNE_QUEST_QUERY_ID, "questAdept.csv", 100);
  await getAllowlistFromDune(DUNE_QUEST_QUERY_ID, "questMaster.csv", 500);
  await getAllowlistFromDune(DUNE_TICKET_QUERY_ID, "ticketMaster.csv");
})();
