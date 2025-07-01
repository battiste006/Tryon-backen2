import multer from 'multer';
import nextConnect from 'next-connect';
import fs from 'fs';
import fetch from 'node-fetch';

const upload = multer({ dest: '/tmp' });
const handler = nextConnect();

handler.use(upload.single('userPhoto'));

handler.post(async (req, res) => {
  try {
    const userPhotoPath = req.file.path;
    const productImageUrl = req.body.productPhoto;

    const userImageBase64 = fs.readFileSync(userPhotoPath, 'base64');
    const productImageResp = await fetch(productImageUrl);
    const productBuffer = await productImageResp.buffer();
    const productImageBase64 = productBuffer.toString('base64');

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: `data:image/jpeg;base64,${userImageBase64}`,
        mask: `data:image/jpeg;base64,${productImageBase64}`,
        prompt: "Replace the person's shirt with the style shown in the product image.",
        n: 1,
        size: "512x512",
      }),
    });

    const data = await response.json();

    if (data.data && data.data[0].url) {
      res.status(200).json({ result: data.data[0].url });
    } else {
      res.status(500).json({ error: "OpenAI error", detail: data });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
