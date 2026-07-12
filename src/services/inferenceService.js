const tf = require('@tensorflow/tfjs');
const InputError = require('../exceptions/InputError');

async function predictClassification(model, image) {
    try {

        let imageBuffer;
        if (Buffer.isBuffer(image)) {
            imageBuffer = image;
        } else if (image._data) {

            imageBuffer = image._data;
        } else if (typeof image.pipe === 'function') {

            const chunks = [];
            for await (const chunk of image) {
                chunks.push(chunk);
            }
            imageBuffer = Buffer.concat(chunks);
        } else {
            throw new InputError('Terjadi kesalahan dalam melakukan prediksi');
        }

        const jpeg = require('jpeg-js');
        const { width, height, data } = jpeg.decode(imageBuffer, { useTArray: true });

        const numChannels = 3;
        const numPixels = width * height;
        const rgbValues = new Int32Array(numPixels * numChannels);

        for (let i = 0; i < numPixels; i++) {
            for (let c = 0; c < numChannels; c++) {
                rgbValues[i * numChannels + c] = data[i * 4 + c];
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