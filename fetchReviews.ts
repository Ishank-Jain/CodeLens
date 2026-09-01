import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL as string);

import { api } from "./convex/_generated/api.js";

async function main() {
  try {
    const reviews = await client.query(api.debug.getAllReviews);
    console.log("REVIEWS DB DUMP:");
    console.log(JSON.stringify(reviews, null, 2));
  } catch(e) {
    console.error(e);
  }
}

main();
