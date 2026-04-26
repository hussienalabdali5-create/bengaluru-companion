// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = "YOUR_API_KEY";

app.post("/correct", async (req, res) => {
    const { text } = req.body;

    if (!text || text.length < 3) {
        return res.json({ corrected: text });
    }

    try {
        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4.1-mini",
                input: `
You are a medical English assistant.

Correct the sentence professionally:
- Fix grammar
- Remove repetition
- Improve clarity
- Keep meaning
- Use natural medical English

Return ONLY the corrected sentence.

Sentence:
${text}
`
            })
        });

        const data = await response.json();

        const corrected =
            data?.output?.[0]?.content?.[0]?.text || text;

        res.json({ corrected });

    } catch (err) {
        console.error(err);
        res.json({ corrected: text });
    }
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
