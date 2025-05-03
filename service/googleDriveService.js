const { google } = require('googleapis');
const { Readable } = require('stream');
const credentials = require('../config/credenciais');

const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive']
});

const drive = google.drive({ version: 'v3', auth });

function bufferParaStream(buffer) {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
}

async function uploadToDriveFromBuffer(buffer, originalName, mimeType = 'image/png') {
    const pastaId = '15yCp_h0iAYdaXl6z5bmYia-ygzIPFMe4';

    const fileMetadata = {
        name: originalName,
        parents: [pastaId]
    };

    const media = {
        mimeType,
        body: bufferParaStream(buffer)
    };

    const response = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id'
    });

    const fileId = response.data.id;

    await drive.permissions.create({
        fileId,
        requestBody: {
            role: 'reader',
            type: 'anyone'
        }
    });

    return `https://drive.google.com/uc?id=${fileId}`;
}

module.exports = { uploadToDriveFromBuffer };
