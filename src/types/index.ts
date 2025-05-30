export interface IdentifyRequest {
    email?: string;
    phoneNumber?: string;
  }
  
  export interface ContactResponse {
    primaryContactId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  }
  
  export interface IdentifyResponse {
    contact: ContactResponse;
  }