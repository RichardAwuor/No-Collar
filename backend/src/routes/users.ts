import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import { scryptSync, randomBytes } from 'crypto';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { encryptIdentity } from '../utils/encryption.js';

// Hash password using scrypt (built-in Node.js crypto)
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function registerUserRoutes(app: App, fastify: FastifyInstance) {
  // POST /api/users/register-client
  fastify.post('/api/users/register-client', {
    schema: {
      description: 'Register a new client user',
      tags: ['users'],
      body: {
        type: 'object',
        required: ['email', 'firstName', 'lastName', 'county', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          county: { type: 'string' },
          password: { type: 'string' },
          organizationName: { type: 'string' },
          isOrganization: { type: 'boolean', default: false },
        },
      },
      response: {
        201: {
          description: 'Client registered successfully',
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            userType: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        500: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (
    request: FastifyRequest<{
      Body: {
        email?: string;
        firstName?: string;
        lastName?: string;
        county?: string;
        password?: string;
        organizationName?: string;
        isOrganization?: boolean;
      };
    }>,
    reply: FastifyReply
  ) => {
    const {
      email,
      firstName,
      lastName,
      county,
      password,
      organizationName,
      isOrganization = false,
    } = request.body;

    app.logger.info({ email, firstName, lastName, county }, 'Registering client');

    try {
      // Validate required fields
      if (!firstName || !lastName || !email || !county || !password) {
        app.logger.warn(
          { email, hasfirstName: !!firstName, hasLastName: !!lastName, hasCounty: !!county, hasPassword: !!password },
          'Client registration: missing required fields'
        );
        return reply.status(400).send({
          error: 'Please provide all required fields: first name, last name, email, county, and password',
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        app.logger.warn({ email }, 'Client registration: invalid email format');
        return reply.status(400).send({
          error: 'Please provide a valid email address',
        });
      }

      // Validate password length
      if (password.length < 6) {
        app.logger.warn({ email }, 'Client registration: password too short');
        return reply.status(400).send({
          error: 'Password must be at least 6 characters long',
        });
      }

      // Check if email already exists
      const existingUser = await app.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email));

      if (existingUser.length > 0) {
        app.logger.warn({ email }, 'Client registration: email already exists');
        return reply.status(400).send({
          error: 'An account with this email already exists',
        });
      }

      // Hash password
      const passwordHash = hashPassword(password);
      app.logger.debug({ email }, 'Password hashed');

      // Create user with password hash if the column exists in the schema
      const userValues: any = {
        email,
        firstName,
        lastName,
        county,
        organizationName: isOrganization ? organizationName || null : null,
        userType: 'client',
        emailConfirmed: false,
      };

      // Add password hash if the field is available in the schema
      if ('passwordHash' in schema.users) {
        (userValues as any).passwordHash = passwordHash;
      }

      const [user] = await app.db
        .insert(schema.users)
        .values(userValues)
        .returning();

      app.logger.info({ userId: user.id, email }, 'Client registered successfully');

      return reply.status(201).send({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
      });
    } catch (error: any) {
      app.logger.error({ err: error, email }, 'Failed to register client');
      return reply.status(500).send({
        error: 'Something went wrong. Please try again.',
      });
    }
  });

  // POST /api/users/register-provider
  fastify.post('/api/users/register-provider', {
    schema: {
      description: 'Register a new service provider with profile picture, services, and commute distance',
      tags: ['users'],
      body: {
        type: 'object',
        required: ['email', 'firstName', 'lastName', 'gender', 'dateOfBirth', 'identityNumber', 'county', 'commuteDistance', 'phoneNumber', 'services', 'training'],
        properties: {
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          gender: { type: 'string', enum: ['Male', 'Female'], description: 'Provider gender (Male or Female)' },
          dateOfBirth: { type: 'string', format: 'date', description: 'Date of birth (YYYY-MM-DD)' },
          identityNumber: { type: 'string', description: 'National ID number (encrypted)' },
          county: { type: 'string', description: 'County code (3-letter, e.g., NBI, MSA)' },
          commuteDistance: { type: 'integer', minimum: 1, maximum: 100, description: 'Max commute distance in km (1-100)' },
          phoneNumber: { type: 'string', description: 'Phone number for communication' },
          photoUrl: { type: 'string', description: 'URL of uploaded profile picture (full body photo)' },
          services: { type: 'array', items: { type: 'string' }, description: 'Array of service categories provider offers' },
          training: { type: 'array', items: { type: 'string' }, description: 'Array of training/certifications' },
        },
      },
      response: {
        201: {
          description: 'Provider registered successfully',
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                userType: { type: 'string' },
              },
            },
            provider: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                providerCode: { type: 'string' },
                photoUrl: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (
    request: FastifyRequest<{
      Body: {
        email: string;
        firstName: string;
        lastName: string;
        gender: 'Male' | 'Female';
        dateOfBirth: string;
        identityNumber: string;
        county: string;
        commuteDistance: number;
        phoneNumber: string;
        photoUrl?: string;
        services: string[];
        training: string[];
      };
    }>,
    reply: FastifyReply
  ) => {
    const { email, firstName, lastName, gender, dateOfBirth, identityNumber, county, commuteDistance, phoneNumber, photoUrl, services, training } = request.body;
    app.logger.info({ email, firstName, lastName, county }, 'Registering provider');

    try {
      const existingUser = await app.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email));

      if (existingUser.length > 0) {
        app.logger.warn({ email }, 'User already exists');
        return reply.status(400).send({ error: 'Email already registered' });
      }

      // Get county info for provider code generation
      const countyInfo = await app.db
        .select()
        .from(schema.counties)
        .where(eq(schema.counties.code, county));

      if (countyInfo.length === 0) {
        app.logger.warn({ county }, 'Invalid county code');
        return reply.status(400).send({ error: 'Invalid county code' });
      }

      const countyNum = String(countyInfo[0].id).padStart(2, '0');
      const countyCode = county;

      // Generate provider code: [COUNTY_CODE][COUNTY_NUMBER]-[AUTO_INCREMENT]
      const allProviders = await app.db
        .select()
        .from(schema.serviceProviders);

      // Count existing providers with same county code
      const countyPrefix = `${countyCode}${countyNum}-`;
      const existingProviders = allProviders.filter((p) => p.providerCode.startsWith(countyPrefix));

      const nextIncrement = String(existingProviders.length + 1).padStart(4, '0');
      const providerCode = `${countyCode}${countyNum}-${nextIncrement}`;

      // Create user
      const [user] = await app.db
        .insert(schema.users)
        .values({
          email,
          firstName,
          lastName,
          county,
          userType: 'provider',
          emailConfirmed: false,
        })
        .returning();

      // Create service provider
      const [provider] = await app.db
        .insert(schema.serviceProviders)
        .values({
          userId: user.id,
          gender,
          dateOfBirth,
          identityNumber: encryptIdentity(identityNumber),
          providerCode,
          photoUrl: photoUrl || '', // Use provided photo URL or empty string
          commuteDistance,
          phoneNumber,
          subscriptionStatus: 'expired',
        })
        .returning();

      // Add services
      if (services.length > 0) {
        await app.db.insert(schema.providerServices).values(
          services.map((service) => ({
            providerId: provider.id,
            serviceCategory: service,
          }))
        );
      }

      // Add training
      if (training.length > 0) {
        await app.db.insert(schema.providerTraining).values(
          training.map((trainingName) => ({
            providerId: provider.id,
            trainingName,
          }))
        );
      }

      app.logger.info({ userId: user.id, providerId: provider.id, providerCode }, 'Provider registered successfully');

      return reply.status(201).send({
        user: {
          id: user.id,
          email: user.email,
          userType: user.userType,
        },
        provider: {
          id: provider.id,
          providerCode,
          photoUrl: provider.photoUrl || null,
        },
      });
    } catch (error) {
      app.logger.error({ err: error, email }, 'Failed to register provider');
      throw error;
    }
  });

  // POST /api/users/confirm-email
  fastify.post('/api/users/confirm-email', {
    schema: {
      description: 'Confirm user email with verification code',
      tags: ['users'],
      body: {
        type: 'object',
        required: ['email', 'code'],
        properties: {
          email: { type: 'string', format: 'email' },
          code: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: { success: { type: 'boolean' } },
        },
      },
    },
  }, async (
    request: FastifyRequest<{ Body: { email: string; code: string } }>,
    reply: FastifyReply
  ) => {
    const { email, code } = request.body;
    app.logger.info({ email }, 'Confirming email');

    try {
      // In a real app, verify the code against stored verification codes
      // For now, we'll just mark the email as confirmed
      await app.db
        .update(schema.users)
        .set({ emailConfirmed: true })
        .where(eq(schema.users.email, email));

      app.logger.info({ email }, 'Email confirmed successfully');

      return { success: true };
    } catch (error) {
      app.logger.error({ err: error, email }, 'Failed to confirm email');
      throw error;
    }
  });
}
