const { postPredictHandler, getPredictHistories } = require('../server/handler');
const routes = [
    {
        path: '/predict',
        method: 'POST',
        handler: postPredictHandler,
        options: {
            payload: {
                allow: 'multipart/form-data',
                multipart: true,
                maxBytes: 1000000,
                output: 'data',
                parse: true,
            }
        }
    },
    {
        path: '/predict/histories',
        method: 'GET',
        handler: getPredictHistories,
    }
]
module.exports = routes;