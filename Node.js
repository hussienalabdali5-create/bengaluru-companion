<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Listening AI Pro</title>

<style>
body {
    font-family: sans-serif;
    background: #0A1F44;
    color: white;
    text-align: center;
    padding: 20px;
}
.container { max-width: 500px; margin: auto; }

.btn {
    padding: 12px 20px;
    border: none;
    border-radius: 20px;
    margin: 5px;
    cursor: pointer;
}
.start { background: orange; }
.stop { background: red; }

.live-box {
    background: white;
    color: black;
    padding: 15px;
    margin-top: 10px;
    border-radius: 10px;
    min-height: 50px;
}

.saved-item {
    background: #eee;
    color: black;
    margin: 5px;
    padding: 8px;
    border-radius: 6px;
}
</style>
</head>

<body>
<div class="container">

<h2>🎤 Listening AI Pro</h2>

<button id="start" class="btn start">ابدأ</button>
<button id="stop" class="btn stop" disabled>إيقاف</button>

<div id="live" class="live-box">...</div>

<h3>الجمل</h3>
<div id="saved"></div>

</div>

<script>

// ============================
// Smart Filter
// ============================
class SmartFilter {
    constructor() { this.last = ""; }

    normalize(t) {
        return t.toLowerCase().replace(/[^\w\s]/g, '').trim();
    }

    similarity(a, b) {
        let same = 0;
        for (let c of a) if (b.includes(c)) same++;
        return same / Math.max(a.length, b.length);
    }

    accept(text) {
        const a = this.normalize(this.last);
        const b = this.normalize(text);

        if (!this.last) {
            this.last = text;
            return true;
        }

        if (a === b) return false;
        if (b.startsWith(a) || a.startsWith(b)) return false;
        if (this.similarity(a, b) > 0.75) return false;

        this.last = text;
        return true;
    }
}

// ============================
// Buffer
// ============================
class SmartBuffer {
    constructor() { this.words = []; }

    addWords(words) {
        for (let w of words) {
            const last = this.words[this.words.length - 1];
            if (last && last.toLowerCase() === w.toLowerCase()) continue;
            this.words.push(w);
        }
    }

    getText() { return this.words.join(" "); }
    reset() { this.words = []; }
    isEmpty() { return this.words.length === 0; }
}

// ============================
// Storage
// ============================
let saved = [];
const savedDiv = document.getElementById("saved");

function render() {
    savedDiv.innerHTML = "";
    saved.slice(-20).forEach(s => {
        const div = document.createElement("div");
        div.className = "saved-item";
        div.textContent = s;
        savedDiv.appendChild(div);
    });
}

function addSentence(t) {
    if (t.length < 5) return;
    saved.push(t);
    if (saved.length > 300) saved.shift();
    render();
}

// ============================
// AI API
// ============================
async function correctWithAI(text) {
    try {
        const res = await fetch("http://localhost:3000/correct", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ text })
        });
        const data = await res.json();
        return data.corrected;
    } catch {
        return text;
    }
}

// ============================
// Speech
// ============================
let recognition;
let listening = false;
let timer;
const buffer = new SmartBuffer();
const filter = new SmartFilter();

async function finalize() {
    if (!buffer.isEmpty()) {
        const raw = buffer.getText();

        if (raw.length < 8) return;

        const aiText = await correctWithAI(raw);

        addSentence(aiText);
        buffer.reset();
    }
}

// ============================
// Start
// ============================
document.getElementById("start").onclick = () => {

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
        alert("المتصفح غير مدعوم");
        return;
    }

    recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    listening = true;

    recognition.onresult = (e) => {

        for (let i = e.resultIndex; i < e.results.length; i++) {

            if (e.results[i].isFinal) {

                const transcript = e.results[i][0].transcript.trim();

                if (filter.accept(transcript)) {
                    buffer.addWords(transcript.split(/\s+/));

                    clearTimeout(timer);
                    timer = setTimeout(finalize, 2000);
                }
            }
        }

        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
            if (!e.results[i].isFinal) {
                interim += e.results[i][0].transcript;
            }
        }

        document.getElementById("live").textContent =
            (buffer.getText() + " " + interim).trim();
    };

    recognition.onend = () => {
        if (listening) {
            setTimeout(() => {
                try { recognition.start(); } catch {}
            }, 500);
        }
    };

    recognition.start();

    document.getElementById("start").disabled = true;
    document.getElementById("stop").disabled = false;
};

// ============================
// Stop
// ============================
document.getElementById("stop").onclick = () => {
    listening = false;

    if (recognition) {
        recognition.abort();
        recognition = null;
    }

    clearTimeout(timer);
    finalize();

    document.getElementById("start").disabled = false;
    document.getElementById("stop").disabled = true;

    document.getElementById("live").textContent = "تم الإيقاف";
};

</script>
</body>
</html>
