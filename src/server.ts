import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { generateFromImage } from './index';
import { formatMarkdown } from './output/formatters/markdown';
import { formatPlaywright } from './output/formatters/playwright';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../public')));

const storage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `figma2tests-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPEG, and WebP images are accepted'));
    }
  },
});

app.post('/api/generate', upload.single('image'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image file provided' });
    return;
  }

  const tmpPath = req.file.path;

  try {
    const { result, outputDir } = await generateFromImage(tmpPath, 'output');
    res.json({
      result,
      outputDir,
      markdown: formatMarkdown(result),
      playwright: formatPlaywright(result),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  } finally {
    fs.unlink(tmpPath, () => {});
  }
});

app.get('/api/download/:runId/:file', (req, res) => {
  const { runId, file } = req.params;
  const allowed = ['test-cases.md', 'test-cases.xlsx', 'tests.spec.ts', 'analysis.json'];

  if (!allowed.includes(file)) {
    res.status(404).send('Not found');
    return;
  }

  const filePath = path.resolve('output', runId, file);

  if (!fs.existsSync(filePath)) {
    res.status(404).send('File not found');
    return;
  }

  res.download(filePath);
});

app.listen(PORT, () => {
  console.log(`figma2tests UI → http://localhost:${PORT}`);
});
