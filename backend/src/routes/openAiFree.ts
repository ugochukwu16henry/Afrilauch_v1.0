import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { aiChatFree, summarizeFree, FreeAiConfigError } from '../services/openAiFreeService';

const router = Router();

router.use(authMiddleware);

// POST /api/openai/free/chat — free/open-model chat assistant
router.post('/chat', async (req, res) => {
  const { prompt, history } = req.body as {
    prompt?: string;
    history?: { role: 'system' | 'user' | 'assistant'; content: string }[];
  };
  if (!prompt?.trim()) {
    res.status(400).json({ error: 'prompt is required' });
    return;
  }
  try {
    const result = await aiChatFree({ prompt: prompt.trim(), history });
    res.json({ reply: result.reply });
  } catch (err) {
    if (err instanceof FreeAiConfigError) {
      res.status(503).json({
        error: 'Free AI is not configured.',
        message: 'Set HF_API_TOKEN on the backend environment and redeploy.',
      });
      return;
    }
    // Avoid leaking provider details
    console.error('[openAiFree.chat] error:', err);
    res.status(502).json({ error: 'Free AI chat is temporarily unavailable.' });
  }
});

// POST /api/openai/free/summarize — free/open-model summarisation
router.post('/summarize', async (req, res) => {
  const { text } = req.body as { text?: string };
  if (!text?.trim()) {
    res.status(400).json({ error: 'text is required' });
    return;
  }
  try {
    const result = await summarizeFree(text.trim());
    res.json({ summary: result.summary });
  } catch (err) {
    if (err instanceof FreeAiConfigError) {
      res.status(503).json({
        error: 'Free AI is not configured.',
        message: 'Set HF_API_TOKEN on the backend environment and redeploy.',
      });
      return;
    }
    console.error('[openAiFree.summarize] error:', err);
    res.status(502).json({ error: 'Summarisation service is temporarily unavailable.' });
  }
});

export { router as openAiFreeRoutes };

