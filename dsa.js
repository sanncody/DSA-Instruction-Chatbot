// require('dotenv').config();

// const { GoogleGenAI } = require('@google/genai');
// const prompt = require('prompt-sync')();

// const ai = new GoogleGenAI({
//     apiKey: process.env.GEMINI_API_KEY
// });

// async function dsaIntructor(questionPrompt) {
//     const response = await ai.models.generateContent({
//         model: "gemini-2.5-flash",
//         contents: questionPrompt,
//         config: {
//             systemInstruction: `
//                 You are a Data Structure and Algorithm Instructor. 
//                 You will only reply to the problem related to Data Structure and Algorithm.
//                 You have to solve the query of user in a simplest way.
//                 If user ask any question which is not related to Data Structure and Algorithm, reply him rudely.
//             `,
//         },
//     });

//     console.log();
    
//     console.log(response.text);
// }

// console.log();
// async function main() {
//     const questionPrompt = prompt("Ask me anything => ");
//     await dsaIntructor(questionPrompt);
//     main();
// }

// main();




const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const apiKeyInput = document.getElementById('api-key-input');

// System Instruction from your code
const SYSTEM_INSTRUCTION = `
            You are a Data Structure and Algorithm Instructor. 
            You will only reply to the problem related to Data Structure and Algorithm.
            You have to solve the query of user in a simplest way.
            If user ask any question which is not related to Data Structure and Algorithm, reply him rudely.
        `;

// Auto-resize textarea
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
    if (textarea.value === '') textarea.style.height = '50px';
}

function addMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);

    const nameDiv = document.createElement('div');
    nameDiv.classList.add('sender-name');
    nameDiv.innerText = sender === 'user' ? 'You' : 'DSA Instructor';

    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('msg-bubble');

    // Parse Markdown for AI, plain text for user
    if (sender === 'ai') {
        bubbleDiv.innerHTML = marked.parse(text);
    } else {
        bubbleDiv.innerText = text;
    }

    msgDiv.appendChild(nameDiv);
    msgDiv.appendChild(bubbleDiv);
    chatContainer.appendChild(msgDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showLoading() {
    const loaderDiv = document.createElement('div');
    loaderDiv.id = 'loading-indicator';
    loaderDiv.classList.add('message', 'ai');
    loaderDiv.innerHTML = `
                <div class="sender-name">DSA Instructor</div>
                <div class="msg-bubble">
                    <div class="typing-indicator">
                        <div class="dot"></div><div class="dot"></div><div class="dot"></div>
                    </div>
                </div>
            `;
    chatContainer.appendChild(loaderDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoading() {
    const loader = document.getElementById('loading-indicator');
    if (loader) loader.remove();
}

async function handleSend() {
    const text = userInput.value.trim();
    const apiKey = apiKeyInput.value.trim();

    if (!text) return;

    if (!apiKey) {
        alert("Please enter your Gemini API Key in the top right corner.");
        return;
    }

    // 1. Add User Message
    addMessage(text, 'user');
    userInput.value = '';
    userInput.style.height = '50px';
    showLoading();

    try {
        // 2. Prepare Fetch Call
        // Note: Using version 2.5-flash as per your code request. 
        // If 2.5 is not available publicly, change 'gemini-2.5-flash' to 'gemini-1.5-flash'
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const payload = {
            system_instruction: {
                parts: [{ text: SYSTEM_INSTRUCTION }]
            },
            contents: [
                {
                    parts: [{ text: text }]
                }
            ]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        removeLoading();

        if (response.ok && data.candidates && data.candidates.length > 0) {
            const aiResponse = data.candidates[0].content.parts[0].text;
            addMessage(aiResponse, 'ai');
        } else {
            console.error(data);
            let errorMsg = "Error connecting to the instructor.";
            if (data.error) errorMsg += ` (${data.error.message})`;
            addMessage(errorMsg, 'ai');
        }

    } catch (error) {
        removeLoading();
        console.error(error);
        addMessage("Network error or Invalid API configuration.", 'ai');
    }
}

// Enter key to send (Shift+Enter for new line)
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});