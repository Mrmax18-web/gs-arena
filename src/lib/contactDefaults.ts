export interface ContactInfo {
  email: string;
  instagram: string;
  instagramUrl: string;
  whatsappCommunity: string;
  phoneNumbers: string[];
  discord?: string;
  discordUrl?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_CONTACT_INFO: ContactInfo = {
  email: 'gsarena704@gmail.com',
  instagram: '@gs_arena07',
  instagramUrl: 'https://instagram.com/gs_arena07',
  whatsappCommunity: 'https://chat.whatsapp.com/JvRmZreghqbGB7oQFP6c27',
  phoneNumbers: [
    '7828124941',
    '7724090235',
    '6268183798',
    '8989282874',
  ],
  discord: '',
  discordUrl: '',
};
