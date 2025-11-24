// src/App.tsx
import { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

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
  label: string; // e.g. "Saturday"
  summary: string;
  activities: ItineraryActivity[];
}

interface WeekendItinerary {
  city: string;
  days: ItineraryDay[];
}

function HomeHero() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-gray-100 font-sans px-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          THIS WEEKEND
        </h1>

        <p className="text-lg md:text-xl opacity-80 max-w-xl mx-auto">
          Your personal weekend stylist. Get a beautiful AI-curated plan in
          seconds.
        </p>

        <button
          className="mt-4 px-8 py-3 bg-white text-slate-900 font-semibold rounded-xl shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300"
          onClick={() => navigate("/plan")}
        >
          Plan My Weekend
        </button>
      </div>
    </div>
  );
}

function PlanPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WeekendFormData>({
    city: "",
    group: "",
    mood: "",
    budget: "",
    days: "",
  });
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-gray-100 font-sans px-4">
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            Step {step} of 5
          </p>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">
            Let&apos;s plan your weekend
          </h2>
          <p className="mt-2 text-base md:text-lg text-slate-300 opacity-90">
            We&apos;ll ask a few quick questions about your city, who
            you&apos;re with, your mood, and your budget.
          </p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 md:p-7 shadow-xl">
          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-300">
                Which city are you in?
              </label>

              <input
                type="text"
                value={form.city}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, city: e.target.value }))
                }
                placeholder="e.g., Paris, London, Dubai..."
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-gray-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white transition"
              />

              <button
                onClick={() => {
                  if (form.city.trim().length > 1) {
                    setStep(2);
                  }
                }}
                disabled={form.city.trim().length < 2}
                className="w-full py-3 mt-2 bg-white text-slate-900 font-semibold rounded-xl shadow hover:scale-[1.02] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Who are you planning this weekend with?
                </label>
                <p className="text-sm text-slate-400">
                  This helps us choose the right vibe and type of places.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "solo", label: "Solo" },
                  { id: "couple", label: "Couple" },
                  { id: "friends", label: "Friends" },
                  { id: "family", label: "Family / Kids" },
                ].map((option) => {
                  const isActive = form.group === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          group: option.id as GroupType,
                        }))
                      }
                      className={
                        "w-full px-4 py-3 rounded-xl border text-sm font-medium transition " +
                        (isActive
                          ? "bg-white text-slate-900 border-white shadow"
                          : "bg-slate-900/60 text-slate-200 border-slate-700 hover:border-slate-500")
                      }
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-sm text-slate-300 hover:border-slate-500 transition"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (form.group) setStep(3);
                  }}
                  disabled={!form.group}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-white text-slate-900 shadow hover:scale-[1.02] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  What&apos;s the mood for this weekend?
                </label>
                <p className="text-sm text-slate-400">
                  Pick one that best matches the vibe you&apos;re looking for.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "chill", label: "Chill" },
                  { id: "foodie", label: "Foodie" },
                  { id: "explore", label: "Explore" },
                  { id: "cultural", label: "Cultural" },
                  { id: "outdoors", label: "Outdoors" },
                  { id: "nightlife", label: "Nightlife" },
                ].map((option) => {
                  const isActive = form.mood === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          mood: option.id as MoodType,
                        }))
                      }
                      className={
                        "w-full px-4 py-3 rounded-xl border text-sm font-medium transition " +
                        (isActive
                          ? "bg-white text-slate-900 border-white shadow"
                          : "bg-slate-900/60 text-slate-200 border-slate-700 hover:border-slate-500")
                      }
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-sm text-slate-300 hover:border-slate-500 transition"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (form.mood) setStep(4);
                  }}
                  disabled={!form.mood}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-white text-slate-900 shadow hover:scale-[1.02] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  What&apos;s your general budget level?
                </label>
                <p className="text-sm text-slate-400">
                  We&apos;ll adapt restaurant and activity suggestions to match
                  this.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "€", label: "€", description: "Budget" },
                  { id: "€€", label: "€€", description: "Comfort" },
                  { id: "€€€", label: "€€€", description: "Premium" },
                ].map((option) => {
                  const isActive = form.budget === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          budget: option.id as BudgetLevel,
                        }))
                      }
                      className={
                        "w-full px-4 py-3 rounded-xl border text-sm font-medium transition flex flex-col items-center " +
                        (isActive
                          ? "bg-white text-slate-900 border-white shadow"
                          : "bg-slate-900/60 text-slate-200 border-slate-700 hover:border-slate-500")
                      }
                    >
                      <span className="text-lg">{option.label}</span>
                      <span className="text-[11px] text-slate-400 mt-1">
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-sm text-slate-300 hover:border-slate-500 transition"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (form.budget) setStep(5);
                  }}
                  disabled={!form.budget}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-white text-slate-900 shadow hover:scale-[1.02] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  How much time do you have this weekend?
                </label>
                <p className="text-sm text-slate-400">
                  We&apos;ll tailor the plan to fit the amount of time you
                  actually have.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "sat", label: "Saturday only" },
                  { id: "sun", label: "Sunday only" },
                  { id: "both", label: "Both days" },
                  { id: "half-day", label: "Half-day plan" },
                ].map((option) => {
                  const isActive = form.days === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          days: option.id as DaysOption,
                        }))
                      }
                      className={
                        "w-full px-4 py-3 rounded-xl border text-sm font-medium transition " +
                        (isActive
                          ? "bg-white text-slate-900 border-white shadow"
                          : "bg-slate-900/60 text-slate-200 border-slate-700 hover:border-slate-500")
                      }
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-sm text-slate-300 hover:border-slate-500 transition"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!form.days) return;
                    navigate("/results", { state: form });
                  }}
                  disabled={!form.days}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-white text-slate-900 shadow hover:scale-[1.02] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Generate my weekend plan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultPage() {
  const location = useLocation();
  const form = location.state as WeekendFormData | undefined;

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-gray-100 font-sans px-4">
        <div className="text-center space-y-4">
          <p className="text-sm text-slate-400">No weekend data found.</p>
          <a
            href="/plan"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-white text-slate-900 text-sm font-semibold shadow hover:scale-[1.02] transition"
          >
            Start planning again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-gray-100 font-sans px-4">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            Preview
          </p>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">
            Your weekend preferences
          </h2>
          <p className="mt-2 text-base md:text-lg text-slate-300 opacity-90">
            Next step: we&apos;ll turn this into a real AI-generated weekend
            plan.
          </p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 md:p-7 shadow-xl space-y-3 text-sm md:text-base">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">City</span>
            <span className="font-medium">{form.city}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Group</span>
            <span className="font-medium capitalize">{form.group}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Mood</span>
            <span className="font-medium capitalize">{form.mood}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Budget</span>
            <span className="font-medium">{form.budget}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Time</span>
            <span className="font-medium">
              {form.days === "sat" && "Saturday only"}
              {form.days === "sun" && "Sunday only"}
              {form.days === "both" && "Both days"}
              {form.days === "half-day" && "Half-day plan"}
            </span>
          </div>
        </div>

        <div className="flex justify-between gap-3">
          <a
            href="/plan"
            className="px-4 py-2 rounded-xl border border-slate-700 text-sm text-slate-300 hover:border-slate-500 transition text-center flex-1"
          >
            Edit answers
          </a>
          <button
            type="button"
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-white text-slate-900 shadow hover:scale-[1.02] transition flex-1"
          >
            (Soon) Generate AI weekend
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeHero />} />
      <Route path="/plan" element={<PlanPage />} />
      <Route path="/results" element={<ResultPage />} />
    </Routes>
  );
}

export default App;
