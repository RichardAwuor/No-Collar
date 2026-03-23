// paymentLogger.ts

import { performance } from 'perf_hooks';

const logPaymentAPI = async (apiCall: () => Promise<any>, apiName: string) => {
    const start = performance.now();
    console.log(`Request to ${apiName} started...`);
    try {
        const response = await apiCall();
        const end = performance.now();
        console.log(`Request to ${apiName} completed in ${(end - start).toFixed(2)} ms`);
        console.log(`Response:`, response);
        return response;
    } catch (error) {
        const end = performance.now();
        console.error(`Request to ${apiName} failed in ${(end - start).toFixed(2)} ms`);
        console.error(`Error:`, error);
        throw error;
    }
};

export default logPaymentAPI;
