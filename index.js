import express from 'express';
import multer from 'multer';
import fetch from 'node-fetch';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

app.post('/tryon', upload.fields([{ name: 'userPhoto' }, { name: 'productPhoto' }]), async (req, res) => {
  try {
    const userPhotoPath = req.files['userPhoto'][0].path;
    const productPhotoPath = req.files['productPhoto'][0].path;

    const userImageBase64 = fs.readFileSync(userPhotoPath, 'base64');
    const productImageBase64 = fs.readFileSync(productPhotoPath, 'base64');

    const resp = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        image: `data:image/jpeg;base64,${userImageBase64}`,
        mask: `data:image/jpeg;base64,${productImageBase64}`,
        prompt: "Replace the person's shirt with the style shown in the product image.",
        n: 1,
        size: "512x512"
      })
    });

    const data = await resp.json();
    if (data.data && data.data[0].url) {
      res.json({ result: data.data[0].url });
    } else {
      res.status(500).json({ error: 'OpenAI error', detail: data });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));
