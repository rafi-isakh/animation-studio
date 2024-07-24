const phrases = async () => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_phrases`)
        const dictionary = await response.json()
        return dictionary
    }
    catch (error) {
        console.log("Error retrieving dictionary", error)
        throw new Error("Error retrieving dictionary",);
    }
}

export default phrases