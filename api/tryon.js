import multer from 'multer';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { promisify } from 'util';

const upload = multer({ dest: '/tmp' });

const readFile = promisify(fs.readFile);

export const config = {
  api: {
    bodyParser: false,
  },
};

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await runMiddleware(req, res, upload.fields([
      { name: 'userPhoto' },
      { name: 'productPhoto' }
    ]));

    const userPhotoPath = req.files['userPhoto'][0].path;
    const productPhotoPath = req.files['productPhoto'][0].path;

    const userBase64 = (await readFile(userPhotoPath)).toString('base64');
    const productBase64 = (await readFile(productPhotoPath)).toString('base64');

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: `data:image/jpeg;base64,${userBase64}`,
        mask: `data:image/jpeg;base64,${productBase64}`,
        prompt: 'Replace the person’s shirt with the style shown in the product image.',
        n: 1,
        size: '512x512'
      })
    });

    const data = await response.json();

    if (!data || !data.data || !data.data[0]) {
      throw new Error('Invalid OpenAI response');
    }

    res.status(200).json({ url: data.data[0].url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}
