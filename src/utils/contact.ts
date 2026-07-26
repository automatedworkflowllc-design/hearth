/**
 * Turn a display phone string into one dialable target.
 * Some listings expose a short code plus an alternate number (for example
 * "211 or (352) 332-4636"); the first advertised route is the primary action.
 */
export function phoneHref(phone: string): string {
  const primary = phone.split(/\bor\b/i)[0].trim();
  const dialable = primary.replace(/[^\d+]/g, '');
  return `tel:${dialable}`;
}

/** Normalize structured contacts, with a narrow bridge for older provider payloads. */
export function getResourceContacts(resource: Resource): ContactMethod[] {
  if (resource.contacts?.length) return resource.contacts;
  const contacts: ContactMethod[] = [];
  if (resource.phone) {
    contacts.push({
      type: 'phone',
      label: 'Call',
      value: resource.phone,
      href: phoneHref(resource.phone),
      primary: true,
    });
  }
  if (resource.email) {
    contacts.push({
      type: 'email',
      label: 'Email',
      value: resource.email,
      href: `mailto:${resource.email}`,
    });
  }
  if (resource.website) {
    contacts.push({
      type: 'website',
      label: 'Official website',
      value: resource.website,
      href: resource.website,
      primary: contacts.length === 0,
    });
  }
  return contacts;
}

export function getPrimaryContact(resource: Resource): ContactMethod | undefined {
  const contacts = getResourceContacts(resource);
  return contacts.find((contact) => contact.primary) ?? contacts[0];
}
import type { ContactMethod, Resource } from '../types/index';
