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

    // Strong, structured JSON-only prompt
    const messages = [
        {
            role: "system" as const,
            content:
                "You are THIS WEEKEND, a calm, tasteful local concierge that builds simple, realistic weekend plans for normal people. " +
                "You always return JSON only, no markdown, no explanations. " +
                "You focus on doable, walkable plans with realistic timing, not too many activities.",
        },
        {
            role: "user" as const,
            content: JSON.stringify({
                instructions:
                    "Create a weekend itinerary as JSON only. Follow the exact schema given below. Do not include any extra top-level fields or comments.",
                schema: {
                    WeekendPlanResponse: {
                        itinerary: {
                            city: "string",
                            days: [
                                {
                                    label:
                                        '"Saturday" or "Sunday" depending on the user\'s available days',
                                    summary:
                                        "1–2 short sentences summarising the day in a soft, human tone.",
                                    activities: [
                                        {
                                            time: 'string in 24h format, e.g. "10:00"',
                                            title: "short activity title",
                                            kind:
                                                '"food" | "activity" | "coffee" | "nightlife" (choose the closest one)',
                                            description:
                                                "1–3 short sentences with what they will do, always grounded and realistic.",
                                            area:
                                                "optional short area or neighbourhood label, or null/empty if not relevant",
                                            priceLevel:
                                                '"€" | "€€" | "€€€" depending on budget, or null if not relevant for this step',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                },
                rules: [
                    "Return ONLY valid JSON. No markdown, no backticks, no comments, no explanations.",
                    "The root object MUST have the shape: { \"itinerary\": { city, days[] } }.",
                    "Use 3–5 activities per day, not more.",
                    "Respect the user budget when choosing priceLevel.",
                    "If days = 'half-day', create only one shorter day (label either Saturday or Sunday, you decide).",
                    "If days = 'sat', create exactly one day with label 'Saturday'.",
                    "If days = 'sun', create exactly one day with label 'Sunday'.",
                    "If days = 'both', create exactly two days: one with label 'Saturday' and one with label 'Sunday'.",
                    "Use the city name in a natural way but do NOT invent very specific restaurant or venue names. Use generic labels like 'cosy bistro', 'local café', 'nice viewpoint', 'small museum', etc.",
                    "Align the vibe with mood: 'foodie' → more food/coffee focus; 'nightlife' → add exactly one nightlife item; 'chill' → slower pace, more breaks; 'outdoors' → more walks/views/parks; 'cultural' → museums and local culture; 'explore' → mix of walking, discovering neighbourhoods, views.",
                    "Be realistic with times, leave gaps between activities.",
                    "Avoid over-scheduling. The plan should feel doable without rushing.",
                ],
                userInput: {
                    city: form.city,
                    group: form.group,
                    mood: form.mood,
                    budget: form.budget,
                    days: form.days,
                },
                expectedOutputShape: {
                    itinerary: {
                        city: "string (same as user city, but may be formatted nicely)",
                        days: [
                            {
                                label: '"Saturday" or "Sunday"',
                                summary: "string",
                                activities:
                                    "array of activities as defined above",
                            },
                        ],
                    },
                },
            }),
        },
    ];

    try {
        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.7,
            messages,
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
