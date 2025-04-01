const API_KEY = 'cpk_cdbc9c56b4614dddb8cb49a5176e6aee.88d75341e661593d953e87bb2b5ba2ac.tfEpL8w2CZl82szGnv7Hyv8e32eoiLyY'; // 替换为你的API密钥
const API_URL = 'https://llm.chutes.ai/v1/chat/completions'; // DeepSeek API地址

const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// 保存对话历史（LocalStorage）
let messages = JSON.parse(localStorage.getItem('chatMessages')) || [];

// 初始化时渲染历史消息
function renderMessages() {
    chatHistory.innerHTML = '';
    messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = `message ${msg.role}-message`;
        div.textContent = msg.content;
        chatHistory.appendChild(div);
    });
    chatHistory.scrollTop = chatHistory.scrollHeight;
}
renderMessages();

// 发送消息
async function sendMessage() {
    const content = userInput.value.trim();
    if (!content) return;

    // 添加用户消息
    messages.push({ role: 'user', content });
    renderMessages();
    userInput.value = '';

    // 创建AI消息占位符
    const botMessageDiv = document.createElement('div');
    botMessageDiv.className = 'message bot-message';
    chatHistory.appendChild(botMessageDiv);
    let botContent = '';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-ai/DeepSeek-V3-0324',
                messages: messages,
                stream: true, // 启用流式传输
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        // 流式读取数据
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonStr = line.replace('data: ', '');
                    if (jsonStr === '[DONE]') break; // 流结束标记

                    try {
                        const data = JSON.parse(jsonStr);
                        if (data.choices[0].delta.content) {
                            botContent += data.choices[0].delta.content;
                            botMessageDiv.textContent = botContent; // 实时更新内容
                            chatHistory.scrollTop = chatHistory.scrollHeight;
                        }
                    } catch (e) {
                        console.warn('解析JSON失败:', e);
                    }
                }
            }
        }

        // 保存完整消息
        messages.push({ role: 'assistant', content: botContent });
        localStorage.setItem('chatMessages', JSON.stringify(messages));

    } catch (error) {
        console.error('Error:', error);
        botMessageDiv.textContent = '请求失败，请检查控制台';
    }
}
// async function sendMessage() {
//     const content = userInput.value.trim();
//     if (!content) return;

//     // 添加用户消息
//     messages.push({ role: 'user', content });
//     renderMessages();
//     userInput.value = '';

//     // 显示加载状态
//     const loadingDiv = document.createElement('div');
//     loadingDiv.className = 'message bot-message';
//     loadingDiv.textContent = 'AI正在思考...';
//     chatHistory.appendChild(loadingDiv);
//     chatHistory.scrollTop = chatHistory.scrollHeight;

//     try {
//         // 调用API
//         const response = await fetch(API_URL, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${API_KEY}`
//             },
//             body: JSON.stringify({
//                 model: 'deepseek-ai/DeepSeek-V3-0324', // 根据API文档调整模型名称
//                 messages: messages,
//                 temperature: 0.7,
//                 max_tokens: 500
//             })
//         });
        
//             // 新增：检查HTTP状态码
//         if (!response.ok) {
//             const errorText = await response.text(); // 读取原始响应内容
//             throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
//         }
    
//         const data = await response.json();
//         // ... 后续逻辑 ...
//     } catch (error) {
//         console.error('Error:', error);
//         // 显示更明确的错误信息
//         messages.push({ role: 'assistant', content: `请求失败：${error.message}` });
//         renderMessages();
//     }

//         const data = await response.json();
//         if (data.choices && data.choices[0].message) {
//             messages.push(data.choices[0].message);
//             localStorage.setItem('chatMessages', JSON.stringify(messages));
//         } else {
//             throw new Error('API响应异常');
//         }
//     // } catch (error) {
//     //     console.error('Error:', error);
//     //     messages.push({ role: 'assistant', content: '抱歉，我暂时无法回答。' });
//     // }

//     // 移除加载状态并渲染回复
//     chatHistory.removeChild(loadingDiv);
//     renderMessages();
// }

// 事件监听
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
