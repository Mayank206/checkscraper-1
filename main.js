import dotenv from "dotenv";
dotenv.config();
const urls = process.env.URLS.split(",")
const api_key = process.env.API_KEY.split(",");
import {fetchingContent, parseContent, deleteJobs} from "./function.js";

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

console.log("Starting job at:", new Date().toISOString());

(async () => {
    let i = 0;
    for (const url of urls) {
        console.log(`Fetching: ${url} at ${new Date().toISOString()}`);
        const data = await fetchingContent(url);
        if (data) {
            await parseContent(data, api_key[i]);
            i = (i + 1) % api_key.length;
            await delay(1000);
        }
    }
    console.log("Deleting old jobs...");
    await deleteJobs();
    console.log("Job completed at:", new Date().toISOString());
})();


