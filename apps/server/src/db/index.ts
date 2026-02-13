import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as authSchema from "./schema/auth";
import * as jobApplicationsSchema from "./schema/job-applications";

const schema = { 
    ...authSchema, 
    ...jobApplicationsSchema,
};

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

