const predictClassification = require('../services/inferenceService');
const storeData = require('../services/storeData')
const crypto = require('crypto');

async function postPredictHandler(request, h) {
    const { image } = request.payload;
    const { model } = request.server.app;

    const { confidenceScore, result, suggestion } = await predictClassification(model, image);
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const data = {
        id,
        result,
        suggestion,
        createdAt,
    };

    await storeData(id, data);

    const response = h.response({
        status: 'success',
        message: 'Model is predicted successfully',
        data
    })
    response.code(201);
    return response;

}

async function getPredictHistories(request, h) {
    const { Firestore } = require('@google-cloud/firestore');
    const db = new Firestore();
    const predictCollection = db.collection('predictions');

    const snapshot = await predictCollection.get();
    const data = snapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
            id: docData.id,
            history: {
                result: docData.result,
                createdAt: docData.createdAt,
                suggestion: docData.suggestion,
                id: docData.id,
            },
        };
    });

    return h.response({
        status: 'success',
        data,
    }).code(200);
}

module.exports = { postPredictHandler, getPredictHistories };