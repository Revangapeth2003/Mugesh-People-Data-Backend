import axios from 'axios';

export const sendWhatsAppMessage = async (
  phone: string,
  message: string
): Promise<boolean> => {
  try {
    const result = await axios.post('https://your-whatsapp-api/send', {
      to: phone,
      message,
    });

    return result.status === 200;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error('Unknown error:', err);
    }

    return false; // ✅ add this
  }
};
