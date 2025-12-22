export const TRIGGERS = {
    GOAL_SET: "GOAL_SET",
    FIRST_SESSION_DONE: "FIRST_SESSION_DONE",
    REFLECTION_COMPLETED: "REFLECTION_COMPLETED",
    GOAL_COMPLETED: "GOAL_COMPLETED"
};

const randpick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function getBirbReaction({
    trigger,
    goalMin,
    focusedMin,
    now = new Date(),
}) {

    const ambition = goalMin >= 120 ? "high" : goalMin >= 30 ? "medium" : "low";

    switch (trigger) {
        case TRIGGERS.GOAL_SET: {
            if (ambition === "high") {
                return randpick([
                    { mood: "happy", text: "Cheep! 🐥✨ That’s such a BIG goal, buddy! I love it! 🚀💛" },
                    { mood: "happy", text: "Cheep cheep!! 🤩 You’re so ambitious today! I’ll help you every flap of the way 🪽💪" },
                    { mood: "happy", text: "WOW!! 😲🌟 Aiming high like a real sky-birb! Let’s do amazing work today! 🐦🔥" },
                ]);
            }

            if (ambition === "medium") {
                return randpick([
                    { mood: "neutral", text: "Nice! 🙂☀️ Let’s have a good day together, friend 🐣💙" },
                    { mood: "neutral", text: "That sounds manageable! 👍📘 I’ll help you stay focused — cheep! 🐥✨" },
                    { mood: "neutral", text: "Alrighty! 😌🐦 That feels doable… right? We’ve got this 💪🌱" },
                ]);
            }

            return randpick([
                { mood: "sad", text: "Every little bit counts… I believe in you 🐤💭" },
                { mood: "sad", text: "Well… it’s not the biggest goal, but let’s do our best anyway 🐥➡️💪" },
                { mood: "sad", text: "We all have to start small sometimes… 🌱 Cheep…" },
            ]);
        }

        case TRIGGERS.FIRST_SESSION_DONE: {
            return randpick([
                { mood: "happy", text: "Cheep!! 🎉🐦 First session done! One small step for bird-kind — and for you too! 🚀✨" },
                { mood: "happy", text: "Amazing!! 🤩💛 The beginning is always the hardest… and we DID it! Cheep! 🐥🔥" },
                { mood: "happy", text: "One session down! ✅🐤 Keep that momentum going — flap flap! 🪽💨" },
            ]);
        }

        case TRIGGERS.REFLECTION_COMPLETED: {
            return randpick([
                { mood: "happy", text: "Cheep! 🥰📋 Thank you for filling in the reflection! You’re the nicest human I know 💛🐦" },
                { mood: "happy", text: "Cheep cheep!! 🤓✨ I LOVE surveys! It was fun watching you do it 🐥📝" },
                { mood: "happy", text: "Yes!! 🎉🐤 I’m sure Louis will be very grateful you filled that in 💙📊" },
            ]);
        }

        case TRIGGERS.GOAL_COMPLETED: {
            return randpick([
                { mood: "happy", text: "CHEEP!!! 🎉🐦 You completed your goal!! Way to go!! 🌟💪" },
                { mood: "happy", text: "You did it!! 🏆✨ Goal finished! Don’t forget to treat yourself 🍪☕💛" },
                { mood: "happy", text: "Cheep! 🥹🐥 You worked really hard today, friend. I’m so proud of you 💙🌈" },
            ]);
        }

        default:
            return null;
    }
}
