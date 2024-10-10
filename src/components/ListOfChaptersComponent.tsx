import { Chapter, Webnovel } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import { phrase } from '@/utils/phrases';
import OtherTranslateComponent from "./OtherTranslateComponent";
import { useEffect, useState } from "react";
import moment from 'moment';
import { Button, Card, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ThemeProvider } from "@mui/material";
import { bwTheme, wbTheme } from "@/styles/BlackWhiteButtonStyle";
import { styled } from '@mui/system';

const ListOfChaptersComponent = ({ webnovel }: { webnovel: Webnovel | undefined }) => {
    const { dictionary, language } = useLanguage();
    const [key, setKey] = useState(0);
    const date = new Date();

    useEffect(() => {
        setKey(prevKey => prevKey + 1)
    }, [language])

    const sortFn = (a: Chapter, b: Chapter) => {
        const aDate = new Date(a.created_at).getTime()
        const bDate = new Date(b.created_at).getTime()
        return aDate - bDate
    }

    const NoCapsButton = styled(Button)({
        textTransform: 'none',
    });


    return (
        <TableContainer component={Paper} >
            <Table>
                <TableBody>
                    {(() => {
                        const chapters = webnovel?.chapters;
                        return (
                            chapters?.sort(sortFn)
                                .map((chapter, index) => (
                                    <TableRow key={index}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell scope="row">
                                            <Link href={`/chapter_view/${chapter.id}`}>
                                                <div className="flex flex-col space-y-4">
                                                    <div className="flex flex-row space-x-4 items-center">
                                                        <h2 className="text-xl font-bold">{index + 1}</h2>
                                                        <div>
                                                            <div className="flex flex-row space-x-4">
                                                                <OtherTranslateComponent key={key} content={chapter.title} elementId={chapter.id.toString()} elementType="chapter" classParams="max-w-64 md:max-w-128 truncate whitespace-nowrap" />
                                                            </div>
                                                            <div className="flex flex-row space-x-4">
                                                                <p>{moment(new Date(chapter.created_at)).format('YYYY/MM/DD')}</p>
                                                                <p className='text-sm'><i className="fa-solid fa-eye"></i> {chapter.views}</p>
                                                                <p className='text-sm '><i className="fa-regular fa-heart"></i> {chapter.upvotes}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                        )
                    })()}
                </TableBody>
            </Table>
        </TableContainer>
    )
}
export default ListOfChaptersComponent;