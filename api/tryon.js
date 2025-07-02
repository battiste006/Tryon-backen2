import express from 'express';
import multer from 'multer';
import fetch from 'node-fetch';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const upload = multer({ dest: '/tmp' });

app.use(express.json());

app.post('/api/tryon', upload.fields([{ name: 'userPhoto' }, { name: 'productPhoto' }]), async (req, res) => {
  try {
    const userPhotoPath = req.files['userPhoto'][0].path;
    const productPhotoPath = req.files['productPhoto'][0].path;

    const userBase64 = fs.readFileSync(userPhotoPath, 'base64');
    const productBase64 = fs.readFileSync(productPhotoPath, 'base64');

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        image: `data:image/jpeg;base64,${userBase64}`,
        mask: `data:image/jpeg;base64,${productBase64}`,
        prompt: "Replace the person's shirt with the style shown in the product image.",
        n: 1,
        size: "512x512"
      })
    });

    const data = await response.json();
    if (data.data && data.data[0].url) {
      res.json({ result: data.data[0].url });
    } else {
      res.status(500).json({ error: 'OpenAI error', detail: data });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
