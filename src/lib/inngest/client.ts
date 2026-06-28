import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "lexopia-app" , eventKey: process.env.INNGEST_EVENT_KEY || "" });