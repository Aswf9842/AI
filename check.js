const fs = require('fs');
const buf = fs.readFileSync('C:\\Users\\th\\Desktop\\plain-knowledge\\index.html');
const html = buf.toString('utf8');
const start = html.indexOf('<script>') + 8;
const end = html.indexOf('</script>', start);
const code = html.substring(start, end);

// ====== Check 1: All string values in zh locale ======
console.log('=== zh locale strings ===');
const zhMatch = code.match(/zh:\s*\{([\s\S]*?)\},[\s]*\n/);
if (zhMatch) {
    const zhObj = zhMatch[1];
    const lines = zhObj.split('\n');
    for (const line of lines) {
        const t = line.trim();
        if (t && !t.startsWith('//') && t.includes(':')) {
            console.log('  ' + t.substring(0, 120));
        }
    }
}

// ====== Check 2: Look for ASCII " inside Chinese text in string values ======
console.log('\n=== Potential quote issues inside strings ===');
// Check all string values for unescaped " inside them
const stringRe = /: "([^"]*)"[,}\n]/g;
let m;
let qIssues = 0;
while ((m = stringRe.exec(code)) !== null) {
    const val = m[1];
    // Check if the value contains any " character (which would break the string)
    // But these are already captured by the regex - if there's an inner ", the regex would stop early
    // Instead, we just check the extracted value
}

// Better approach: check all lines for Chinese text with bare ASCII quotes
const allLines = code.split('\n');
for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];
    let inStr = false;
    let strStart = -1;
    for (let j = 0; j < line.length; j++) {
        if (line[j] === '"') {
            if (!inStr) { inStr = true; strStart = j; }
            else { 
                // End of string - check the content
                const content = line.substring(strStart + 1, j);
                // Check if content has Chinese chars AND contains unescaped ASCII quotes
                if (/[\u4e00-\u9fff]/.test(content) && content.includes('"')) {
                    console.log(`  Line ${i+1}: Possible issue: ${content.substring(0, 60)}`);
                    qIssues++;
                }
                inStr = false;
            }
        }
    }
}
if (qIssues === 0) console.log('  No quote issues found');

// ====== Check 3: Repeated content across knowledgeBase entries ======
console.log('\n=== knowledgeBase entries (checking for repetition) ===');
const kbMatch = code.match(/const knowledgeBase = \{([\s\S]*?)\};/);
if (kbMatch) {
    const kbContent = kbMatch[1];
    // Extract all knowledge entries
    const entries = kbContent.match(/"([^"]+)":\s*"([^"]+)"/g);
    if (entries) {
        for (const e of entries) {
            const kv = e.match(/"([^"]+)":\s*"([^"]+)"/);
            if (kv) {
                const key = kv[1].substring(0, 30);
                const val = kv[2].substring(0, 60);
                console.log(`  ${key} → ${val}...`);
            }
        }
    }
}

// ====== Check 4: Compare mockExps titles vs knowledgeBase keys for overlap ======
console.log('\n=== Checking for overlap between mockExps and knowledgeBase ===');
const mockKeys = code.match(/"区块链到底是什么？"|"牛顿第一定律（惯性定律）"|"什么是机器学习中的过拟合？"|"解释一下'机会成本'"|"为什么DNS叫互联网电话本？"/g);
const kbKeys = code.match(/"量子纠缠"|"黑洞"|"熵"|"递归"|"贝叶斯定理"|"幸存者偏差"|"边际效用递减"|"机会成本"|"过拟合"|"区块链"/g);

// Check for overlap: if mockExps key contains a kbKey substring, it could double-match
const mockKeySet = mockKeys ? [...new Set(mockKeys)] : [];
const kbKeySet = kbKeys ? [...new Set(kbKeys)] : [];

// "区块链到底是什么？" contains "区块链" which is also in knowledgeBase
// If user types "区块链", getExplanation will match mockExps first (key includes "区块链")
// So the knowledgeBase "区块链" is never reached when user types exactly "区块链"
// This is by design - mockExps takes priority
console.log('  mockExps keys:', mockKeySet.length);
console.log('  knowledgeBase keys:', kbKeySet.length);

// ====== Check 5: Duplicate cheerMsgs in any locale ======
console.log('\n=== Duplicate cheer messages ===');
const locales = ['zh', 'en', 'es', 'ja', 'ar'];
for (const lang of locales) {
    const langMatch = code.match(new RegExp(lang + ':\\s*\\{[\\s\\S]*?cheerMsgs:\\s*\\[([\\s\\S]*?)\\]'));
    if (langMatch) {
        const msgsText = langMatch[1];
        const msgs = msgsText.match(/"([^"]+)"/g);
        if (msgs) {
            const cleanMsgs = msgs.map(m => m.replace(/"/g, ''));
            const uniqueMsgs = [...new Set(cleanMsgs)];
            if (uniqueMsgs.length !== cleanMsgs.length) {
                console.log(`  ${lang}: ${cleanMsgs.length} messages with ${cleanMsgs.length - uniqueMsgs.length} duplicates`);
            } else {
                console.log(`  ${lang}: ${cleanMsgs.length} unique messages ✅`);
            }
        }
    }
}

// ====== Check 6: Are there any similar-sounding TL;DRs? ======
console.log('\n=== Checking TL;DR lines for similarity ===');
const tldrs = code.match(/✨ 一句话总结[：:][^"]+/g);
if (tldrs) {
    // Check if any are very similar
    for (let i = 0; i < tldrs.length; i++) {
        for (let j = i + 1; j < tldrs.length; j++) {
            const a = tldrs[i].substring(0, 20);
            const b = tldrs[j].substring(0, 20);
            if (a === b) {
                console.log(`  DUPLICATE TL;DR at ${i} and ${j}: ${a}`);
            }
        }
    }
    console.log(`  ${tldrs.length} TL;DR lines checked ✅`);
}

console.log('\n✅ Check complete');
