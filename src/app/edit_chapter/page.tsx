import EditChapterComponent from "@/components/EditChapterComponent";

async function EditChapter({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const id = searchParams.id;
    const novelLanguage = searchParams.novelLanguage;

    if (typeof id === 'string') {
    // Handle single string value
    } else if (Array.isArray(id)) {
    // Handle array of strings
        throw new Error("there should be only one id param")
    } else {
    // Handle undefined case
        throw new Error("id param should be present")
    }

    if (typeof novelLanguage === 'string') {
        // Handle single string value
        if (novelLanguage !== 'ko' && novelLanguage !== 'en') {
            throw new Error("novelLanguage must be either 'ko' or 'en'")
        }
        } else if (Array.isArray(novelLanguage)) {
        // Handle array of strings
            throw new Error("there should be only one novelLanguage param")
        } else {
        // Handle undefined case
            throw new Error("novelLanguage param should be present")
        }

    if (id) {
        return (
            <EditChapterComponent 
                webnovelId={id as string} 
                novelLanguage={novelLanguage as 'ko' | 'en'}
            />
        );
    }
    else {
        return (
            <div></div>
        )
    }
};

export default EditChapter;