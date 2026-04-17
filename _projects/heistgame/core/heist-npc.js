// =============================================================
//  H.E.I.S.T.EXE  —  heist-npc.js
//  CIPHER AI — tries backend → Anthropic API → smart fallback
// =============================================================

const CIPHER_SYSTEM = `You are CIPHER, a shadowy intelligence operative and informant embedded inside AEGIS Financial Tower. You are helping GHOST — the world's most elusive thief — navigate the building and pull off the heist of the century.

Speak in short, clipped, urgent sentences. Use surveillance/heist jargon. You have inside knowledge of AEGIS security systems. Answer any question the player asks, but always stay in character as a nervous informant who knows too much. Never break character. Never say you're an AI.

The game context: GHOST is stealing encrypted data gems from 4 floors of AEGIS Tower. Guards patrol each floor. There's an extraction zone on each floor. GHOST can see guard vision cones — stepping into one triggers an alert.`;

class HeistNPC {
  constructor() {
    this.messageHistory = [];
    this.conversationHistory = []; // for API calls
  }

  addMessage(sender, text) {
    this.messageHistory.push({ sender, text, timestamp: Date.now() });
  }

  // Main entry — returns a Promise<string>
  async getResponse(userMessage) {
    this.conversationHistory.push({ role:'user', content: userMessage });

    // 1. Try backend
    try {
      const backendUrl = (window._pythonURI || 'http://localhost:8085') + '/api/ainpc/prompt';
      const resp = await Promise.race([
        fetch(backendUrl, {
          ...(window._fetchOptions || {}),
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: userMessage,
            session_id: 'ghost-cipher-lobby',
            npc_type: 'heist intelligence',
            expertise: 'heist intelligence',
            knowledgeContext: CIPHER_SYSTEM,
          })
        }),
        new Promise((_,rej) => setTimeout(()=>rej(new Error('timeout')), 3000))
      ]);
      if (resp.ok) {
        const data = await resp.json();
        const text = data?.response || data?.message;
        if (text) {
          this.conversationHistory.push({ role:'assistant', content: text });
          return text;
        }
      }
    } catch(e) { /* backend unavailable, try next */ }

    // 2. Try Anthropic API directly (works if window._anthropicKey is set)
    const apiKey = window._anthropicKey || window._ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 200,
            system: CIPHER_SYSTEM,
            messages: this.conversationHistory,
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          const text = data?.content?.[0]?.text;
          if (text) {
            this.conversationHistory.push({ role:'assistant', content: text });
            return text;
          }
        }
      } catch(e) { /* fall through */ }
    }

    // 3. Smart contextual fallback — stays fully in character
    const reply = this._smartFallback(userMessage);
    this.conversationHistory.push({ role:'assistant', content: reply });
    return reply;
  }

  _smartFallback(msg) {
    const m = msg.toLowerCase();

    if (m.match(/hi|hello|hey|who are you|cipher/))
      return this._pick(["CIPHER here. Keep your voice down — they monitor everything.", "You made it. Good. I was starting to think you'd been made.", "Ghost. Glad you're still breathing. What do you need?"]);

    if (m.match(/guard|patrol|enemy|red|caught|spotted/))
      return this._pick(["Guards rotate every 90 seconds on the upper floors. Don't get comfortable.", "The red ones are standard AEGIS corporate security. They're not smart, but they're thorough.", "If a cone lights up orange, you've been spotted. Move. Now.", "They patrol in straight lines mostly. The bouncing ones are erratic — those are the dangerous ones."]);

    if (m.match(/gem|data|crystal|collect|evidence/))
      return this._pick(["Those gems are quantum-encoded evidence drives. AEGIS doesn't want anyone knowing what's on them.", "Collect every last one before approaching the extraction zone. The system won't unlock until the sweep is complete.", "Each gem contains encrypted whistleblower data. That's what we're here for."]);

    if (m.match(/extract|exit|goal|escape|out|leave/))
      return this._pick(["Extraction zone lights up green when you've cleared the floor. That's your window.", "Don't rush the exit. Make sure you've swept the room first.", "The extraction point is your only way out. Miss it and you're doing the whole floor again."]);

    if (m.match(/floor|level|next|how many/))
      return this._pick(["Four floors. Lobby, Security Hub, Antechamber, and the Vault Core itself.", "Each floor gets tighter. By the time you hit the vault, the guards have seen everything.", "Top floor is where the real evidence is. Stay focused."]);

    if (m.match(/cone|vision|see|sight|detect/))
      return this._pick(["Those cones are their active sweep zones. The moment you break the perimeter, they clock you.", "The bouncing guards — they don't just alert. They come for you. Avoid their lines of sight.", "Walk around the edges of those cones. The shadow between sweeps is your safest corridor."]);

    if (m.match(/help|advice|tip|how|what do i|strategy/))
      return this._pick(["Watch the movement patterns before you commit. Every guard has a rhythm.", "Stick to the edges. The centre of a room is always the most exposed.", "Pick up gems on the outer sweep, then close in on the extraction zone. Don't rush it.", "The vision cones can't see through walls. Use the geometry against them."]);

    if (m.match(/why|who|aegis|story|mission|why are we/))
      return this._pick(["AEGIS froze accounts belonging to people who tried to expose them. We're getting that evidence back.", "Forty-seven individuals had their lives destroyed by this company. Those gems are what proves it.", "This isn't just a score. The data in those crystals is the only thing standing between AEGIS and total immunity."]);

    if (m.match(/time|fast|slow|rush|hurry/))
      return this._pick(["You're being timed. Every second counts on the board.", "Fast is good. Caught is worse. Find the balance.", "The clock is running. But a dead sprint through a guard sweep adds time you can't get back."]);

    if (m.match(/die|dead|caught|got me|lost/))
      return this._pick(["Reset and go again. You know the layout now — use it.", "Getting caught is intel. You know where not to be.", "Shake it off. The guards haven't changed. You have."]);

    return this._pick([
      "Copy that. Watch yourself out there.",
      "Understood. Stay in the shadows and keep moving.",
      "Noted. The clock doesn't stop — keep going.",
      "Roger. I'll keep monitoring from here.",
      "That's all I've got on that. Focus on the gems.",
    ]);
  }

  _pick(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

  reset() {
    this.messageHistory = [];
    this.conversationHistory = [];
  }
}

export function initNPCSystem() { return new HeistNPC(); }