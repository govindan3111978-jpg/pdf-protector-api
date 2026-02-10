const { encryptPDF } = require('@pdfsmaller/pdf-encrypt-lite');
const Busboy = require('busboy');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const busboy = Busboy({ headers: req.headers });
        let fileBuffer = null;
        let password = '';
        let fileName = 'protected.pdf';

        busboy.on('file', (name, file, info) => {
            const chunks = [];
            fileName = info.filename;
            file.on('data', (data) => chunks.push(data));
            file.on('end', () => { fileBuffer = Buffer.concat(chunks); });
        });

        busboy.on('field', (name, val) => {
            if (name === 'password') password = val;
        });

        busboy.on('finish', async () => {
            if (!fileBuffer || !password) {
                return res.status(400).send('Missing file or password');
            }
            const encryptedBytes = await encryptPDF(new Uint8Array(fileBuffer), password);
            res.setHeader('Content-Type', 'application/pdf');
            res.send(Buffer.from(encryptedBytes));
        });

        req.pipe(busboy);
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};
