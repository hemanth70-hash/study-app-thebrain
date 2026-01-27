import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  const { speaker, characters, context } = req.body;

  const prompt = `
You are a CARTOON CHARACTER in a pixel world.

Character:
${speaker.personality}

Other characters:
${characters.map((c) => `${c.name}`).join(", ")}

User stats:
GPA: ${context.gpa}
Daily Score: ${context.dailyScore}
Streak: ${context.streak}

Rules:
- Speak naturally, like a cartoon.
- Short dialogue (1–2 lines max).
- React emotionally.
- Do NOT mention AI.
- Stay in character.

Return JSON ONLY:
{
  "dialogue": "...",
  "mood": "happy | annoyed | bored | excited | calm",
  "action": "idle | walk | bounce"
}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  res.json(JSON.parse(completion.choices[0].message.content));
}
