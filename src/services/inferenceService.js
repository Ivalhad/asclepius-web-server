const tf = require('@tensorflow/tfjs');
const InputError = require('../exceptions/InputError');

async function predictClassification(model, image) {
    try {
        // Hapi payload: image bisa berupa Buffer atau Readable stream
        let imageBuffer;
        if (Buffer.isBuffer(image)) {
            imageBuffer = image;
        } else if (image._data) {
            // Hapi multipart payload menyimpan buffer di _data
            imageBuffer = image._data;
        } else if (typeof image.pipe === 'function') {
            // Jika berupa stream, kumpulkan dulu ke buffer
            const chunks = [];
            for await (const chunk of image) {
                chunks.push(chunk);
            }
            imageBuffer = Buffer.concat(chunks);
        } else {
            throw new InputError('Terjadi kesalahan dalam melakukan prediksi');
        }

        // Decode JPEG menggunakan jpeg-js (pure JS, tidak perlu tfjs-node)
        const jpeg = require('jpeg-js');
        const { width, height, data } = jpeg.decode(imageBuffer, { useTArray: true });

        // Buat tensor dari raw pixel data (RGBA -> RGB)
        const numChannels = 3;
        const numPixels = width * height;
        const rgbValues = new Int32Array(numPixels * numChannels);

        for (let i = 0; i < numPixels; i++) {
            for (let c = 0; c < numChannels; c++) {
                rgbValues[i * numChannels + c] = data[i * 4 + c]; // Skip alpha channel
            }
        }

        const tensor = tf.tensor3d(rgbValues, [height, width, numChannels], 'int32')
            .resizeNearestNeighbor([224, 224])
            .expandDims()
            .toFloat();

        const prediction = model.predict(tensor);
        const score = await prediction.data();
        const resultScore = Math.max(...score) * 100;
        const result = resultScore > 50 ? 'Cancer' : 'Non-cancer';

        const suggestion =
            result === 'Cancer' ? 'Segera periksa ke dokter!' : 'Penyakit kanker tidak terdeteksi.';

        // Cleanup tensor memory
        tensor.dispose();
        prediction.dispose();

        return { confidenceScore: resultScore, result, suggestion };
    } catch (error) {
        console.error("Prediction Error:", error.message || error);
        
        if (error instanceof InputError) {
            throw error;
        }
        throw new InputError('Terjadi kesalahan dalam melakukan prediksi');
    }
}

module.exports = predictClassification;