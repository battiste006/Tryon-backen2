import nc from 'next-connect';
import multer from 'multer';
import fs from 'fs';
import fetch from 'node-fetch';

const upload = multer({ dest: '/tmp' });

const handler = nc();
handler.use(upload.fields([{ name: 'userPhoto' }, { name: 'productPhoto' }]));

handler.post(async (req, res) => {
  try {
    const userPhoto = req.files['userPhoto'][0];
    const productPhoto = req.files['productPhoto'][0];

    const userBase64 = fs.readFileSync(userPhoto.path, 'base64');
    const productBase64 = fs.readFileSync(productPhoto.path, 'base64');

    const result = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        image: `data:image/jpeg;base64,${userBase64}`,
        mask: `data:image/jpeg;base64,${productBase64}`,
        prompt: "Replace the person's shirt with the style shown in the product image",
        n: 1,
        size: "512x512"
      })
    });

    const data = await result.json();
    if (data.data && data.data[0].url) {
      res.status(200).json({ result: data.data[0].url });
    } else {
      res.status(500).json({ error: 'OpenAI error', detail: data });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export const config = {
  api: {
    bodyParser: false
  }
};

export default handler;
