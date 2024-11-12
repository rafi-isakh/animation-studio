import React from 'react'
import { formatTitle } from '../utils/stringUtils'

const CharacterSection: React.FC<{ title: string; data: Record<string, string> }> = ({ title, data }) => (
    <section className="bg-gray-100 border rounded border-gray-200 px-3 text-black dark:text-black">
      <h2 className="font-bold text-lg py-2 border-gray border-b-2">{title}</h2>
      <div className="py-6 space-y-4">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="w-full flex flex-row">
            <span className="border-pink-200 rounded-md px-4 bg-pink-200 w-32 text-[12px] justify-center self-center text-center">
                     {formatTitle(key)}
            </span> 
            <p className="ml-4">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );

  export default CharacterSection;
