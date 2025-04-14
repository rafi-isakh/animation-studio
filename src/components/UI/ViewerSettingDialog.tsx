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
import { Moon, Sun, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/shadcnUI/Button';

export const ViewerSettingDialog = ({ showIsViewerModal, setShowIsViewerModal }:
    { showIsViewerModal: boolean, setShowIsViewerModal: (showIsViewerModal: boolean) => void }) => {
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
                                }} className={`${fontFamily === 'nanum-gothic' ? 'text-gray-300 nanum-gothic' : 'text-gray-500'}`}
                            >
                                {/* 고딕체 */}
                                <span className='nanum-gothic text-[12px]'> {phrase(dictionary, "gothicFont", language)} </span>
                            </Link>
                        </div>
                    </div>
                    <div className='text-sm flex justify-between'>
                        {/* 글자 크기 */}

                        <div className="space-y-2 w-full">
                            <div className="flex items-center justify-between">
                                {phrase(dictionary, "fontSize", language)}
                                <span className="text-sm text-right">{fontSize}px</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 shrink-0 rounded-full"
                                    onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                                >
                                    <Minus className="h-3 w-3" />
                                    <span className="sr-only">Decrease font size</span>
                                </Button>
                                <Slider
                                    value={[fontSize]}
                                    min={12}
                                    max={24}
                                    step={1}
                                    onValueChange={(value) => setFontSize(value[0])}
                                    className="flex-1"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 shrink-0 rounded-full"
                                    onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                                >
                                    <Plus className="h-3 w-3" />
                                    <span className="sr-only">Increase font size</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className='text-sm flex justify-between'>
                        {/* 줄 간격 */}
                        {phrase(dictionary, "lineHeight", language)}
                        <div className='flex flex-row gap-2 justify-evenly'>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 shrink-0 rounded-full"
                                onClick={(e) => setLineHeight(lineHeight - 0.1)}

                            >
                                <Minus className="h-3 w-3" />
                                <span className="sr-only">Decrease font size</span>
                            </Button>
                            <p className="text-sm self-center"> {Math.round(lineHeight * 10)}% </p>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 shrink-0 rounded-full"
                                onClick={(e) => setLineHeight(lineHeight + 0.1)}
                            >
                                <Plus className="h-3 w-3" />
                                <span className="sr-only">Increase font size</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ViewerSettingDialog;