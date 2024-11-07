import  * as crypto from 'crypto';

export async function decrypt(str: string) {
    const decryptedStr = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/decrypt`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encrypted: str })
    });
    const data = await decryptedStr.json();
    return data;
}

export const createEmailHash = (email: string): string => {
    return crypto
        .createHash('sha256')
        .update(email.toLowerCase())
        .digest('hex');
};