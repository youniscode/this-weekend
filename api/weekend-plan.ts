// api/weekend-plan.ts
import OpenAI from "openai";

export const config = {
    runtime: "edge",
};

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

type GroupType = "solo" | "couple" | "friends" | "family" | "";
type MoodType =
    | "chill"
    | "foodie"
    | "explore"
    | "cultural"
    | "outdoors"
    | "nightlife"
    | "";
type BudgetLevel = "€" | "€€" | "€€€" | "";
type DaysOption = "sat" | "sun" | "both" | "half-day" | "";

interface WeekendFormData {
    city: string;
    group: GroupType;
    mood: MoodType;
    budget: BudgetLevel;
    days: DaysOption;
}

type ActivityKind = "food" | "activity" | "coffee" | "nightlife";

interface ItineraryActivity {
    time: string;
    title: string;
    kind: ActivityKind;
    description: string;
    area?: string;
    priceLevel?: BudgetLevel;
}

interface ItineraryDay {
    label: string;
    summary: string;
    activities: ItineraryActivity[];
}

interface WeekendItinerary {
    city: string;
    days: ItineraryDay[];
}

interface WeekendPlanRequest {
    form: WeekendFormData;
}

interface WeekendPlanResponse {
    itinerary: WeekendItinerary;
}

export default async function handler(req: Request): Promise<Response> {
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    let body: WeekendPlanRequest;
    try {
        body = (await req.json()) as WeekendPlanRequest;
    } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const form = body?.form;
    if (!form || !form.city) {
        return new Response(JSON.stringify({ error: "Missing form data" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const prompt = `
You are a helpful weekend travel + lifestyle planner.

User preferences:
- City: ${form.city}
- Group: ${form.group || "n/a"}
- Mood: ${form.mood || "n/a"}
- Budget: ${form.budget || "n/a"}
- Days: ${form.days || "n/a"}

Return a JSON object with this exact TypeScript shape and nothing else (no markdown, no comments):

{
  "itinerary": {
    "city": "City name",
    "days": [
      {
        "label": "Saturday" | "Sunday",
        "summary": "Short summary of the day.",
        "activities": [
          {
            "time": "10:00",
            "title": "Title of activity",
            "kind": "food" | "activity" | "coffee" | "nightlife",
            "description": "1–2 sentence description.",
            "area": "Neighbourhood or area",
            "priceLevel": "€" | "€€" | "€€€"
          }
        ]
      }
    ]
  }
}
  `.trim();

    try {
        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.7,
            messages: [
                {
                    role: "system",
                    content:
                        "You generate structured, realistic weekend plans and respond ONLY with valid JSON.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        const raw = completion.choices[0]?.message?.content ?? "{}";

        let parsed: WeekendPlanResponse;
        try {
            parsed = JSON.parse(raw) as WeekendPlanResponse;
        } catch (err) {
            console.error("Failed to parse JSON from OpenAI:", err, raw);
            return new Response(
                JSON.stringify({ error: "Failed to parse AI response" }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        return new Response(JSON.stringify(parsed), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("OpenAI error:", err);
        return new Response(JSON.stringify({ error: "AI backend error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
