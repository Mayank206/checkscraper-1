import dotenv from "dotenv";
dotenv.config();
const urls = ["https://job4freshers.co.in/wp-json/wp/v2/posts","https://offcampusjobs4u.com/wp-json/wp/v2/posts","https://freshershunt.in/wp-json/wp/v2/posts","https://www.fresheroffcampus.com/wp-json/wp/v2/posts","https://freshersvoice.com/wp-json/wp/v2/posts","https://www.jobvision.in/wp-json/wp/v2/posts","https://jobformore.com/wp-json/wp/v2/posts","https://careersquare.in/wp-json/wp/v2/posts","https://jobforfresher.in/wp-json/wp/v2/posts"];
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
            console.log(`Parsing content from: ${url}`);
            await parseContent(data, api_key[i]);
            i = (i + 1) % api_key.length;
            await delay(1000);
        }
    }
    console.log("Deleting old jobs...");
    await deleteJobs();
    console.log("Job completed at:", new Date().toISOString());
})();


