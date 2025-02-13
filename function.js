import mongoose from 'mongoose';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();
// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// MongoDB schemas
const jobSchema = new mongoose.Schema({
    title: { type: String, required: true }, // Company name is hiring role (Job title or role being offered)
    job_id: { type: Number, unique: true, required: true }, // Unique identifier for the job
    role: { type: String, required: true }, // Job title or role being offered
    company: { type: String, required: true }, // Company name
    skills: { type: [String], default: [] }, // Required skills (add based on job role if not mentioned)
    experience_min: { type: Number, default: 0 }, // Min years of experience
    experience_max: { type: Number, default: 0 }, // Max years of experience
    employment_type: { type: [String], default: [] }, // ['Fresher', 'Experienced'] based on experience
    job_type: { type: [String], default: [] }, // e.g., Remote, Full-Time
    apply_link: { type: String, required: true }, // URL to apply
    salary_min: { type: Number, default: 0 }, // Annual min salary
    salary_max: { type: Number, default: 0 }, // Annual max salary
    education: { type: [String], default: [] }, // Education qualifications
    location: { type: [String], default: [] }, // Job location(s)
    batch: { type: [String], default: [] }, // Eligible batches (calculated using experience as of 2025)
    created_at: { type: Date, default: Date.now },
    message: { type: String } // Formatted job message
});

// Create a Job model
const Job = mongoose.model('Job', jobSchema);

export async function fetchingContent(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data) {
            return data;
        } else {
            throw new Error(`Failed to decode JSON response from ${url}`);
        }
    } catch (error) {
        console.error('Error fetching data: ', error);
    }
}

export async function parseContent(content, api_key){
    try {
        for(let post in content){
            const res = content[post]?.content?.rendered;
            if (res) {
                await generateContent(res, api_key);
            } else {
                throw new Error(`problem in parseContent ${url}`);
            }
        }
    } catch(error){
        console.error('Error Parsing Data: ', error);
    }
}

async function generateContent(content, api_key){
    try {
        const genAI = new GoogleGenerativeAI(api_key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `html_content = ${content}
        Extract and return the following details in a well-structured **MongoDB-compatible JSON format**, ensuring no unknown ASCII values are present. The JSON structure should be:
        {
            "title": "string",  # Write "company_name is hiring role" (Job title or role being offered) batch Eligible (if recent batch is mentioned, calculate using experience as of 2025)
            "job_id": NumberInt("Integer"),  # Unique identifier for the job. Extract from apply_link.
            "role": "string",  # Job title or role being offered.
            "company": "string",
            "skills": ["string"],  # Required skills for the job. (If not mentioned in html_content, add according to job role)
            "experience_min": NumberInt("Integer"),  # Minimum years of experience required.
            "experience_max": NumberInt("Integer"),  # Maximum years of experience required.
            "employment_type": ["string"],  # List indicating job type, e.g., ["Fresher", "Experienced"]. Determine based on experience_min and experience_max:
            # - If both are 0, classify as Fresher.
            # - If experience_min > 0, classify as Experienced.
            # - If experience_min = 0 and experience_max > 0, include both Fresher and Experienced.
            "job_type": ["string"],  # Nature of employment, e.g., Remote, Full-Time.
            "apply_link": "string",  # URL link to apply for the job.
            "salary_min": NumberInt("Integer"),  # Annual minimum salary (convert monthly to annual if needed).
            "salary_max": NumberInt("Integer"),  # Annual maximum salary (convert monthly to annual if needed).
            "education": ["string"],  # Education qualifications required for the job.
            "location": ["string"],  # Job location.
            "batch": ["string"],  # Eligible batches (if recent batch is mentioned, calculate using experience as of 2025).
            "message": "string"  # Generate a formatted message as follows:
    
            # Format:
            # This message has been sent by a bot.
        #
        # {company} is Hiring! 🚀
        #
        # 💼 Role: {role}
        # 📍 Location: {location}
        # 💰 Salary Range: ₹{salary_min} - ₹{salary_max} per year
        #
        # ✨ Eligibility:
            # - {education}
        # - Batch: {batch}
        # - Experience: {experience_min} - {experience_max} years (if both 0 then just add 0)
        #
        # 🛠 Skills:
            # - {skills}, {skills}, {skills}
            # - {skills}, {skills}, {skills}
        #
        # 📄 View Full Job Details & Apply: {apply_link}
        }
        `;

        const result = await model.generateContent(prompt);
        const data = await result.response.text().slice(8, -5);
        saveJob(JSON.parse(data));  // Ensure correct output
        } catch (error) {
        console.error('Error generating content: Problem with Gemini Api');
    }
}

async function saveJob(data){
    try{
        if (typeof data !== 'object' || data === null) {
            throw new Error("Invalid data format: Data must be an object");
        }
        const existData = await Job.findOne( {role:data.role, company:data.company});
        if(existData){
            console.log("Job already exists in the database");
            return ;
        }
        const jobDetails = new Job({ ...data });
        await jobDetails.save();
        console.log("Job saved successfully!");
    } catch (error) {
        console.error("Error saving job:", error.message);
    }
}

export async function deleteJobs(){
    try{
        const twoMonthAgo = new Date();
        twoMonthAgo.setMonth(twoMonthAgo.getMonth()-2);
        const oldJobs = await Job.deleteMany({created_at: {$lt: twoMonthAgo}});
        console.log(`Deleted ${oldJobs} old jobs.`);
    }
    catch (error) {
        console.error("Error in deleteJobs:", error.message);
    }
}
