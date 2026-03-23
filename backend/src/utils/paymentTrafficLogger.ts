import fs from 'fs';
import path from 'path';
import moment from 'moment';

const logFilePath = path.join(__dirname, 'paymentTraffic.log');

const logTraffic = (request: any, response: any, duration: number) => {
    const timestamp = moment.utc().format('YYYY-MM-DD HH:mm:ss');
    const logEntry = `\n[${timestamp}] Request: ${JSON.stringify(request)}\nResponse: ${JSON.stringify(response)}\nDuration: ${duration}ms`;

    // Log to console
    console.log(logEntry);

    // Log to file
    fs.appendFileSync(logFilePath, logEntry);
};

export default logTraffic;