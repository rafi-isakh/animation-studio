'use client'
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/shadcnUI/Dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import Link from "next/link";
import { useTheme } from '@/contexts/providers'
import { useReader } from '@/contexts/ReaderContext';
import { Slider } from '@/components/shadcnUI/Slider';
import { Switch } from '@/components/shadcnUI/Switch';
import { Label } from '@/components/shadcnUI/Label';
import { Moon, Sun } from 'lucide-react';

export const ViewerSettingDialog = ({ showIsViewerModal, setShowIsViewerModal }: { showIsViewerModal: boolean, setShowIsViewerModal: (showIsViewerModal: boolean) => void }) => {
    const { dictionary, language } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const {
        fontSize = 16,
        setFontSize,
        fontFamily = 'default',
        setFontFamily,
        lineHeight = 1.5,
        setLineHeight,
        scrollType = 'vertical',
        setScrollType,
        setPage
    } = useReader();

    return (
        <Dialog open={showIsViewerModal} onOpenChange={setShowIsViewerModal} modal={false}>
            <DialogContent
                className="md:max-w-md select-none no-scrollbar bg-white dark:bg-[#211F21] rounded-xl"
                onClick={(e) => e.stopPropagation()}
                showCloseButton={true}
            >
                <div className='flex flex-col space-y-4 text-black dark:text-white'>
                    <DialogHeader>
                        <DialogTitle className='text-xl'>
                            {/* View Settings */}
                            {phrase(dictionary, "viewSettings", language)}
                        </DialogTitle>
                        <hr className='my-2 border-gray-200' />
                    </DialogHeader>

                    <div className='text-sm justify-between md:flex hidden'>
                        {/* 넘김 방식 */}
                        {phrase(dictionary, "scrollType", language)}
                        <div className='flex flex-row gap-2'>
                            <Link href='' className='text-gray-300' onClick={() => setScrollType('vertical')}>
                                {/* 스크롤 */}
                                {phrase(dictionary, "viewSettings_scroll", language)}
                            </Link>
                            <Link href='' className='text-gray-500' onClick={() => setScrollType('horizontal')}>
                                {/* 페이지 */}
                                {phrase(dictionary, "viewSettings_page", language)}
                            </Link>
                        </div>
                    </div>
                    <div className='text-sm flex justify-between'>
                        {/* 테마  */}
                        {phrase(dictionary, "theme", language)}
                        <div className="flex flex-row items-center justify-between gap-x-3">
                            <div className="flex items-center gap-1">
                                {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                                <Label htmlFor="dark-mode">Dark Mode</Label>
                            </div>
                            <Switch
                                id="dark-mode"
                                checked={theme === 'dark'}
                                onCheckedChange={() => toggleTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="data-[state=checked]:bg-pink-800 data-[state=unchecked]:bg-gray-200"
                            />
                        </div>

                    </div>

                    <div className='text-sm flex justify-between'>
                        {/* 글꼴  */}
                        {phrase(dictionary, "font", language)}
                        <div className='flex flex-row gap-2'>
                            <Link
                                href=''
                                onClick={() => {
                                    setFontFamily('default');
                                    console.log('Font family set to:', 'default');
                                }}
                                className={`${fontFamily === 'default' ? 'text-gray-300' : 'text-gray-500'}`}
                            >
                                {/* 기본 */}
                                {phrase(dictionary, "defaultFont", language)}
                            </Link>
                            <Link
                                href=''
                                onClick={() => setFontFamily('gowun-batang')}
                                className={`${fontFamily === 'gowun-batang' ? 'text-gray-300 gowun-batang' : 'text-gray-500'}`}
                            >
                                {/* 바탕체 */}
                                <span className='gowun-batang text-[12px]'> {phrase(dictionary, "batangFont", language)} </span>
                            </Link>
                            <Link
                                href=''
                                onClick={() => {
                                    setFontFamily('nanum-gothic');
                                    console.log('Font family set to:', 'nanum-gothic');
                                }} className={`${fontFamily === 'nanum-gothic' ? 'text-gray-300 nanum-gothic' : 'text-gray-500'}`}
                            >
                                {/* 고딕체 */}
                                <span className='nanum-gothic text-[12px]'> {phrase(dictionary, "gothicFont", language)} </span>
                            </Link>
                        </div>
                    </div>
                    <div className='text-sm flex justify-between'>
                        {/* 글자 크기 */}
                        {phrase(dictionary, "fontSize", language)}
                        <div className='flex flex-row gap-2 justify-evenly'>
                            <Link
                                href=''
                                onClick={() => setFontSize(fontSize + 2)}
                                className='text-gray-400 rounded-full border border-gray-400 px-2 self-center text-center'>
                                <i className="fas fa-plus"></i>
                            </Link>
                            <p className='w-7 self-center text-center'>{fontSize} </p>
                            <Link
                                href=''
                                onClick={() => setFontSize(fontSize - 2)}
                                className='text-gray-400 rounded-full border border-gray-400 px-2 self-center text-center'>
                                <i className="fas fa-minus"></i>
                            </Link>
                        </div>
                    </div>
                    <div className='text-sm flex justify-between'>
                        {/* 줄 간격 */}
                        {phrase(dictionary, "lineHeight", language)}
                        <div className='flex flex-row gap-2 justify-evenly'>
                            <Link
                                href=''
                                onClick={(e) => setLineHeight(lineHeight + 0.1)}
                                className='text-gray-400 rounded-full border border-gray-400 px-2 self-center text-center'>
                                <i className="fas fa-plus"></i>
                            </Link>
                            <p> {Math.round(lineHeight * 10)}% </p>
                            <Link
                                href=''
                                onClick={(e) => setLineHeight(lineHeight - 0.1)}
                                className='text-gray-400 rounded-full border border-gray-400 px-2 self-center text-center'>
                                <i className="fas fa-minus"></i>
                            </Link>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ViewerSettingDialog;