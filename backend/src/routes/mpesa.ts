import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import axios from 'axios';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

// M-Pesa credentials (Production Go-Live)
const CONSUMER_KEY = 'bZHFT3P37yZRT6W06xI6hbaqiR3n2A887tmi9T01ZwbjX2Ab';
const CONSUMER_SECRET = '5bBgJVgT6EO5pGuAHBG9FZxbaau7ky5LCkcYQFx8DxuFvmbOVOMAgynkZAsg6xhz';
const SHORTCODE = '4523859';
const PASSKEY = '2a7d86a26de9020e3001c3c94a0a1f90e8165efb009b9dbc8e560b9bfa0c9af3';
const SUBSCRIPTION_AMOUNT = 130;

// M-Pesa API URLs (Production Go-Live)
const AUTH_URL = 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
const C2B_REGISTER_URL = 'https://api.safaricom.co.ke/mpesa/c2b/v2/registerurl';
const STK_PUSH_URL = 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
const TRANSACTION_STATUS_URL = 'https://api.safaricom.co.ke/mpesa/transactionstatus/v1/query';

// Get M-Pesa access token
async function getMpesaAccessToken(): Promise<string> {
  try {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    const response = await axios.get(AUTH_URL, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    return response.data.access_token;
  } catch (error: any) {
    const errorMsg = error.response?.data || error.message;
    throw new Error(`Failed to get M-Pesa access token: ${JSON.stringify(errorMsg)}`);
  }
}

// Generate timestamp in format YYYYMMDDHHmmss
function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${date}${hours}${minutes}${seconds}`;
}

// Generate password for M-Pesa
function generatePassword(shortcode: string, passkey: string, timestamp: string): string {
  const str = shortcode + passkey + timestamp;
  return Buffer.from(str).toString('base64');
}

export function registerMpesaRoutes(app: App, fastify: FastifyInstance) {
  // POST /api/mpesa/subscribe
  fastify.post('/api/mpesa/subscribe', {
    schema: {
      description: 'Initiate M-Pesa STK Push for subscription payment',
      tags: ['mpesa'],
      body: {
        type: 'object',
        required: ['providerId'],
        properties: {
          providerId: { type: 'string' },
          amount: { type: 'number', default: SUBSCRIPTION_AMOUNT },
        },
      },
      response: {
        200: {
          description: 'STK Push initiated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            checkoutRequestId: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          },
        },
      },
    },
  }, async (
    request: FastifyRequest<{
      Body: { providerId: string; amount?: number };
    }>,
    reply: FastifyReply
  ) => {
    const { providerId, amount = SUBSCRIPTION_AMOUNT } = request.body;
    app.logger.info({ providerId, amount }, 'Initiating M-Pesa subscription payment');

    try {
      // Verify provider exists and get phone number
      const provider = await app.db
        .select()
        .from(schema.serviceProviders)
        .where(eq(schema.serviceProviders.id, providerId));

      if (provider.length === 0) {
        app.logger.warn({ providerId }, 'Provider not found');
        return reply.status(400).send({
          success: false,
          message: 'Provider not found'
        });
      }

      const phoneNumber = provider[0].phoneNumber;
      if (!phoneNumber) {
        app.logger.warn({ providerId }, 'Provider has no phone number');
        return reply.status(400).send({
          success: false,
          message: 'Provider phone number not found'
        });
      }

      // Format and validate phone number: must be exactly 12 digits starting with 254
      let formattedPhone = phoneNumber.replace(/\D/g, '');
      if (!formattedPhone.startsWith('254')) {
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '254' + formattedPhone.substring(1);
        } else {
          formattedPhone = '254' + formattedPhone;
        }
      }

      // Validate phone number format: exactly 12 digits, starts with 254
      if (!/^254\d{9}$/.test(formattedPhone)) {
        app.logger.warn({ phoneNumber, formattedPhone }, 'Invalid phone number format');
        return reply.status(400).send({
          success: false,
          message: 'Invalid phone number format'
        });
      }

      // Get M-Pesa access token
      let accessToken: string;
      try {
        accessToken = await getMpesaAccessToken();
      } catch (tokenError: any) {
        app.logger.error({ err: tokenError, providerId }, 'Failed to get M-Pesa access token');
        return reply.status(500).send({
          success: false,
          message: 'Failed to authenticate with M-Pesa'
        });
      }

      const timestamp = getTimestamp();
      const password = generatePassword(SHORTCODE, PASSKEY, timestamp);
      const callbackUrl = process.env.MPESA_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/mpesa/callback`;
      const merchantRequestId = `MR-${Date.now()}-${providerId}`;

      // Build STK Push request
      const stkPayload = {
        BusinessShortCode: SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount.toString(),
        PartyA: formattedPhone,
        PartyB: SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl,
        AccountReference: `Collarless-${providerId}`,
        TransactionDesc: 'Subscription payment',
      };

      app.logger.info(
        {
          shortCode: SHORTCODE,
          amount,
          msisdn: formattedPhone,
          callbackUrl,
          accountRef: `Collarless-${providerId}`,
        },
        'M-Pesa STK Push request prepared'
      );

      // Initiate STK Push
      let stkResponse;
      try {
        app.logger.info(
          {
            url: STK_PUSH_URL,
            amount,
            phoneNumber: formattedPhone,
          },
          'Sending STK Push request to M-Pesa'
        );

        stkResponse = await axios.post(STK_PUSH_URL, stkPayload, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        app.logger.info(
          {
            status: stkResponse.status,
            responseCode: stkResponse.data?.ResponseCode,
            responseDescription: stkResponse.data?.ResponseDescription,
            checkoutRequestId: stkResponse.data?.CheckoutRequestID,
            merchantRequestId: stkResponse.data?.MerchantRequestID,
          },
          'M-Pesa STK Push response received'
        );
      } catch (stkError: any) {
        const errorStatus = stkError.response?.status;
        const errorData = stkError.response?.data;
        const errorMessage = errorData?.errorMessage || errorData?.message || errorData?.ResponseDescription || stkError.message;

        app.logger.error(
          {
            err: stkError,
            providerId,
            phoneNumber: formattedPhone,
            httpStatus: errorStatus,
            mpesaErrorCode: errorData?.requestId,
            mpesaErrorMessage: errorMessage,
            mpesaFullError: errorData,
          },
          'M-Pesa STK Push API request failed'
        );

        const errorDetail = errorMessage || JSON.stringify(errorData) || 'Unknown error';
        return reply.status(errorStatus || 400).send({
          success: false,
          message: `M-Pesa API Error: ${errorDetail}`,
        });
      }

      const checkoutRequestId = stkResponse.data.CheckoutRequestID;

      if (!checkoutRequestId) {
        app.logger.error(
          { responseData: stkResponse.data },
          'M-Pesa response missing CheckoutRequestID'
        );
        return reply.status(500).send({
          success: false,
          message: 'Invalid response from M-Pesa'
        });
      }

      // Store transaction record
      await app.db.insert(schema.mpesaTransactions).values({
        providerId,
        merchantRequestId: stkResponse.data.MerchantRequestID,
        checkoutRequestId,
        phoneNumber: formattedPhone,
        amount,
        status: 'pending',
      });

      app.logger.info(
        { providerId, checkoutRequestId, phoneNumber: formattedPhone, amount },
        'STK Push payment initiated successfully'
      );

      return {
        success: true,
        message: 'STK Push sent to your phone. Complete the M-Pesa transaction to activate subscription.',
        checkoutRequestId,
      };
    } catch (error: any) {
      app.logger.error(
        { err: error, providerId, errorMessage: error.message },
        'Unexpected error during M-Pesa payment initiation'
      );
      return reply.status(500).send({
        success: false,
        message: 'Failed to initiate payment. Please try again.'
      });
    }
  });

  // POST /api/mpesa/callback
  fastify.post('/api/mpesa/callback', {
    schema: {
      description: 'M-Pesa STK Push payment callback',
      tags: ['mpesa'],
      body: {
        type: 'object',
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ResultCode: { type: 'integer' },
            ResultDesc: { type: 'string' },
          },
        },
      },
    },
  }, async (
    request: FastifyRequest<{ Body: Record<string, any> }>,
    reply: FastifyReply
  ) => {
    const body = request.body as Record<string, any>;
    app.logger.info({ callbackType: 'stk_push' }, 'M-Pesa callback received');

    try {
      const callbackData = body.Body?.stkCallback;

      if (!callbackData) {
        app.logger.warn({}, 'Invalid callback structure - missing stkCallback');
        return reply.status(200).send({
          ResultCode: 1,
          ResultDesc: 'Invalid callback',
        });
      }

      const {
        CheckoutRequestID,
        ResultCode,
        ResultDesc,
        CallbackMetadata,
      } = callbackData;

      app.logger.info(
        { checkoutRequestId: CheckoutRequestID, resultCode: ResultCode },
        'STK Push callback details'
      );

      // Find transaction
      const transaction = await app.db
        .select()
        .from(schema.mpesaTransactions)
        .where(eq(schema.mpesaTransactions.checkoutRequestId, CheckoutRequestID));

      if (transaction.length === 0) {
        app.logger.warn({ checkoutRequestId: CheckoutRequestID }, 'Transaction not found for callback');
        return reply.status(200).send({
          ResultCode: 1,
          ResultDesc: 'Transaction not found',
        });
      }

      const txn = transaction[0];

      // Handle successful payment
      if (ResultCode === 0) {
        const mpesaReceiptNumber = CallbackMetadata?.Item?.find(
          (item: any) => item.Name === 'MpesaReceiptNumber'
        )?.Value;

        const amount = CallbackMetadata?.Item?.find(
          (item: any) => item.Name === 'Amount'
        )?.Value;

        // Update transaction
        await app.db
          .update(schema.mpesaTransactions)
          .set({
            status: 'completed',
            mpesaReceiptNumber,
            resultDesc: ResultDesc,
          })
          .where(eq(schema.mpesaTransactions.id, txn.id));

        // Update provider subscription
        const subscriptionExpiresAt = new Date();
        subscriptionExpiresAt.setDate(subscriptionExpiresAt.getDate() + 30);

        await app.db
          .update(schema.serviceProviders)
          .set({
            subscriptionStatus: 'active',
            subscriptionExpiresAt,
          })
          .where(eq(schema.serviceProviders.id, txn.providerId));

        app.logger.info(
          {
            providerId: txn.providerId,
            mpesaReceiptNumber,
            amount,
            expiresAt: subscriptionExpiresAt,
          },
          'Subscription activated successfully via STK Push'
        );
      } else {
        // Payment failed
        await app.db
          .update(schema.mpesaTransactions)
          .set({
            status: 'failed',
            resultDesc: ResultDesc,
          })
          .where(eq(schema.mpesaTransactions.id, txn.id));

        app.logger.warn(
          {
            providerId: txn.providerId,
            checkoutRequestId: CheckoutRequestID,
            resultCode: ResultCode,
            resultDesc: ResultDesc,
          },
          'STK Push payment failed'
        );
      }

      // Return success to M-Pesa
      return reply.status(200).send({
        ResultCode: 0,
        ResultDesc: 'Callback processed successfully',
      });
    } catch (error) {
      app.logger.error({ err: error }, 'Error processing M-Pesa STK Push callback');
      return reply.status(200).send({
        ResultCode: 1,
        ResultDesc: 'Error processing callback',
      });
    }
  });

  // GET /api/mpesa/status/:checkoutRequestId
  fastify.get('/api/mpesa/status/:checkoutRequestId', {
    schema: {
      description: 'Get M-Pesa transaction status',
      tags: ['mpesa'],
      params: {
        type: 'object',
        required: ['checkoutRequestId'],
        properties: {
          checkoutRequestId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            checkoutRequestId: { type: 'string' },
            status: { type: 'string' },
            mpesaReceiptNumber: { type: 'string' },
            resultDesc: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (
    request: FastifyRequest<{ Params: { checkoutRequestId: string } }>,
    reply: FastifyReply
  ) => {
    const { checkoutRequestId } = request.params;
    app.logger.info({ checkoutRequestId }, 'Fetching M-Pesa transaction status');

    try {
      const transaction = await app.db
        .select()
        .from(schema.mpesaTransactions)
        .where(eq(schema.mpesaTransactions.checkoutRequestId, checkoutRequestId));

      if (transaction.length === 0) {
        app.logger.warn({ checkoutRequestId }, 'Transaction not found');
        return reply.status(404).send({ error: 'Transaction not found' });
      }

      const txn = transaction[0];
      app.logger.info({ checkoutRequestId, status: txn.status }, 'Transaction status retrieved');

      return {
        id: txn.id,
        checkoutRequestId: txn.checkoutRequestId,
        status: txn.status,
        mpesaReceiptNumber: txn.mpesaReceiptNumber || null,
        resultDesc: txn.resultDesc || null,
      };
    } catch (error) {
      app.logger.error({ err: error, checkoutRequestId }, 'Failed to fetch transaction status');
      throw error;
    }
  });
}
