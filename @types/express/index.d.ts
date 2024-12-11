import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      validatedData: any;
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

// declare namespace Express {
//   interface Request {
//     validatedData: any;
//   }
// } 
