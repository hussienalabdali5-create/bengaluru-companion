import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// حل مشكلة __dirname في ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📄 عرض الصفحة الرئيسية
app.use(express.static(__dirname));

// 🧠 API
app.post("/correct", (req, res) => {
    const { text } = req.body;

    let corrected = text
        .replace(/\bis a\b/g, 'is')
        .replace(/\ba a\b/g, 'a')
        .replace(/\s+/g, ' ')
        .trim();

    res.json({ corrected });
});

// تشغيل السيرفر
app.listen(3000, () => {
    console.log("Server running");
});
