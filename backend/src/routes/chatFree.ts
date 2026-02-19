import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { aiChatFree, FreeAiConfigError } from '../services/openAiFreeService';

const router = Router();

router.use(authMiddleware);

// POST /api/chat/free — alias to free/open-model chat assistant
router.post('/', async (req, res) => {
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
    console.error('[chatFree] error:', err);
    res.status(502).json({ error: 'Free chat assistant is temporarily unavailable.' });
  }
});

export { router as chatFreeRoutes };

