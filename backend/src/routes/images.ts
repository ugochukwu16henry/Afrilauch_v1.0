import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// GET /api/images/avatar?seed=optional — return a DiceBear avatar URL (no storage needed).
router.get('/avatar', (req, res) => {
  const { seed } = req.query as { seed?: string };
  const s = (seed && seed.toString().trim()) || `riseflow-${Date.now()}`;
  const style = process.env.DICEBEAR_STYLE || 'thumbs';
  const url = `https://api.dicebear.com/7.x/${encodeURIComponent(style)}/svg?seed=${encodeURIComponent(s)}`;
  res.json({ url });
});

export { router as imagesRoutes };

