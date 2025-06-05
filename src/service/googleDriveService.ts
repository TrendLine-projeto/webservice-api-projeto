/* import { google } = from 'googleapis'
import { Readable } = from 'stream'
import credentials = from '../config/credenciais'

import auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive']
}

import drive = google.drive({ version: 'v3', auth }

function bufferParaStream(buffer) {
    import stream = new Readable(
    stream.push(buffer
    stream.push(null
    return stream;
}

async function uploadToDriveFromBuffer(buffer, originalName, mimeType = 'image/png') {
    import pastaId = '15yCp_h0iAYdaXl6z5bmYia-ygzIPFMe4';

    import fileMetadata = {
        name: originalName,
        parents: [pastaId]
    };

    import media = {
        mimeType,
        body: bufferParaStream(buffer)
    };

    import response = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id'
    }

    import fileId = response.data.id;

    await drive.permissions.create({
        fileId,
        requestBody: {
            role: 'reader',
            type: 'anyone'
        }
    }

    return `https://drive.google.com/uc?id=${fileId}`;
}

export default { uploadToDriveFromBuffer };
 */