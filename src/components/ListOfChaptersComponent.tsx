import { Chapter, Webnovel } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import { phrase } from '@/utils/phrases';
import OtherTranslateComponent from "./OtherTranslateComponent";
import { useEffect, useState } from "react";
import moment from 'moment';
import { Button, Modal, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ThemeProvider } from "@mui/material";
import { style } from '@/styles/ModalStyles';
import { bwTheme, wbTheme } from "@/styles/BlackWhiteButtonStyle";
import { styled } from '@mui/system';
import { usePathname, useRouter } from 'next/navigation';

const StyledTableCell = styled(TableCell)({
    padding: '16px',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
    },
  });
  
const StyledTableContainer = styled(TableContainer)({
    maxHeight: '80vh',
    border: '1px solid rgba(224, 224, 224, 1)',  // Add a subtle border
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',     // Add box shadow
});


const ListOfChaptersComponent = ({ webnovel }: { webnovel: Webnovel | undefined }) => {
    const { dictionary, language } = useLanguage();
    const [key, setKey] = useState(0);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteChapterId, setDeleteChapterId] = useState<number | null>(null);
    const date = new Date();
    const router = useRouter();

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

    const handleChapterDelete = async (id: number) => {
        try {
            const res = await fetch(`/api/delete_chapter?id=${id}`);
            if (res.ok) {
                setShowDeleteModal(false);
                setTimeout(() => {
                    window.location.href = `/view_webnovels?id=${webnovel?.id}`;
                }, 100);
            } else {
                console.error('Failed to delete chapter');
            }
        } catch (error) {
            console.error('Error deleting chapter:', error);
        }
    }

    return (
        <StyledTableContainer>
            <Table aria-label="simple table">
                <TableBody>
                    {webnovel?.chapters && webnovel.chapters.length > 0 ? (
                        webnovel.chapters
                            .sort(sortFn)
                            .map((chapter, index) => (
                                <TableRow key={index}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <StyledTableCell scope="row">
                                            <div className="flex flex-col space-y-4">
                                                <div className="group/edit flex flex-row space-x-4 items-center transition ease-in-out duration-300 delay-150">
                                                    <h2 className="text-xl font-bold mx-2">{index + 1}</h2>
                                                    <div className="flex-1">
                                                        <div className="flex flex-row space-x-4 mb-2">
                                                            <Link href={`/chapter_view/${chapter.id}`}>
                                                                <OtherTranslateComponent key={key} content={chapter.title} elementId={chapter.id.toString()} elementType="chapter" classParams="max-w-64 md:max-w-128 truncate whitespace-nowrap" />
                                                            </Link>
                                                        </div>
                                                        <div className="flex flex-row space-x-4 text-[10px]">
                                                            <p>{moment(new Date(chapter.created_at)).format('YYYY/MM/DD')}</p>
                                                            <p className='text-[10px]'><i className="fa-solid fa-eye"></i> {chapter.views}</p>
                                                            <p className='text-[10px]'><i className="fa-regular fa-heart"></i> {chapter.upvotes}</p>
                                                            <p className='text-[10px]'><i className="fas fa-comment-dots"></i> {chapter.comments.length}</p>
                                                        
                                                        </div>
                                                    </div>
                                                    {/* delete button */}
                                                    <button className="transition ease-in-out duration-300 delay-150 hover:bg-gray-200 p-2 rounded-md group-hover/edit:block hidden" 
                                                     onClick={() => {
                                                        setShowDeleteModal(true);
                                                        setDeleteChapterId(chapter.id);
                                                    }}>
                                                        <i className="fa-solid fa-trash"></i>
                                                    </button>
                                                   {/* delete button */}
                                                </div>
                                            </div>                      
                                    </StyledTableCell>
                                       <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
                                        <Box sx={style}>
                                            <div className='flex flex-col space-y-4 items-center justify-center'>
                                                <p className='text-lg font-bold'>{phrase(dictionary, "deleteWebnovelConfirm", language)}</p>
                                                <Button color='gray' variant='outlined' className='mt-10 w-32' onClick={() => handleChapterDelete(deleteChapterId as number)}>{phrase(dictionary, "yes", language)}</Button>
                                                <Button color='gray' variant='outlined' className='mt-10 w-32' onClick={() => setShowDeleteModal(false)}>{phrase(dictionary, "no", language)}</Button>
                                            </div>
                                        </Box>
                                        </Modal>
                                </TableRow>
                            ))
                    ) : (
                        <TableRow>
                            <div className="w-full flex justify-center">
                                <div className="py-8 text-gray-500 text-sm">
                                    {phrase(dictionary, "noChaptersAvailable", language)}
                                </div>
                            </div>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </StyledTableContainer>
    )
}
export default ListOfChaptersComponent;