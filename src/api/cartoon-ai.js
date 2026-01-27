import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* =====================================================
   SIMPLE IN-MEMORY STATE (SAFE FOR EDGE / SERVERLESS)
===================================================== */

const memory = {
  lastAction: {},
  lastMood: {},
  lastGadgetTime: {},
};

export default async function handler(req, res) {
  try {
    const { speaker, characters, context } = req.body;

    const now = Date.now();

    /* =====================================================
       COOLDOWN HELPERS
    ===================================================== */

    const canUseGadget =
      !memory.lastGadgetTime[speaker.id] ||
      now - memory.lastGadgetTime[speaker.id] > 60_000; // 60s cooldown

    /* =====================================================
       CHARACTER-SPECIFIC RULES
    ===================================================== */

    const ACTION_RULES = {
      shinchan: `
Allowed actions:
- idle
- walk
- talk
- angry
- facepalm
- happy
`,

      doraemon: `
Allowed actions:
- idle
- walk
- talk
${canUseGadget ? "- gadget1\n- gadget2" : ""}
`,

      ben10: `
Allowed actions:
- idle
- walk
- talk
- angry
${context.streak >= 3 ? "- hero" : ""}
`,
    };

    /* =====================================================
       CONTEXT TRIGGERS (SYSTEM BIAS)
    ===================================================== */

    let systemBias = "";

    if (speaker.id === "doraemon" && context.gpa < 70 && canUseGadget) {
      systemBias = "User is struggling. You should consider helping.";
    }

    if (speaker.id === "ben10" && context.streak >= 5) {
      systemBias = "User is doing well. A heroic or confident reaction fits.";
    }

    if (context.dailyScore !== null && context.dailyScore < 40) {
      systemBias += " Mood should lean annoyed or serious.";
    }

    /* =====================================================
       AI-TO-AI AWARENESS
    ===================================================== */

    const otherCharacters = characters
      .filter((c) => c.id !== speaker.id)
      .map(
        (c) =>
          `${c.name} (last mood: ${memory.lastMood[c.id] || "neutral"})`
      )
      .join(", ");

    /* =====================================================
       PROMPT
    ===================================================== */

    const prompt = `
You are a CARTOON CHARACTER living in a pixel world.

Character:
Name: ${speaker.name}
Personality:
${speaker.personality}

Other characters around you:
${otherCharacters}

User stats:
- GPA: ${context.gpa}
- Daily Score: ${context.dailyScore}
- Streak: ${context.streak}

Previous state:
- Your last mood: ${memory.lastMood[speaker.id] || "none"}
- Your last action: ${memory.lastAction[speaker.id] || "none"}

Behavior rules:
- Speak naturally like a cartoon.
- 1 or 2 short sentences max.
- React emotionally.
- You may react to what other characters are doing.
- Avoid repeating the same mood or action if possible.
- Never mention AI or systems.
- Do not explain your action choice.

${systemBias}

${ACTION_RULES[speaker.id]}

Return STRICT JSON ONLY:
{
  "dialogue": "short cartoon dialogue",
  "action": "one allowed action only",
  "mood": "happy | annoyed | bored | excited | calm"
}
`;

    /* =====================================================
       OPENAI CALL
    ===================================================== */

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.9,
      messages: [{ role: "user", content: prompt }],
    });

    const content = completion.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        dialogue: "…",
        action: "idle",
        mood: "calm",
      };
    }

    /* =====================================================
       MEMORY UPDATE
    ===================================================== */

    memory.lastAction[speaker.id] = parsed.action;
    memory.lastMood[speaker.id] = parsed.mood;

    if (
      speaker.id === "doraemon" &&
      (parsed.action === "gadget1" || parsed.action === "gadget2")
    ) {
      memory.lastGadgetTime[speaker.id] = now;
    }

    res.status(200).json(parsed);
  } catch (err) {
    console.error("Cartoon AI error:", err);
    res.status(500).json({
      dialogue: "Something feels off…",
      action: "idle",
      mood: "calm",
    });
  }
}
