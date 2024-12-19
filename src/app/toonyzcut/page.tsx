'use client'
import Image from 'next/image';
import { useState } from 'react';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { Box } from '@mui/material';
import { Button } from '@mui/material';
import { ArrowDownUp } from 'lucide-react';





export default function Toonyzcut() {

    const [logoWidth, setLogoWidth] = useState(141);
    const [logoHeight, setLogoHeight] = useState(32);
    const [tabValue, setTabValue] = useState('1');

    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setTabValue(newValue);
    };

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
                        width={logoWidth} 
                        height={logoHeight} 
                        className=''
                         />
                    <p className='text-[2.3rem] font-extrabold text-white'>Cut</p>
                </div>

                <div className='flex flex-col items-center gap-2'>
                    <p className='text-[1rem] font-normal w-full w-[350px] text-white'>
                        현실을 넘어, 여러분의 이야기로 크리에이터와 영상 제작사를 연결해 드려요. <br/>
                        글로벌 스토리텔링, 영상과 웹툰의 창조적 만남을 창조해 드립니다. <br/>
                        크리에이터님들의 소중한 작품이 영상화 될 수 있는 기회를 잡으세요. <br/>
                        웹툰과 영상의 완벽한 조화, 당신의 이야기를 빛내 보세요.
                    </p>

                    <p className='text-[1rem] font-normal w-full w-[350px] text-white'>
                      Toonyz Cut Is An Open Call for Innovative Production Proposals
                    </p>
                </div>
              </div>

            </div>


            <div className='flex flex-col items-center gap-2 '>
               

            <TabContext value={tabValue} >
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }} className='dark:text-gray-700'>
                    <div className="flex flex-row justify-between items-center">
                        <TabList
                            onChange={handleChange}
                            aria-label="lab API tabs"
                            sx={{
                                '& .MuiTab-root': {
                                    color: 'gray', // Default tab color
                                    '&.Mui-selected': {
                                        color: '#8A2BE2', // Color when tab is selected
                                    },
                                },
                                '& .MuiTabs-indicator': {
                                    backgroundColor: '#8A2BE2', // Indicator color
                                }
                            }}
                            className={`first-line:dark:text-white  dark:focus:text-[#8A2BE2] dark:active:text-[#8A2BE2]
                                     `}
                             >
                            <Tab 
                               label={
                                <>
                               1
                                </>
                            }
                                value="1" 
                                className="dark:text-white dark:focus:text-[#8A2BE2] dark:active:text-[#8A2BE2]
                                 md:w-auto sm:w-[10px]
                                " />
                            <Tab label={
                                <>
                               2
                                </>
                            }
                                value="2" 
                                className="dark:text-white  dark:focus:text-[#8A2BE2] dark:active:text-[#8A2BE2]
                                md:w-auto sm:w-[10px]
                                " />
                          
                        </TabList>
                        <div className='self-center text-sm'>
                            <Button
                                variant="text"
                                className="bg-white text-black hover:text-[#8A2BE2] px-2 py-1 rounded-md flex flex-row items-center gap-2">
                                <span className="hidden md:flex">
                                    button
                                </span>
                            </Button>
                        </div>
                    </div>
                </Box>

                <TabPanel value="1">
                     <div className='flex flex-col items-center gap-2 md:max-w-screen-lg w-full'>
                        1
                     </div>
                </TabPanel>
                <TabPanel value="2">
                    <div className='flex flex-col items-center gap-2 md:max-w-screen-lg w-full'>
                        2
                     </div>


                </TabPanel>
            
            </TabContext>

            </div>
          
          
        </div>
    )
}