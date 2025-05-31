import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcnUI/Avatar"
import { Button } from "@/components/shadcnUI/Button"
import { Textarea } from "@/components/shadcnUI/Textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcnUI/Select"
import { BookOpen } from "lucide-react"
import { User, Webnovel } from "@/components/Types"
import { useLanguage } from "@/contexts/LanguageContext"
import { getImageUrl } from "@/utils/urls"
import { koreanToEnglishAuthorName } from "@/utils/webnovelUtils"

export default function AskAuthorPageWrapper({ author, content }: { author: User, content: Webnovel }) {
    const { language, dictionary } = useLanguage();

    return (
        <div className="md:max-w-screen-md w-full mx-auto p-6">
            {/* Header */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-300 mb-6">
                Ask the Author:
                {
                    content.author.nickname === 'Anonymous' ? '' :
                        language == 'ko' ?
                            content.author.nickname :
                            koreanToEnglishAuthorName[content.author.nickname as string] ?
                                koreanToEnglishAuthorName[content.author.nickname as string]
                                :
                                content.author.nickname
                }
            </h1>

            {/* Author Quote */}
            <div className="mb-8">
                <span className="text-lg text-gray-700 dark:text-gray-300">
                    &quot;Hi everyone. I&apos;m answering questions!&quot;
                </span>
                <span className="text-lg text-[#DE2B74] font-medium ml-2">
                    {
                        content.author.nickname === 'Anonymous' ? '' :
                            language == 'ko' ?
                                content.author.nickname :
                                koreanToEnglishAuthorName[content.author.nickname as string] ?
                                    koreanToEnglishAuthorName[content.author.nickname as string]
                                    :
                                    content.author.nickname
                    }
                </span>
            </div>

            {/* Question Input Section */}
            <div className="mb-12">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-2">
                        <div className="w-12 h-12 bg-[#DE2B74] rounded-full flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <Textarea
                            placeholder="Ask the author a question"
                            className="min-h-[80px] text-lg border-2 border-gray-300 focus:border-[#DE2B74] resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Answered Questions Section */}
            <div className="mb-8">
                <div className="flex md:flex-row flex-col items-start justify-between mb-6">
                    <h2 className="md:text-2xl text-xl font-bold text-gray-900 dark:text-white">ANSWERED QUESTIONS (1)</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-700">Sort By:</span>
                        <Select defaultValue="newest">
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">newest</SelectItem>
                                <SelectItem value="oldest">oldest</SelectItem>
                                <SelectItem value="popular">popular</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Question 1 */}
                <div className="mb-12">
                    <h3 className="md:text-2xl text-xl font-medium text-white bg-gray-500 dark:bg-gray-700 rounded-lg p-4 mb-6">Can you tell us a two-sentence horror story?</h3>
                    <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12 ">
                            <AvatarImage src={getImageUrl(author.picture)} alt={author.nickname} />
                            <AvatarFallback className="dark:bg-gray-500">
                                <span className="text-gray-900 dark:text-gray-300">
                                    {content.author.nickname === 'Anonymous' ? '' :
                                        language == 'ko' ?
                                            content.author.nickname :
                                            koreanToEnglishAuthorName[content.author.nickname as string] ?
                                                koreanToEnglishAuthorName[content.author.nickname as string].charAt(0).toUpperCase() + koreanToEnglishAuthorName[content.author.nickname as string].charAt(1).toUpperCase()
                                                :
                                                content.author.nickname.charAt(0).toUpperCase() + content.author.nickname.charAt(1).toUpperCase()
                                    }
                                </span>
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="mb-3">
                                <span className="text-[#DE2B74] font-medium text-lg">
                                    {
                                        content.author.nickname === 'Anonymous' ? '' :
                                            language == 'ko' ?
                                                content.author.nickname :
                                                koreanToEnglishAuthorName[content.author.nickname as string] ?
                                                    koreanToEnglishAuthorName[content.author.nickname as string]
                                                    :
                                                    content.author.nickname
                                    }
                                </span>
                                <span className="text-gray-900 dark:text-gray-300 text-lg ml-2">
                                    Thirteen bodies were buried in the basement of the house on Crown Drive. I killed them all, except for
                                    one.
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-gray-500 dark:text-gray-300 text-xs">
                                <span>92 Likes</span>
                                <span>•</span>
                                <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-300 hover:text-[#DE2B74] p-0 h-auto">
                                    Like
                                </Button>
                                <span>•</span>
                                <span>24 Comments</span>
                            </div>
                        </div>
                    </div>
                </div>


            </div>
            <div className="h-[20vh]" />
        </div>
    )
}
