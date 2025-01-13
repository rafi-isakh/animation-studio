'use client'
import { Button, TextField, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SubmitToonyzCutPage() {
    const { dictionary, language } = useLanguage();

    return (
        <div className='max-w-screen-lg mx-auto flex md:flex-row flex-col gap-10 '>
            <div className='flex flex-col md:w-2/3 max-w-[600px] md:p-0 p-5'>
                <h1 className='md:text-[2.5rem] text-3xl text-black dark:text-white md:mt-10 mt-0 md:my-5 my-1 items-start self-start'>
                {/* 투니즈컷 - 작품 등록 요청하기 */}
                {phrase(dictionary, 'toonyzcut_submit_title', language)}
                </h1>
                <p className='text-black dark:text-white my-5'>
                    {/* 투니즈컷에 작품을 등록하시면 크리에이터와 영상 제작사를 직접 연결해 드립니다. */}
                    {phrase(dictionary, 'toonyzcut_submit_description', language)}
                </p>
            </div>
            
          <div className="flex justify-center w-full px-4">
            <div className="w-full max-w-[600px]">
                <div className="flex flex-col gap-4 md:my-10 my-0 mb-10">
                    <div className="flex flex-col gap-2">
                        <label htmlFor='title' className='font-bold text-sm text-black dark:text-white'>
                            {/* 작품 제목 */}
                            {phrase(dictionary, 'toonyzcut_submit_title_label', language)}
                        </label>
                        <input 
                            type="text" 
                            placeholder={phrase(dictionary, 'toonyzcut_submit_title_placeholder', language)} 
                            name='title' 
                            className='border border-black dark:border-white p-2 rounded-md text-sm text-black dark:text-black'
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor='email' className='font-bold text-sm text-black dark:text-white'>
                            {/* 이메일 주소 */}
                            {phrase(dictionary, 'toonyzcut_submit_email_label', language)}
                        </label>
                        <input 
                            type="email" 
                            placeholder={phrase(dictionary, 'toonyzcut_submit_email_placeholder', language)} 
                            name='email' 
                            className='border border-black dark:border-white p-2 rounded-md text-sm text-black dark:text-black'
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor='link' className='font-bold text-sm text-black dark:text-white'>
                            {/* 작품 링크 */}
                            {phrase(dictionary, 'toonyzcut_submit_link_label', language)}
                        </label>
                        <input 
                            type="text" 
                            placeholder={phrase(dictionary, 'toonyzcut_submit_link_placeholder', language)} 
                            name='link' 
                            className='border border-black dark:border-white p-2 rounded-md text-sm text-black dark:text-black'
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor='link' className='font-bold text-sm text-black dark:text-white'>
                            {/* 선호 언어 */}
                            {phrase(dictionary, 'toonyzcut_submit_language_label', language)}
                        </label>
                        <input 
                            type="text" 
                            placeholder={phrase(dictionary, 'toonyzcut_submit_language_placeholder', language)} 
                            name='language' 
                            className='border border-black dark:border-white p-2 rounded-md text-sm text-black dark:text-black'
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor='platform' className='font-bold text-sm text-black dark:text-white'>
                            {/* 연재 중인 플랫폼 */}
                            {phrase(dictionary, 'toonyzcut_submit_platform_label', language)}
                        </label>
                        <input 
                            type="text" 
                            placeholder={phrase(dictionary, 'toonyzcut_submit_platform_placeholder', language)} 
                            name='platform' 
                            className='border border-black dark:border-white p-2 rounded-md text-sm text-black dark:text-black'
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor='genre' className='font-bold text-sm text-black dark:text-white'>
                            {/* 장르 (최소 1개 이상) */}
                            {phrase(dictionary, 'toonyzcut_submit_genre_label', language)}
                        </label>
                        <input 
                            type="text" 
                            placeholder={phrase(dictionary, 'toonyzcut_submit_genre_placeholder', language)} 
                            name='genre' 
                            className='border border-black dark:border-white p-2 rounded-md text-sm text-black dark:text-black'
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor='cover' className='font-bold text-sm text-black dark:text-white'>
                            {/* 작품 표지 등록 */}
                            {phrase(dictionary, 'toonyzcut_submit_cover_label', language)}
                        </label>
                        <span className="text-xs text-gray-600">
                            {/* 표지 이미지를 등록해 주세요. */}
                            {phrase(dictionary, 'toonyzcut_submit_cover_description', language)}
                        </span>
                        <input 
                            type="file" 
                            name='cover' 
                            className='text-sm'
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor='description' className='font-bold text-sm text-black dark:text-white'>
                            {/* 작품 소개 */}
                            {phrase(dictionary, 'toonyzcut_submit_description_label', language)}
                        </label>
                        <textarea 
                            placeholder={phrase(dictionary, 'toonyzcut_submit_description_placeholder', language)} 
                            name='description' 
                            rows={4}
                            className='border border-black dark:border-white p-2 rounded-md text-sm text-black dark:text-black' 
                        />
                    </div>

                    <div className="flex justify-end mt-4">
                        <Button 
                            variant='contained' 
                            className='bg-black dark:bg-white dark:text-black text-white w-[100px] text-sm'
                        >
                            {phrase(dictionary, 'toonyzcut_submit_submit_button', language)}
                        </Button>
                    </div>
                </div>
            </div>
          </div>


        </div>
    )
}