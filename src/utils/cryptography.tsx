export async function decrypt(str: string) {
    const decryptedStr = await fetch(`/api/decrypt`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encrypted: str })
    });
    const data = await decryptedStr.json();
    return data;
}