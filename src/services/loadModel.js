const tf = require('@tensorflow/tfjs');
async function loadModel() {
    return tf.loadGraphModel(process.env.MODEL_URL);
}
module.exports = loadModel;