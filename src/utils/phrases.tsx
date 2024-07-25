import { Dictionary, Language } from "@/components/Types"

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

export const phrase = (dictionary: Dictionary, variable: string, language: Language) => {
    console.log(variable)
    return Object.keys(dictionary).length != 0 && dictionary[variable][language]
}
