import DictionaryPhrase from '@/components/DictionaryPhrase';
import Image from 'next/image';

export default function ToonyzCutLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className='md:max-w-screen-lg w-full mx-auto'>
            <div 
                className='flex flex-col h-full bg-gray-300'
                style={{
                    backgroundImage: `url('/images/toonyzcut_header.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                <div className='px-14 py-14'>
                    <div className='flex flex-row items-center gap-2'>
                        <Image
                            src='/toonyz_logo_pink.svg' 
                            alt='toonyzLogo' 
                            width={141} 
                            height={32} 
                        />
                        <p className='text-[2.3rem] font-extrabold text-white'>Cut</p>
                    </div>

                    <div className='flex flex-col items-center gap-2'>
                        <p className='text-[1rem] font-normal w-full text-white'>
                            <DictionaryPhrase phraseVar='toonyzcut_phrase_1' />
                        </p>
                        <p className='text-[1rem] font-normal w-full text-white'>
                            <DictionaryPhrase phraseVar='toonyzcut_phrase_2' />
                        </p>
                        <p className='text-[1rem] font-normal w-full text-white'>
                            <DictionaryPhrase phraseVar='toonyzcut_phrase_3' />
                        </p>
                        <p className='text-[1rem] font-normal w-full text-white'>
                            <DictionaryPhrase phraseVar='toonyzcut_phrase_4' />
                        </p>
                        <p className='text-[1rem] font-normal w-full text-white'>
                            Toonyz Cut Is An Open Call for Innovative Production Proposals
                        </p>
                    </div>
                </div>
            </div>
            {children}
        </div>
    );
}
