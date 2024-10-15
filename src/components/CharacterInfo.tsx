import React from 'react';
import CharacterSection from './CharacterSection';
import { formatTitle } from '../utils/stringUtils';

const CharacterInfo: React.FC<{ data: string; title?: string }> = ({ data, title }) => {
    if (!data) return null;
  
    const parsedData = JSON.parse(data);

    // Filter out the "status" key
    const filteredData = Object.fromEntries(
        Object.entries(parsedData).filter(([key]) => key !== "status")
    );
  
    return (
      <div className="space-y-4">
        <h1 className="font-bold mb-10">{title}</h1>
        {Object.entries(filteredData).map(([sectionKey, sectionData]) => (
          <CharacterSection
            key={sectionKey}
            title={formatTitle(sectionKey)}
            data={sectionData as Record<string, string>}
          />
        ))}
      </div>
    );
  };

  export default CharacterInfo

