import { Request, Response, NextFunction } from 'express';
import { IdentityService } from '../services/identityService';
import { IdentifyRequest, IdentifyResponse } from '../types';

interface IdentifyRequestBody {
  email?: string;
  phoneNumber?: string;
}

interface ErrorResponse {
  error: string;
  message: string;
}

const identityService = new IdentityService();

export class IdentityController {
  constructor() {
    // Bind methods to maintain proper 'this' context
    this.identify = this.identify.bind(this);
  }

  async identify(
    req: Request<{}, IdentifyResponse | ErrorResponse, IdentifyRequestBody>,
    res: Response<IdentifyResponse | ErrorResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, phoneNumber } = req.body;

      // Basic validation
      if (!email && !phoneNumber) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Either email or phoneNumber is required'
        });
        return;
      }

      // Email validation
      if (email && !this.isValidEmail(email)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid email format'
        });
        return;
      }

      // Phone validation
      if (phoneNumber && !this.isValidPhone(phoneNumber)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid phone number format'
        });
        return;
      }

      const result = await identityService.identifyContact({
        email,
        phoneNumber
      });

      res.json({ contact: result });
    } catch (error) {
      next(error);
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    // Simple phone validation - adjust based on requirements
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }
}

// Alternative approach using arrow functions (even simpler)
export const identifyController = {
  identify: async (
    req: Request<{}, IdentifyResponse | ErrorResponse, IdentifyRequestBody>,
    res: Response<IdentifyResponse | ErrorResponse>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, phoneNumber } = req.body;

      // Basic validation
      if (!email && !phoneNumber) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Either email or phoneNumber is required'
        });
        return;
      }

      // Email validation
      if (email && !isValidEmail(email)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid email format'
        });
        return;
      }

      // Phone validation
      if (phoneNumber && !isValidPhone(phoneNumber)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid phone number format'
        });
        return;
      }

      const result = await identityService.identifyContact({
        email,
        phoneNumber
      });

      res.json({ contact: result });
    } catch (error) {
      next(error);
    }
  }
};

// Helper functions for validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  // Simple phone validation - adjust based on requirements
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}