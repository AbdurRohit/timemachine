import prisma from '../utils/database';
import { IdentifyRequest, ContactResponse } from '../types';

export class IdentityService {
  async identifyContact(data: IdentifyRequest): Promise<ContactResponse> {
    const { email, phoneNumber } = data;

    if (!email && !phoneNumber) {
      throw new Error('Either email or phoneNumber must be provided');
    }

    // Find existing contacts with matching email or phone
    const existingContacts = await prisma.contact.findMany({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phoneNumber ? [{ phoneNumber }] : [])
        ],
        deletedAt: null
      },
      orderBy: { createdAt: 'asc' }
    });

    if (existingContacts.length === 0) {
      // No existing contact found, create new primary contact
      const newContact = await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: 'primary'
        }
      });

      return {
        primaryContactId: newContact.id,
        emails: email ? [email] : [],
        phoneNumbers: phoneNumber ? [phoneNumber] : [],
        secondaryContactIds: []
      };
    }

    // Check if we need to create a new secondary contact
    const exactMatch = existingContacts.find(contact => 
      contact.email === email && contact.phoneNumber === phoneNumber
    );

    if (!exactMatch && (email || phoneNumber)) {
      // Check if we have partial matches
      const emailMatch = existingContacts.find(contact => contact.email === email);
      const phoneMatch = existingContacts.find(contact => contact.phoneNumber === phoneNumber);

      if (emailMatch && phoneMatch && emailMatch.id !== phoneMatch.id) {
        // We have different contacts for email and phone - need to consolidate
        await this.consolidateContacts(emailMatch, phoneMatch);
      } else {
        // Create new secondary contact
        const primaryContact = this.findPrimaryContact(existingContacts);
        await prisma.contact.create({
          data: {
            email,
            phoneNumber,
            linkedId: primaryContact.id,
            linkPrecedence: 'secondary'
          }
        });
      }
    }

    // Get all related contacts and return response
    return await this.getContactResponse(existingContacts[0]);
  }

  private findPrimaryContact(contacts: any[]) {
    const primary = contacts.find(c => c.linkPrecedence === 'primary');
    return primary || contacts[0];
  }

  private async consolidateContacts(contact1: any, contact2: any) {
    // Make the older contact primary and newer one secondary
    const older = contact1.createdAt < contact2.createdAt ? contact1 : contact2;
    const newer = contact1.createdAt < contact2.createdAt ? contact2 : contact1;

    // Update newer contact to be secondary to older one
    await prisma.contact.update({
      where: { id: newer.id },
      data: {
        linkedId: older.id,
        linkPrecedence: 'secondary'
      }
    });

    // Update all contacts that were linked to newer contact
    await prisma.contact.updateMany({
      where: { linkedId: newer.id },
      data: { linkedId: older.id }
    });
  }

  private async getContactResponse(baseContact: any): Promise<ContactResponse> {
    // Find the primary contact
    let primaryContact = baseContact;
    
    if (baseContact.linkPrecedence === 'secondary' && baseContact.linkedId) {
      primaryContact = await prisma.contact.findUnique({
        where: { id: baseContact.linkedId }
      });
    }

    // Get all related contacts
    const allContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { id: primaryContact.id },
          { linkedId: primaryContact.id }
        ],
        deletedAt: null
      },
      orderBy: { createdAt: 'asc' }
    });

    // Collect unique emails and phone numbers
    const emails = [...new Set(allContacts
      .map(c => c.email)
      .filter(email => email !== null)
    )] as string[];

    const phoneNumbers = [...new Set(allContacts
      .map(c => c.phoneNumber)
      .filter(phone => phone !== null)
    )] as string[];

    const secondaryContactIds = allContacts
      .filter(c => c.linkPrecedence === 'secondary')
      .map(c => c.id);

    return {
      primaryContactId: primaryContact.id,
      emails,
      phoneNumbers,
      secondaryContactIds
    };
  }
}