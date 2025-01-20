import React, { useState } from 'react';
import { Sparkles, HeartHandshake, Clapperboard, Banana, ShieldHalf, Swords, MessageCircleHeart } from 'lucide-react';
import Link from 'next/link';
import FavoriteIcon from '@mui/icons-material/Favorite';

const HeaderTabs = ({ language, dictionary, phrase }: { language: string, dictionary: any, phrase: any }) => {
  const [activeTab, setActiveTab] = useState('premium');

  const tabs = [
    {
      id: 'home',
      icon: <Sparkles size={20} />,
      href: '/?version=premium',
      label: phrase(dictionary, "home", language)
    },
    {
      id: 'romanceFantasy',
      icon: <HeartHandshake size={20} />,
      href: '#',
      label: phrase(dictionary, "romanceFantasy", language)
    },
    {
      id: 'romance',
      icon: <FavoriteIcon sx={{ fontSize: 20 }} />,
      href: '#',
      label: phrase(dictionary, "romance", language)
    },
    {
      id: 'fantasy',
      icon: <ShieldHalf size={20} />,
      href: '#',
      label: phrase(dictionary, "fantasy", language)
    },
    {
      id: 'bl',
      icon: <Banana size={20} />,
      href: '#',
      label: phrase(dictionary, "bl", language)
    },
    {
      id: 'action',
      icon: <Swords size={20} />,
      href: '#',
      label: phrase(dictionary, "action", language)
    }
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <div className="mx-auto md:max-w-screen-lg w-full md:mt-[4rem] mt-[5.6rem] z-[99] font-pretendard md:text-md text-sm mb-4">
      <div className="flex flex-row gap-4 items-center md:justify-center justify-start md:p-0 p-2 md:ml-0 ml-2 overflow-x-auto tracking-tight keep-all">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`w-auto flex flex-row items-center gap-2 text-md font-bold md:p-1 cursor-pointer
              transition-all duration-300 ease-in-out
              ${activeTab === tab.id 
                ? "text-[#DB2777] border-b-2 border-[#DB2777]" 
                : "text-gray-500 hover:text-[#DB2777] hover:border-b-2 hover:border-[#DB2777]"
              }`}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.icon}
            <Link href={tab.href}>
              <span className="whitespace-nowrap">{tab.label}</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeaderTabs;