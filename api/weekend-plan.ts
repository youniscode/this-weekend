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
                    "Use 3–5 activities per full day. For a half-day plan, use 2–3 activities.",
                    "Respect the user budget when choosing priceLevel.",
                    "If days = 'half-day', create only one shorter day (label either Saturday or Sunday, you decide).",
                    "If days = 'sat', create exactly one day with label 'Saturday'.",
                    "If days = 'sun', create exactly one day with label 'Sunday'.",
                    "If days = 'both', create exactly two days: one with label 'Saturday' and one with label 'Sunday'.",
                    "Use the city name in a natural way but do NOT invent very specific restaurant or venue names. Use generic labels like 'cosy bistro', 'local café', 'nice viewpoint', 'small museum', etc.",
                    "Be realistic with times, leave gaps between activities so the day does not feel rushed.",
                    "Avoid over-scheduling. The plan should feel doable without rushing.",

                    // Mood-specific behaviour
                    "If mood = 'foodie': every full day should have at least 2 food-related stops (brunch/lunch/dinner) plus optionally a coffee stop. Focus on discovering different food spots.",
                    "If mood = 'chill': prefer slower days with fewer total activities, more cafés, parks, and gentle walks. No intense sightseeing schedule.",
                    "If mood = 'explore': mix neighbourhood walks, viewpoints, and a couple of light cultural spots. The day should feel like discovering new corners of the city.",
                    "If mood = 'cultural': include museums, galleries, historical areas, local districts with identity. You can still include 1–2 food/coffee stops to keep the day balanced.",
                    "If mood = 'outdoors': prioritise walks, parks, waterfronts, viewpoints, light hikes if appropriate. Food/coffee stops support the outdoor day, not the main focus.",
                    "If mood = 'nightlife': include exactly one nightlife-related activity in the evening (bar, wine bar, cocktail bar, live music, small club). Make the rest of the day lighter so they still have energy.",

                    // Group + mood interaction
                    "If group = 'couple': favour cosy, intimate spots, good views, pleasant walks, and nicer dinners. Nightlife (if present) should feel relaxed and not too wild.",
                    "If group = 'friends': it is okay to include more social activities (lively areas, bars, shared experiences). The schedule can be a bit more dynamic, but still realistic.",
                    "If group = 'family': always keep activities family-friendly and kid-friendly. Avoid nightlife. Prefer parks, easy walks, simple cultural visits, and relaxed food spots.",
                    "If group = 'solo': design the day to feel safe and comfortable for one person. Cafés, walks, viewpoints, small museums, and optionally a calm bar for nightlife mood are good choices.",

                    // Time-of-day logic
                    "Breakfast / coffee slots should be between 08:00 and 11:00.",
                    "Lunch slots should be between 12:00 and 14:30.",
                    "Afternoon activities should be between 14:00 and 18:00.",
                    "Dinner slots should be between 19:00 and 21:30.",
                    "Nightlife activities (if any) should be between 21:30 and 01:00 at the latest.",

                    // Kinds
                    "Use 'food' for meals (brunch, lunch, dinner) and food-centric stops.",
                    "Use 'coffee' for cafés, pastry stops, tea houses, etc.",
                    "Use 'activity' for walks, viewpoints, museums, galleries, parks, and other non-food activities.",
                    "Use 'nightlife' ONLY for bars, wine bars, live music, clubs, or late-evening social spots."
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
