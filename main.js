import dotenv from "dotenv";
dotenv.config();
const urls = process.env.URLS.split(",");
const api_key = process.env.API_KEY.split(",");
import {fetchingContent, parseContent} from "./function.js";

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
    let i = 0;
    for (const url of urls) {
        const data = await fetchingContent(url);
        if (data) {
            await parseContent(data, api_key[i]);
            i = (i + 1) % api_key.length;
            await delay(2000);
        }
    }
})();

