import type { Request, Response } from 'express';
import type { AuthPayload } from '../middleware/auth';
import { getSystemSettings, saveSystemSettings } from '../services/systemSettingsService';

/** GET /api/v1/super-admin/settings/system */
export async function getSystem(req: Request, res: Response): Promise<void> {
  try {
    const settings = await getSystemSettings();
    res.json(settings);
  } catch (e) {
    console.error('[superAdminSettings.getSystem] error:', e);
    res.status(500).json({ error: 'Failed to load system settings.' });
  }
}

/** PUT /api/v1/super-admin/settings/system */
export async function updateSystem(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as Request & { user?: AuthPayload }).user;
    if (!user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const saved = await saveSystemSettings(req.body as unknown, user.userId);
    res.json(saved);
  } catch (e) {
    console.error('[superAdminSettings.updateSystem] error:', e);
    res.status(500).json({ error: 'Failed to update system settings.' });
  }
}
