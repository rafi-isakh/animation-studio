import WritingClassFooter from "@/components/UI/writingClass/ui/WritingClassFooter"

const WritingClassLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex flex-col min-h-screen !bg-white !dark:bg-white ">
            {children}
            <WritingClassFooter />
        </div>
    )
}

export default WritingClassLayout;